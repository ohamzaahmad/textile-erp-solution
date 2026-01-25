from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal


class Expense(models.Model):
    """Model for tracking business expenses"""
    
    CATEGORY_CHOICES = [
        ('Office Rent', 'Office Rent'),
        ('Employees Salary', 'Employees Salary'),
        ('Builty (Transport)', 'Builty (Transport)'),
        ('Packing', 'Packing'),
        ('Electricity Bill', 'Electricity Bill'),
        ('Gas Bill', 'Gas Bill'),
        ('Water Bill', 'Water Bill'),
        ('Internet Bill', 'Internet Bill'),
        ('Other Expenses', 'Other Expenses'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('Cash', 'Cash'),
        ('Bank', 'Bank'),
        ('Credit', 'Credit'),
    ]
    
    date = models.DateField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    description = models.CharField(max_length=255)
    amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='Cash')
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'expenses'
        ordering = ['-date', '-created_at']
    
    def __str__(self):
        return f"{self.category} - {self.description} - {self.amount}"
