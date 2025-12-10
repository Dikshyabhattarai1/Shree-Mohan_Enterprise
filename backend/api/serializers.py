# backend/api/serializers.py
from rest_framework import serializers
from .models import Product, Order, OrderItem, SaleRecord

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'particulars', 'quantity', 'rate', 'amount']
        read_only_fields = ['amount']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Order
        fields = ['id', 'order_id', 'customer', 'customer_address', 'total', 'status', 'date', 'date_np', 'items']
        read_only_fields = ['total']


class OrderCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating orders with items"""
    items = OrderItemSerializer(many=True)
    
    class Meta:
        model = Order
        fields = ['id', 'order_id', 'customer', 'customer_address', 'date', 'date_np', 'items']
        read_only_fields = ['id']  # id is auto-generated, so make it read-only
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)
        
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
        
        order.calculate_total()
        return order


class SaleRecordSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    
    class Meta:
        model = SaleRecord
        fields = ['id', 'product', 'product_name', 'order', 'quantity', 'price', 'total', 'date']