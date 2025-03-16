from django.db import models
from django.utils import timezone
from django.conf import settings

# Customer model
class Customer(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    region = models.CharField(max_length=50, help_text="Geographic region or kingdom")
    address = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} ({self.region})"

# Product model
class Product(models.Model):
    CATEGORY_CHOICES = [
        ('SPICES', 'Spices'),
        ('TEXTILES', 'Textiles'),
        ('POTTERY', 'Pottery'),
        ('METALS', 'Precious Metals'),
        ('WEAPONS', 'Weapons'),
        ('JEWELRY', 'Jewelry'),
        ('TOOLS', 'Tools'),
        ('OTHER', 'Other Goods'),
    ]
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    origin = models.CharField(max_length=50, help_text="Origin location of the product")
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='OTHER')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} - {self.price} gold pieces"

# Order model
class Order(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('SHIPPED', 'Shipped'),
        ('DELIVERED', 'Delivered'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    PAYMENT_CHOICES = [
        ('GOLD', 'Gold Coins'),
        ('SILVER', 'Silver Pieces'),
        ('BARTER', 'Goods Exchange'),
        ('CREDIT', 'Merchant Credit'),
    ]
    
    order_number = models.CharField(max_length=20, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default='GOLD')
    shipping_address = models.TextField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='created_orders'
    )
    
    @property
    def total(self):
        return sum(item.total_price for item in self.items.all())
    
    @property
    def items_count(self):
        return self.items.count()
    
    def __str__(self):
        return f"Order {self.order_number} - {self.customer.name}"
    
    def save(self, *args, **kwargs):
        # Generate order number if not provided
        if not self.order_number:
            # Format: SRM (Silk Road Merchant) + Year + Month + 4-digit sequence
            prefix = "SRM"
            now = timezone.now()
            year_month = now.strftime("%y%m")
            
            # Get the last order with this prefix
            last_order = Order.objects.filter(
                order_number__startswith=f"{prefix}{year_month}"
            ).order_by('order_number').last()
            
            if last_order:
                # Extract the sequence number and increment
                seq = int(last_order.order_number[-4:]) + 1
            else:
                seq = 1
                
            self.order_number = f"{prefix}{year_month}{seq:04d}"
            
        super().save(*args, **kwargs)

# Order Item model
class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    @property
    def total_price(self):
        return self.quantity * self.unit_price
    
    def __str__(self):
        return f"{self.quantity} x {self.product.name}"
    
    def save(self, *args, **kwargs):
        # Set the unit_price from the product if not provided
        if not self.unit_price:
            self.unit_price = self.product.price
        super().save(*args, **kwargs)
