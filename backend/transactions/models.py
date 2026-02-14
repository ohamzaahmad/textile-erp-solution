from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal
from accounts.models import Vendor, Customer, Broker
from inventory.models import InventoryItem


class Transaction(models.Model):
    """Base transaction model for tracking all financial transactions"""
    
    TRANSACTION_TYPES = [
        ('Bill', 'Bill'),
        ('Invoice', 'Invoice'),
        ('Payment', 'Payment'),
        ('Settlement', 'Settlement'),
    ]
    
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    date = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(blank=True)
    reference_id = models.CharField(max_length=100, blank=True)
    
    # Foreign keys (nullable as transaction can be for vendor OR customer)
    vendor = models.ForeignKey(
        Vendor, 
        on_delete=models.PROTECT, 
        null=True, 
        blank=True,
        related_name='transactions'
    )
    customer = models.ForeignKey(
        Customer, 
        on_delete=models.PROTECT, 
        null=True, 
        blank=True,
        related_name='transactions'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'transactions'
        ordering = ['-date', '-created_at']
    
    def __str__(self):
        entity = self.vendor or self.customer
        return f"{self.transaction_type} - {entity} - {self.amount}"
    
    def get_signed_amount(self):
        """Return amount with appropriate sign for balance calculation"""
        if self.transaction_type in ['Bill', 'Invoice']:
            return self.amount
        elif self.transaction_type in ['Payment', 'Settlement']:
            return -self.amount
        return 0


class PaymentRecord(models.Model):
    """Model for payment records"""
    
    PAYMENT_METHODS = [
        ('Credit', 'Credit'),
        ('Cash', 'Cash'),
        ('Bank', 'Bank'),
    ]
    
    date = models.DateField()
    amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='Cash')
    bank_name = models.CharField(max_length=255, blank=True, null=True)
    tid = models.CharField(max_length=100, blank=True, null=True, help_text="Transaction ID")
    
    # Link to invoice or bill
    invoice = models.ForeignKey(
        'Invoice', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='payment_records'
    )
    bill = models.ForeignKey(
        'Bill', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='payment_records'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'payment_records'
        ordering = ['-date', '-created_at']
    
    def __str__(self):
        return f"Payment - {self.amount} ({self.method})"


class Invoice(models.Model):
    """Model for customer invoices"""
    
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Partially Paid', 'Partially Paid'),
        ('Paid', 'Paid'),
    ]

    COMMISSION_TYPES = [
        ('Percentage', 'Percentage'),
        ('Fixed', 'Fixed Amount'),
    ]
    
    invoice_number = models.CharField(max_length=50, unique=True)
    customer = models.ForeignKey(
        Customer, 
        on_delete=models.PROTECT,
        related_name='invoices'
    )
    broker = models.ForeignKey(
        Broker,
        on_delete=models.PROTECT,
        related_name='invoices',
        null=True,
        blank=True
    )
    date = models.DateField()
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    commission_type = models.CharField(max_length=20, choices=COMMISSION_TYPES, blank=True)
    commission_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    commission_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'invoices'
        ordering = ['-date', '-created_at']
    
    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.customer.name}"
    
    @property
    def balance_due(self):
        return self.total - self.amount_paid
    
    def update_status(self):
        """Update status based on payment"""
        if self.amount_paid >= self.total:
            self.status = 'Paid'
        elif self.amount_paid > 0:
            self.status = 'Partially Paid'
        else:
            self.status = 'Pending'
        self.save()

    def calculate_commission_amount(self):
        """Calculate commission amount from type and value"""
        if not self.broker or self.commission_value <= 0:
            return Decimal('0.00')

        if self.commission_type == 'Percentage':
            return (self.total * self.commission_value) / Decimal('100')

        if self.commission_type == 'Fixed':
            return self.commission_value

        return Decimal('0.00')


class InvoiceItem(models.Model):
    """Line items for invoices"""
    invoice = models.ForeignKey(
        Invoice, 
        on_delete=models.CASCADE,
        related_name='items'
    )
    inventory_item = models.ForeignKey(
        InventoryItem, 
        on_delete=models.PROTECT,
        related_name='invoice_items'
    )
    meters = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    
    class Meta:
        db_table = 'invoice_items'
    
    def __str__(self):
        return f"{self.invoice.invoice_number} - {self.inventory_item.lot_number}"
    
    @property
    def subtotal(self):
        return self.meters * self.price


class Bill(models.Model):
    """Model for vendor bills"""
    
    STATUS_CHOICES = [
        ('Unpaid', 'Unpaid'),
        ('Partially Paid', 'Partially Paid'),
        ('Paid', 'Paid'),
    ]
    
    bill_number = models.CharField(max_length=50, unique=True)
    vendor = models.ForeignKey(
        Vendor, 
        on_delete=models.PROTECT,
        related_name='bills'
    )
    date = models.DateField()
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Unpaid')
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'bills'
        ordering = ['-date', '-created_at']
    
    def __str__(self):
        return f"Bill {self.bill_number} - {self.vendor.name}"
    
    @property
    def balance_due(self):
        return self.total - self.amount_paid
    
    def update_status(self):
        """Update status based on payment"""
        if self.amount_paid >= self.total:
            self.status = 'Paid'
        elif self.amount_paid > 0:
            self.status = 'Partially Paid'
        else:
            self.status = 'Unpaid'
        self.save()


class BillItem(models.Model):
    """Line items for bills"""
    bill = models.ForeignKey(
        Bill, 
        on_delete=models.CASCADE,
        related_name='items'
    )
    inventory_item = models.ForeignKey(
        InventoryItem, 
        on_delete=models.PROTECT,
        related_name='bill_items'
    )
    meters = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    
    class Meta:
        db_table = 'bill_items'
    
    def __str__(self):
        return f"{self.bill.bill_number} - {self.inventory_item.lot_number}"
    
    @property
    def subtotal(self):
        return self.meters * self.price
