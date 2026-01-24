from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal
from accounts.models import Vendor


class InventoryItem(models.Model):
    """Model for inventory items (fabric lots)"""
    lot_number = models.CharField(max_length=100)
    fabric_type = models.CharField(max_length=255)
    meters = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    unit_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    vendor = models.ForeignKey(
        Vendor, 
        on_delete=models.PROTECT,
        related_name='inventory_items'
    )
    received_date = models.DateField()
    is_billed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'inventory_items'
        ordering = ['-received_date', 'lot_number']
        unique_together = [['lot_number', 'fabric_type']]
    
    def __str__(self):
        return f"{self.lot_number} - {self.fabric_type} ({self.meters}m)"
    
    @property
    def total_value(self):
        """Calculate total value of the item"""
        return self.meters * self.unit_price


class ItemMaster(models.Model):
    """Master catalog of fabric types and their attributes"""
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    unit_of_measure = models.CharField(max_length=20, default='Meters')
    standard_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Standard selling price per unit"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'item_master'
        ordering = ['code']
    
    def __str__(self):
        return f"{self.code} - {self.name}"
