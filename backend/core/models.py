from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom User model for HA FABRICS ERP"""
    
    ROLE_CHOICES = [
        ('manager', 'Manager'),
        ('cashier', 'Cashier'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='cashier')
    name = models.CharField(max_length=255)
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.name} ({self.username})"
