from rest_framework import serializers
from .models import Product, Order, OrderItem, CombinedRecord

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'stock', 'description']


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'particulars', 'quantity', 'rate', 'amount']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = ['id', 'order_id', 'customer', 'customer_address', 'total', 'status', 'date', 'date_np', 'items']
        read_only_fields = ['total', 'date']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        order = Order.objects.create(**validated_data)

        total_amount = 0

        for item_data in items_data:
            product = item_data['product']
            quantity = item_data['quantity']
            rate = item_data.get('rate', product.price)

            # Stock check
            if product.stock < quantity:
                raise serializers.ValidationError(f"Not enough stock for {product.name}")

            product.stock -= quantity
            product.save()

            amount = quantity * rate
            total_amount += amount

            order_item = OrderItem.objects.create(
                order=order,
                product=product,
                particulars=item_data.get('particulars', product.name),
                quantity=quantity,
                rate=rate,
                amount=amount
            )

            # Create CombinedRecord
            CombinedRecord.objects.create(
                order_id=order.order_id,
                customer=order.customer,
                customer_address=order.customer_address,
                date_np=order.date_np,
                product_name=product.name,
                quantity=quantity,
                rate=rate,
                total=amount
            )

        # Update total on order
        order.total = total_amount
        order.save()

        return order


class CombinedRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = CombinedRecord
        fields = ['id', 'order_id', 'customer', 'customer_address', 'date_np', 'product_name', 'quantity', 'rate', 'total', 'export_status', 'date_created']
