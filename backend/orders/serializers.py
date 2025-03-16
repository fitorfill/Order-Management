from rest_framework import serializers
from .models import Customer, Product, Order, OrderItem

class CustomerSerializer(serializers.ModelSerializer):
    """Serializer for the Customer model."""
    class Meta:
        model = Customer
        fields = ['id', 'name', 'email', 'region', 'address', 'created_at']
        read_only_fields = ['id', 'created_at']

class ProductSerializer(serializers.ModelSerializer):
    """Serializer for the Product model."""
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'stock', 'origin', 
                 'category', 'category_display', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for reading OrderItem instances within an Order."""
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_origin = serializers.CharField(source='product.origin', read_only=True)
    product_category = serializers.CharField(source='product.get_category_display', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'product_origin', 'product_category',
                 'quantity', 'unit_price', 'total_price']
        read_only_fields = ['id', 'total_price', 'product_name', 'product_origin', 'product_category']

class OrderItemCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating OrderItem instances."""
    class Meta:
        model = OrderItem
        fields = ['product', 'quantity', 'unit_price']
        extra_kwargs = {
            'unit_price': {'required': False}  # Will default to product price if not provided
        }

class OrderReadSerializer(serializers.ModelSerializer):
    """Serializer for reading Order instances with full details."""
    items = OrderItemSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_region = serializers.CharField(source='customer.region', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True, default='')
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer', 'customer_name', 'customer_region', 
            'status', 'status_display', 'payment_method', 'payment_method_display',
            'shipping_address', 'notes', 'created_at', 'updated_at',
            'created_by', 'created_by_username', 'total', 'items_count', 'items'
        ]
        read_only_fields = ['id', 'order_number', 'created_at', 'updated_at', 
                           'total', 'items_count', 'created_by']

class OrderWriteSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating Order instances."""
    items = OrderItemCreateSerializer(many=True)
    
    class Meta:
        model = Order
        fields = [
            'customer', 'status', 'payment_method', 
            'shipping_address', 'notes', 'items'
        ]
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        
        # Set the created_by field to the current user
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        
        # Create the order
        order = Order.objects.create(**validated_data)
        
        # Create order items
        for item_data in items_data:
            product = item_data['product']
            quantity = item_data['quantity']
            
            # Use provided unit price or fall back to product price
            unit_price = item_data.get('unit_price', product.price)
            
            # Create the order item
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=quantity,
                unit_price=unit_price
            )
            
            # Optionally update product stock
            # product.stock -= quantity
            # product.save()
        
        return order
    
    def update(self, instance, validated_data):
        # Handle order items if present
        if 'items' in validated_data:
            items_data = validated_data.pop('items')
            
            # Remove existing items
            instance.items.all().delete()
            
            # Create new items
            for item_data in items_data:
                product = item_data['product']
                quantity = item_data['quantity']
                unit_price = item_data.get('unit_price', product.price)
                
                OrderItem.objects.create(
                    order=instance,
                    product=product,
                    quantity=quantity,
                    unit_price=unit_price
                )
        
        # Update other order fields
        for field, value in validated_data.items():
            setattr(instance, field, value)
        
        instance.save()
        return instance
