# backend/api/serializers.py
from rest_framework import serializers
from .models import Product, Order, OrderItem, SaleRecord


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'stock', 'description', 'image']


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'particulars', 'quantity', 'rate', 'amount']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Order
        fields = ['id', 'order_id', 'customer', 'customer_address', 'total', 'status', 'date', 'date_np', 'items']
        read_only_fields = ['total', 'date']


class SaleRecordSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    customer = serializers.CharField(source='order.customer', read_only=True)
    
    class Meta:
        model = SaleRecord
        fields = ['id', 'product', 'product_name', 'customer', 'quantity', 'price', 'total', 'date']