from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VendorViewSet, CustomerViewSet

router = DefaultRouter()
router.register(r'vendors', VendorViewSet)
router.register(r'customers', CustomerViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
