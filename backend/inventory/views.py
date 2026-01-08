from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.db.models import Sum, Q
from .models import InventoryItem, ItemMaster
from .serializers import (
    InventoryItemSerializer, 
    InventoryItemDetailSerializer,
    ItemMasterSerializer
)


class InventoryItemViewSet(viewsets.ModelViewSet):
    """ViewSet for managing inventory items"""
    queryset = InventoryItem.objects.all().select_related('vendor')
    serializer_class = InventoryItemSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['vendor', 'is_billed', 'fabric_type']
    search_fields = ['lot_number', 'fabric_type']
    ordering_fields = ['received_date', 'lot_number', 'meters', 'unit_price']
    ordering = ['-received_date']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return InventoryItemDetailSerializer
        return InventoryItemSerializer
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get inventory summary statistics"""
        queryset = self.filter_queryset(self.get_queryset())
        
        total_items = queryset.count()
        total_meters = queryset.aggregate(total=Sum('meters'))['total'] or 0
        unbilled_items = queryset.filter(is_billed=False).count()
        
        return Response({
            'total_items': total_items,
            'total_meters': float(total_meters),
            'unbilled_items': unbilled_items,
        })
    
    @action(detail=False, methods=['get'])
    def by_vendor(self, request):
        """Get inventory grouped by vendor"""
        from django.db.models import Count, Sum
        from accounts.models import Vendor
        
        vendors = Vendor.objects.annotate(
            item_count=Count('inventory_items'),
            total_meters=Sum('inventory_items__meters')
        ).filter(item_count__gt=0)
        
        data = []
        for vendor in vendors:
            data.append({
                'vendor_id': vendor.id,
                'vendor_name': vendor.name,
                'item_count': vendor.item_count,
                'total_meters': float(vendor.total_meters or 0)
            })
        
        return Response(data)
    
    @action(detail=True, methods=['post'])
    def mark_billed(self, request, pk=None):
        """Mark an inventory item as billed"""
        item = self.get_object()
        item.is_billed = True
        item.save()
        serializer = self.get_serializer(item)
        return Response(serializer.data)


class ItemMasterViewSet(viewsets.ModelViewSet):
    """ViewSet for managing item master catalog"""
    queryset = ItemMaster.objects.all()
    serializer_class = ItemMasterSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_active']
    search_fields = ['code', 'name', 'category', 'description']
    ordering_fields = ['code', 'name', 'category', 'standard_price']
    ordering = ['code']
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get list of unique categories"""
        categories = ItemMaster.objects.values_list('category', flat=True).distinct()
        return Response(list(categories))
