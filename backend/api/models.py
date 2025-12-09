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
    # make order_id optional to avoid migration pain if you already have rows
    order_id = models.CharField(max_length=100, unique=True, blank=True, null=True)
    customer = models.CharField(max_length=200)
    total = models.FloatField()
    status = models.CharField(max_length=50, default="Pending")
    date = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Order {self.order_id or self.id} - {self.customer}"


class SaleRecord(models.Model):
    product = models.ForeignKey(Product, related_name='sales', on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    price = models.FloatField(help_text="unit price")
    total = models.FloatField()
    date = models.DateField(default=timezone.now)
    image = models.CharField(max_length=255, blank=True, null=True)


    def __str__(self):
        return f"{self.product.name} x{self.quantity} on {self.date}"
