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
    balance_due = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'customer', 'customer_name',
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
            'invoice_number', 'customer', 'date', 'due_date',
            'notes', 'items'
        ]
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        invoice = Invoice.objects.create(**validated_data)
        
        total = 0
        for item_data in items_data:
            item = InvoiceItem.objects.create(invoice=invoice, **item_data)
            total += item.subtotal
        
        invoice.total = total
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
            'bill_number', 'vendor', 'date', 'due_date',
            'notes', 'items'
        ]
    
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
