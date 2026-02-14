from decimal import Decimal
from rest_framework import serializers
from .models import (
    Transaction, PaymentRecord, Invoice, InvoiceItem, 
    Bill, BillItem
)
from inventory.serializers import InventoryItemSerializer


class TransactionSerializer(serializers.ModelSerializer):
    """Serializer for Transaction model"""
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'transaction_type', 'date', 'amount', 'description',
            'reference_id', 'vendor', 'vendor_name', 'customer', 'customer_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PaymentRecordSerializer(serializers.ModelSerializer):
    """Serializer for PaymentRecord model"""
    
    class Meta:
        model = PaymentRecord
        fields = [
            'id', 'date', 'amount', 'method', 'bank_name', 'tid',
            'invoice', 'bill', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class InvoiceItemSerializer(serializers.ModelSerializer):
    """Serializer for InvoiceItem model"""
    inventory_item_details = InventoryItemSerializer(source='inventory_item', read_only=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = InvoiceItem
        fields = [
            'id', 'inventory_item', 'inventory_item_details',
            'meters', 'price', 'subtotal'
        ]
        read_only_fields = ['id']


class InvoiceSerializer(serializers.ModelSerializer):
    """Serializer for Invoice model"""
    items = InvoiceItemSerializer(many=True, read_only=True)
    payment_records = PaymentRecordSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    broker_name = serializers.CharField(source='broker.name', read_only=True)
    balance_due = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'customer', 'customer_name',
            'broker', 'broker_name', 'commission_type', 'commission_value', 'commission_amount',
            'date', 'due_date', 'status', 'total', 'amount_paid',
            'balance_due', 'notes', 'items', 'payment_records',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'status', 'created_at', 'updated_at']


class InvoiceCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating invoices with items"""
    items = InvoiceItemSerializer(many=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'customer', 'date', 'due_date',
            'broker', 'commission_type', 'commission_value',
            'notes', 'items'
        ]
        read_only_fields = ['id']

    def validate(self, attrs):
        broker = attrs.get('broker')
        commission_type = attrs.get('commission_type', '')
        commission_value = attrs.get('commission_value', Decimal('0'))

        if broker and not commission_type:
            raise serializers.ValidationError({
                'commission_type': 'Commission type is required when broker is selected.'
            })

        if commission_type and not broker:
            raise serializers.ValidationError({
                'broker': 'Broker is required when commission is provided.'
            })

        if commission_value and commission_value < 0:
            raise serializers.ValidationError({
                'commission_value': 'Commission value cannot be negative.'
            })

        if commission_type == 'Percentage' and commission_value > 100:
            raise serializers.ValidationError({
                'commission_value': 'Percentage commission cannot exceed 100.'
            })

        return attrs
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        invoice = Invoice.objects.create(**validated_data)
        
        total = 0
        for item_data in items_data:
            item = InvoiceItem.objects.create(invoice=invoice, **item_data)
            total += item.subtotal
        
        invoice.total = total
        invoice.commission_amount = invoice.calculate_commission_amount()
        invoice.save()
        
        # Create transaction record
        Transaction.objects.create(
            transaction_type='Invoice',
            date=invoice.date,
            amount=invoice.total,
            description=f"Invoice {invoice.invoice_number}",
            reference_id=invoice.invoice_number,
            customer=invoice.customer
        )
        
        # Update customer balance
        invoice.customer.update_balance()
        
        return invoice


class BillItemSerializer(serializers.ModelSerializer):
    """Serializer for BillItem model"""
    inventory_item_details = InventoryItemSerializer(source='inventory_item', read_only=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = BillItem
        fields = [
            'id', 'inventory_item', 'inventory_item_details',
            'meters', 'price', 'subtotal'
        ]
        read_only_fields = ['id']


class BillSerializer(serializers.ModelSerializer):
    """Serializer for Bill model"""
    items = BillItemSerializer(many=True, read_only=True)
    payment_records = PaymentRecordSerializer(many=True, read_only=True)
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    balance_due = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = Bill
        fields = [
            'id', 'bill_number', 'vendor', 'vendor_name',
            'date', 'due_date', 'status', 'total', 'amount_paid',
            'balance_due', 'notes', 'items', 'payment_records',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'status', 'created_at', 'updated_at']


class BillCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating bills with items"""
    items = BillItemSerializer(many=True)
    
    class Meta:
        model = Bill
        fields = [
            'id', 'bill_number', 'vendor', 'date', 'due_date',
            'notes', 'items'
        ]
        read_only_fields = ['id']
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        bill = Bill.objects.create(**validated_data)
        
        total = 0
        for item_data in items_data:
            item = BillItem.objects.create(bill=bill, **item_data)
            total += item.subtotal
            # Mark inventory item as billed
            item.inventory_item.is_billed = True
            item.inventory_item.save()
        
        bill.total = total
        bill.save()
        
        # Create transaction record
        Transaction.objects.create(
            transaction_type='Bill',
            date=bill.date,
            amount=bill.total,
            description=f"Bill {bill.bill_number}",
            reference_id=bill.bill_number,
            vendor=bill.vendor
        )
        
        # Update vendor balance
        bill.vendor.update_balance()
        
        return bill
