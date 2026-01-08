from rest_framework import serializers
from .models import Vendor, Customer


class VendorSerializer(serializers.ModelSerializer):
    """Serializer for Vendor model"""
    
    class Meta:
        model = Vendor
        fields = [
            'id', 'name', 'contact', 'address', 
            'bank_details', 'balance', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'balance', 'created_at', 'updated_at']


class CustomerSerializer(serializers.ModelSerializer):
    """Serializer for Customer model"""
    
    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'contact', 'address', 
            'balance', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'balance', 'created_at', 'updated_at']
