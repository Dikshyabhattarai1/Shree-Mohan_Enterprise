# backend/api/models.py
from django.db import models
from django.utils import timezone

class Product(models.Model):
    name = models.CharField(max_length=200, unique=True)
    price = models.FloatField(default=0.0)
    description = models.TextField(blank=True)
    image = models.URLField(blank=True)
    stock = models.IntegerField(default=0)
    
    def __str__(self):
        return f"{self.name} ({self.stock})"


class Order(models.Model):
    order_id = models.CharField(max_length=100, unique=True, blank=True, null=True)
    customer = models.CharField(max_length=200)
    customer_address = models.TextField(blank=True)
    total = models.FloatField(default=0)
    status = models.CharField(max_length=50, default="Pending")
    date = models.DateTimeField(default=timezone.now)
    date_np = models.CharField(max_length=50, blank=True)  # Nepali date
    
    def __str__(self):
        return f"Order {self.order_id or self.id} - {self.customer}"
    
    def calculate_total(self):
        """Calculate total from all order items"""
        total = sum(item.amount for item in self.items.all())
        self.total = total
        self.save()
        return total


class OrderItem(models.Model):
    """Individual items in an order/bill"""
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    particulars = models.CharField(max_length=200)  # Product name at time of sale
    quantity = models.IntegerField(default=1)
    rate = models.FloatField()  # Price at time of sale
    amount = models.FloatField()  # qty * rate
    
    def save(self, *args, **kwargs):
        # Auto-calculate amount
        self.amount = self.quantity * self.rate
        super().save(*args, **kwargs)
        # Update order total
        self.order.calculate_total()
    
    def __str__(self):
        return f"{self.particulars} x {self.quantity}"


class SaleRecord(models.Model):
    product = models.ForeignKey(Product, related_name='sales', on_delete=models.CASCADE)
    order = models.ForeignKey(Order, related_name='sale_records', on_delete=models.SET_NULL, null=True, blank=True)
    quantity = models.IntegerField(default=1)
    price = models.FloatField(help_text="unit price")
    total = models.FloatField()
    date = models.DateField(default=timezone.now)
    image = models.CharField(max_length=255, blank=True, null=True)
    
    def __str__(self):
        return f"{self.product.name} x{self.quantity} on {self.date}"
    
    class Meta:
        ordering = ['-date']