from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from .models import Expense
from .serializers import ExpenseSerializer


class ExpenseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing expenses
    """
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['category', 'description', 'notes']
    ordering_fields = ['date', 'amount', 'category']
    ordering = ['-date']
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get expense summary statistics"""
        expenses = self.get_queryset()
        
        total = expenses.aggregate(total=Sum('amount'))['total'] or 0
        
        by_category = {}
        for expense in expenses:
            category = expense.category
            if category not in by_category:
                by_category[category] = 0
            by_category[category] += float(expense.amount)
        
        return Response({
            'total': float(total),
            'count': expenses.count(),
            'by_category': by_category
        })
