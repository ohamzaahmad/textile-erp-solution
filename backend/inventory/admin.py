from django.contrib import admin
from .models import InventoryItem, ItemMaster


@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ('lot_number', 'fabric_type', 'meters', 'unit_price', 'vendor', 'received_date', 'is_billed')
    list_filter = ('is_billed', 'received_date', 'vendor')
    search_fields = ('lot_number', 'fabric_type')
    readonly_fields = ('created_at', 'updated_at', 'total_value')
    
    def total_value(self, obj):
        return obj.total_value
    total_value.short_description = 'Total Value'


@admin.register(ItemMaster)
class ItemMasterAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'category', 'standard_price', 'is_active')
    list_filter = ('category', 'is_active')
    search_fields = ('code', 'name', 'category')
    readonly_fields = ('created_at', 'updated_at')
