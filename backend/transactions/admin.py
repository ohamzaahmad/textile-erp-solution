from django.contrib import admin
from .models import Transaction, PaymentRecord, Invoice, InvoiceItem, Bill, BillItem


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('transaction_type', 'date', 'amount', 'vendor', 'customer', 'reference_id')
    list_filter = ('transaction_type', 'date')
    search_fields = ('reference_id', 'description')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(PaymentRecord)
class PaymentRecordAdmin(admin.ModelAdmin):
    list_display = ('date', 'amount', 'method', 'invoice', 'bill', 'tid')
    list_filter = ('method', 'date')
    search_fields = ('tid', 'bank_name')
    readonly_fields = ('created_at',)


class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 1
    readonly_fields = ('subtotal',)


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'customer', 'date', 'due_date', 'total', 'amount_paid', 'status')
    list_filter = ('status', 'date')
    search_fields = ('invoice_number', 'customer__name')
    readonly_fields = ('balance_due', 'created_at', 'updated_at')
    inlines = [InvoiceItemInline]


class BillItemInline(admin.TabularInline):
    model = BillItem
    extra = 1
    readonly_fields = ('subtotal',)


@admin.register(Bill)
class BillAdmin(admin.ModelAdmin):
    list_display = ('bill_number', 'vendor', 'date', 'due_date', 'total', 'amount_paid', 'status')
    list_filter = ('status', 'date')
    search_fields = ('bill_number', 'vendor__name')
    readonly_fields = ('balance_due', 'created_at', 'updated_at')
    inlines = [BillItemInline]
