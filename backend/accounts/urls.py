from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VendorViewSet, CustomerViewSet, BrokerViewSet

router = DefaultRouter()
router.register(r'vendors', VendorViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'brokers', BrokerViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
