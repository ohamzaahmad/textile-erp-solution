from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InventoryItemViewSet, ItemMasterViewSet

router = DefaultRouter()
router.register(r'inventory', InventoryItemViewSet)
router.register(r'item-master', ItemMasterViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
