import django_filters
from .models import Order, Product

class OrderFilter(django_filters.FilterSet):
    """Filter set for Orders with custom filters for date ranges and price."""
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    customer_name = django_filters.CharFilter(field_name='customer__name', lookup_expr='icontains')
    customer_region = django_filters.CharFilter(field_name='customer__region', lookup_expr='icontains')
    
    class Meta:
        model = Order
        fields = {
            'status': ['exact'],
            'payment_method': ['exact'],
            'created_by': ['exact'],
        }

class ProductFilter(django_filters.FilterSet):
    """Filter set for Products with custom filters for price ranges."""
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    min_stock = django_filters.NumberFilter(field_name='stock', lookup_expr='gte')
    max_stock = django_filters.NumberFilter(field_name='stock', lookup_expr='lte')
    
    class Meta:
        model = Product
        fields = {
            'category': ['exact'],
            'origin': ['exact', 'icontains'],
            'name': ['icontains'],
        }
