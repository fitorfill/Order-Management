from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Customer, Product, Order
from .serializers import (
    CustomerSerializer, ProductSerializer, 
    OrderReadSerializer, OrderWriteSerializer
)

class CustomerViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing customers.
    """
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ['name', 'email', 'region']
    filterset_fields = ['region']
    ordering_fields = ['name', 'region', 'created_at']
    ordering = ['name']

class ProductViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing products.
    """
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ['name', 'description', 'origin', 'category']
    filterset_fields = ['category', 'origin']
    ordering_fields = ['name', 'price', 'stock', 'created_at']
    ordering = ['name']
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Return products with low stock (less than 10 items)"""
        low_stock_products = Product.objects.filter(stock__lt=10)
        serializer = self.get_serializer(low_stock_products, many=True)
        return Response(serializer.data)

class OrderViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing orders.
    """
    queryset = Order.objects.all().prefetch_related('items', 'items__product')
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_method', 'customer']
    search_fields = ['order_number', 'customer__name', 'shipping_address']
    ordering_fields = ['created_at', 'updated_at', 'status']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return OrderWriteSerializer
        return OrderReadSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context
    
    @action(detail=False, methods=['get'])
    def metrics(self, request):
        """Return order metrics"""
        total_orders = Order.objects.count()
        pending_orders = Order.objects.filter(status='PENDING').count()
        processing_orders = Order.objects.filter(status='PROCESSING').count()
        shipped_orders = Order.objects.filter(status='SHIPPED').count()
        delivered_orders = Order.objects.filter(status='DELIVERED').count()
        cancelled_orders = Order.objects.filter(status='CANCELLED').count()
        
        # Calculate revenue
        revenue = sum(order.total for order in Order.objects.all())
        
        metrics = {
            'total_orders': total_orders,
            'pending_orders': pending_orders,
            'processing_orders': processing_orders,
            'shipped_orders': shipped_orders,
            'delivered_orders': delivered_orders,
            'cancelled_orders': cancelled_orders,
            'total_revenue': revenue
        }
        
        return Response(metrics)
