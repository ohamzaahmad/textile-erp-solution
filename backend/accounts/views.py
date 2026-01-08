from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from .models import Vendor, Customer
from .serializers import VendorSerializer, CustomerSerializer


class VendorViewSet(viewsets.ModelViewSet):
    """ViewSet for managing vendors"""
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'contact']
    ordering_fields = ['name', 'balance', 'created_at']
    ordering = ['name']
    
    @action(detail=True, methods=['get'])
    def transactions(self, request, pk=None):
        """Get all transactions for a vendor"""
        vendor = self.get_object()
        from transactions.models import Transaction
        from transactions.serializers import TransactionSerializer
        
        transactions = Transaction.objects.filter(vendor=vendor).order_by('-date')
        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def update_balance(self, request, pk=None):
        """Manually recalculate vendor balance"""
        vendor = self.get_object()
        vendor.update_balance()
        serializer = self.get_serializer(vendor)
        return Response(serializer.data)


class CustomerViewSet(viewsets.ModelViewSet):
    """ViewSet for managing customers"""
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'contact']
    ordering_fields = ['name', 'balance', 'created_at']
    ordering = ['name']
    
    @action(detail=True, methods=['get'])
    def transactions(self, request, pk=None):
        """Get all transactions for a customer"""
        customer = self.get_object()
        from transactions.models import Transaction
        from transactions.serializers import TransactionSerializer
        
        transactions = Transaction.objects.filter(customer=customer).order_by('-date')
        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def update_balance(self, request, pk=None):
        """Manually recalculate customer balance"""
        customer = self.get_object()
        customer.update_balance()
        serializer = self.get_serializer(customer)
        return Response(serializer.data)
