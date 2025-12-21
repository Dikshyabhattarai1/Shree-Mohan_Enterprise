from django.db import models
from django.utils import timezone

# PRODUCT MODEL

class Product(models.Model):
    name = models.CharField(max_length=200, unique=True)
    price = models.FloatField(default=0.0)
    description = models.TextField(blank=True)
    stock = models.IntegerField(default=0)
   

    def __str__(self):
        return self.name
 

# ORDER MODEL

class Order(models.Model):
    order_id = models.CharField(max_length=100, unique=True, blank=True, null=True)
    customer = models.CharField(max_length=200)
    customer_address = models.TextField(blank=True)
    total = models.FloatField(default=0)
    status = models.CharField(max_length=50, default="Pending")
    date = models.DateTimeField(default=timezone.now)
    date_np = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return self.order_id or str(self.id)

    def calculate_total(self):
        total = sum(item.amount for item in self.items.all())
        self.total = total
        self.save(update_fields=["total"])
        return total


# ORDER ITEM MODEL

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    particulars = models.CharField(max_length=200)
    quantity = models.IntegerField(default=1)
    rate = models.FloatField()
    amount = models.FloatField(blank=True)

    def save(self, *args, **kwargs):
        self.amount = self.quantity * self.rate
        super().save(*args, **kwargs)
        self.order.calculate_total()

    def __str__(self):
        return f"{self.particulars} x {self.quantity}"



# =========================================
# COMBINED RECORD MODEL
# =========================================
class CombinedRecord(models.Model):
    order_id = models.CharField(max_length=100)
    customer = models.CharField(max_length=200)
    customer_address = models.TextField(blank=True)
    date_np = models.CharField(max_length=50, blank=True)
    product_name = models.CharField(max_length=200)
    quantity = models.IntegerField()
    rate = models.FloatField()
    total = models.FloatField()
    date_created = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.order_id} - {self.product_name}"