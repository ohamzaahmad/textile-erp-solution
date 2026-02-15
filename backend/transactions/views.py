from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.db.models import Sum, Q, Count
from datetime import datetime, timedelta
from .models import (
    Transaction, PaymentRecord, CommissionPayment, Invoice, InvoiceItem,
    Bill, BillItem
)
from .serializers import (
    TransactionSerializer, PaymentRecordSerializer, CommissionPaymentSerializer,
    InvoiceSerializer, InvoiceCreateSerializer,
    BillSerializer, BillCreateSerializer
)


class TransactionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing transactions"""
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['transaction_type', 'vendor', 'customer']
    search_fields = ['reference_id', 'description']
    ordering_fields = ['date', 'amount']
    ordering = ['-date']
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get transaction summary statistics"""
        queryset = self.filter_queryset(self.get_queryset())
        
        total_transactions = queryset.count()
        total_amount = queryset.aggregate(total=Sum('amount'))['total'] or 0
        
        by_type = {}
        for trans_type, _ in Transaction.TRANSACTION_TYPES:
            count = queryset.filter(transaction_type=trans_type).count()
            amount = queryset.filter(transaction_type=trans_type).aggregate(total=Sum('amount'))['total'] or 0
            by_type[trans_type] = {
                'count': count,
                'amount': float(amount)
            }
        
        return Response({
            'total_transactions': total_transactions,
            'total_amount': float(total_amount),
            'by_type': by_type
        })


class PaymentRecordViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing payment records"""
    queryset = PaymentRecord.objects.all()
    serializer_class = PaymentRecordSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['method', 'invoice', 'bill']
    ordering_fields = ['date', 'amount']
    ordering = ['-date']


class InvoiceViewSet(viewsets.ModelViewSet):
    """ViewSet for managing invoices"""
    queryset = Invoice.objects.all().select_related('customer', 'broker').prefetch_related('items', 'payment_records', 'commission_payments')
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'customer', 'broker', 'commission_type']
    search_fields = ['invoice_number', 'customer__name', 'broker__name']
    ordering_fields = ['date', 'due_date', 'total', 'commission_amount']
    ordering = ['-date']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return InvoiceCreateSerializer
        return InvoiceSerializer
    
    @action(detail=True, methods=['post'])
    def add_payment(self, request, pk=None):
        """Add a payment to an invoice"""
        invoice = self.get_object()
        
        # Create payment record
        payment_data = request.data.copy()
        payment_data['invoice'] = invoice.id
        
        payment_serializer = PaymentRecordSerializer(data=payment_data)
        if payment_serializer.is_valid():
            payment = payment_serializer.save()
            
            # Update invoice amount paid
            invoice.amount_paid += payment.amount
            invoice.save()
            invoice.update_status()
            
            # Create transaction record
            Transaction.objects.create(
                transaction_type='Payment',
                date=payment.date,
                amount=payment.amount,
                description=f"Payment for Invoice {invoice.invoice_number}",
                reference_id=f"PAY-{payment.id}",
                customer=invoice.customer
            )
            
            # Update customer balance
            invoice.customer.update_balance()
            
            serializer = self.get_serializer(invoice)
            return Response(serializer.data)
        
        return Response(payment_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def settle_commission(self, request, pk=None):
        """Add a partial or full commission payment to an invoice's broker commission"""
        invoice = self.get_object()

        if not invoice.broker:
            return Response({'detail': 'This invoice has no broker assigned.'}, status=status.HTTP_400_BAD_REQUEST)

        commission_remaining = invoice.commission_amount - invoice.commission_paid
        if commission_remaining <= 0:
            return Response({'detail': 'Commission already fully settled.'}, status=status.HTTP_400_BAD_REQUEST)

        # Build commission payment data
        payment_data = request.data.copy()
        payment_data['invoice'] = invoice.id

        payment_serializer = CommissionPaymentSerializer(data=payment_data)
        if payment_serializer.is_valid():
            payment = payment_serializer.save()

            # Update commission_paid on invoice
            invoice.commission_paid += payment.amount
            invoice.save()

            # Create a Settlement transaction record
            Transaction.objects.create(
                transaction_type='Settlement',
                date=payment.date,
                amount=payment.amount,
                description=f"Commission payment for Invoice {invoice.invoice_number} to broker {invoice.broker.name}",
                reference_id=f"COMM-{payment.id}",
                customer=invoice.customer
            )

            serializer = self.get_serializer(invoice)
            return Response(serializer.data)

        return Response(payment_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get invoice summary statistics"""
        queryset = self.filter_queryset(self.get_queryset())
        
        total_invoices = queryset.count()
        total_amount = queryset.aggregate(total=Sum('total'))['total'] or 0
        total_paid = queryset.aggregate(total=Sum('amount_paid'))['total'] or 0
        
        by_status = {}
        for status_value, _ in Invoice.STATUS_CHOICES:
            count = queryset.filter(status=status_value).count()
            amount = queryset.filter(status=status_value).aggregate(total=Sum('total'))['total'] or 0
            by_status[status_value] = {
                'count': count,
                'amount': float(amount)
            }
        
        return Response({
            'total_invoices': total_invoices,
            'total_amount': float(total_amount),
            'total_paid': float(total_paid),
            'outstanding': float(total_amount - total_paid),
            'by_status': by_status
        })
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue invoices"""
        from django.utils import timezone
        today = timezone.now().date()
        
        overdue_invoices = self.get_queryset().filter(
            due_date__lt=today,
            status__in=['Pending', 'Partially Paid']
        )
        
        serializer = self.get_serializer(overdue_invoices, many=True)
        return Response(serializer.data)


class BillViewSet(viewsets.ModelViewSet):
    """ViewSet for managing bills"""
    queryset = Bill.objects.all().select_related('vendor').prefetch_related('items', 'payment_records')
    serializer_class = BillSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'vendor']
    search_fields = ['bill_number', 'vendor__name']
    ordering_fields = ['date', 'due_date', 'total']
    ordering = ['-date']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return BillCreateSerializer
        return BillSerializer
    
    @action(detail=True, methods=['post'])
    def add_payment(self, request, pk=None):
        """Add a payment to a bill"""
        bill = self.get_object()
        
        # Create payment record
        payment_data = request.data.copy()
        payment_data['bill'] = bill.id
        
        payment_serializer = PaymentRecordSerializer(data=payment_data)
        if payment_serializer.is_valid():
            payment = payment_serializer.save()
            
            # Update bill amount paid
            bill.amount_paid += payment.amount
            bill.save()
            bill.update_status()
            
            # Create transaction record
            Transaction.objects.create(
                transaction_type='Payment',
                date=payment.date,
                amount=payment.amount,
                description=f"Payment for Bill {bill.bill_number}",
                reference_id=f"PAY-{payment.id}",
                vendor=bill.vendor
            )
            
            # Update vendor balance
            bill.vendor.update_balance()
            
            serializer = self.get_serializer(bill)
            return Response(serializer.data)
        
        return Response(payment_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get bill summary statistics"""
        queryset = self.filter_queryset(self.get_queryset())
        
        total_bills = queryset.count()
        total_amount = queryset.aggregate(total=Sum('total'))['total'] or 0
        total_paid = queryset.aggregate(total=Sum('amount_paid'))['total'] or 0
        
        by_status = {}
        for status_value, _ in Bill.STATUS_CHOICES:
            count = queryset.filter(status=status_value).count()
            amount = queryset.filter(status=status_value).aggregate(total=Sum('total'))['total'] or 0
            by_status[status_value] = {
                'count': count,
                'amount': float(amount)
            }
        
        return Response({
            'total_bills': total_bills,
            'total_amount': float(total_amount),
            'total_paid': float(total_paid),
            'outstanding': float(total_amount - total_paid),
            'by_status': by_status
        })
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue bills"""
        from django.utils import timezone
        today = timezone.now().date()
        
        overdue_bills = self.get_queryset().filter(
            due_date__lt=today,
            status__in=['Unpaid', 'Partially Paid']
        )
        
        serializer = self.get_serializer(overdue_bills, many=True)
        return Response(serializer.data)
