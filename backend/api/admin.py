

# Register your models here.
from django.contrib import admin
from .models import Product, Order, SaleRecord

admin.site.register(Product)
admin.site.register(Order)
admin.site.register(SaleRecord)
