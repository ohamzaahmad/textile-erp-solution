from rest_framework import serializers
from .models import InventoryItem, ItemMaster
from accounts.serializers import VendorSerializer


class InventoryItemSerializer(serializers.ModelSerializer):
    """Serializer for InventoryItem model"""
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    total_value = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = InventoryItem
        fields = [
            'id', 'lot_number', 'fabric_type', 'meters', 'unit_price',
            'vendor', 'vendor_name', 'received_date', 'is_billed',
            'total_value', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class InventoryItemDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer with vendor information"""
    vendor = VendorSerializer(read_only=True)
    total_value = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = InventoryItem
        fields = [
            'id', 'lot_number', 'fabric_type', 'meters', 'unit_price',
            'vendor', 'received_date', 'is_billed',
            'total_value', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ItemMasterSerializer(serializers.ModelSerializer):
    """Serializer for ItemMaster model"""
    
    class Meta:
        model = ItemMaster
        fields = [
            'id', 'code', 'name', 'category', 'description',
            'unit_of_measure', 'standard_price', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
