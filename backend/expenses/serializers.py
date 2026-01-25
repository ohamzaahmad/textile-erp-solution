from rest_framework import serializers
from .models import Expense


class ExpenseSerializer(serializers.ModelSerializer):
    """Serializer for Expense model"""
    
    class Meta:
        model = Expense
        fields = [
            'id', 'date', 'category', 'description', 'amount',
            'payment_method', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
