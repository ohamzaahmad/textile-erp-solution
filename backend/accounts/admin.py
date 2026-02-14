from django.contrib import admin
from .models import Vendor, Customer, Broker


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact', 'balance', 'created_at')
    search_fields = ('name', 'contact')
    list_filter = ('created_at',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact', 'balance', 'created_at')
    search_fields = ('name', 'contact')
    list_filter = ('created_at',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Broker)
class BrokerAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact', 'created_at')
    search_fields = ('name', 'contact')
    list_filter = ('created_at',)
    readonly_fields = ('created_at', 'updated_at')
