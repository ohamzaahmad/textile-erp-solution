from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TransactionViewSet, PaymentRecordViewSet,
    InvoiceViewSet, BillViewSet
)

router = DefaultRouter()
router.register(r'transactions', TransactionViewSet)
router.register(r'payments', PaymentRecordViewSet)
router.register(r'invoices', InvoiceViewSet)
router.register(r'bills', BillViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
