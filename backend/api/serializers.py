# backend/api/serializers.py
from rest_framework import serializers
from .models import Product, Order, SaleRecord

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'


class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = '__all__'


class SaleRecordSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')

    class Meta:
        model = SaleRecord
        fields = ['id', 'product', 'product_name', 'quantity', 'price', 'total', 'date']
