from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal


class Vendor(models.Model):
    """Model for textile vendors/suppliers"""
    name = models.CharField(max_length=255)
    contact = models.CharField(max_length=100)
    address = models.TextField(blank=True, null=True)
    bank_details = models.TextField(blank=True, null=True)
    balance = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0,
        help_text="Outstanding balance (negative = we owe vendor)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'vendors'
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def update_balance(self):
        """Update vendor balance from transactions"""
        from transactions.models import Transaction
        transactions = Transaction.objects.filter(vendor=self)
        balance = sum(t.get_signed_amount() for t in transactions)
        self.balance = balance
        self.save()


class Customer(models.Model):
    """Model for customers"""
    name = models.CharField(max_length=255)
    contact = models.CharField(max_length=100)
    address = models.TextField(blank=True, null=True)
    balance = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0,
        help_text="Outstanding balance (positive = customer owes us)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'customers'
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def update_balance(self):
        """Update customer balance from transactions"""
        from transactions.models import Transaction
        transactions = Transaction.objects.filter(customer=self)
        balance = sum(t.get_signed_amount() for t in transactions)
        self.balance = balance
        self.save()
