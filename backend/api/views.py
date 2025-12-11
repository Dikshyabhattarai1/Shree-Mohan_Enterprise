# backend/api/views.py
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Product, Order, OrderItem, SaleRecord
from .serializers import ProductSerializer, OrderSerializer, SaleRecordSerializer
from django.db import transaction

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """
        Create order with items and automatically create sales records
        """
        data = request.data
        
        # Create the order
        order = Order.objects.create(
            order_id=data.get('order_id'),
            customer=data.get('customer'),
            customer_address=data.get('customer_address'),
            date_np=data.get('date_np', '')
        )
        
        items = data.get('items', [])
        total_amount = 0
        
        # Create order items and sales records
        for item in items:
            product = Product.objects.get(id=item.get('product'))
            quantity = item.get('quantity', 1)
            rate = item.get('rate', 0)
            amount = quantity * rate
            
            # Create OrderItem
            OrderItem.objects.create(
                order=order,
                product=product,
                particulars=item.get('particulars', product.name),
                quantity=quantity,
                rate=rate,
                amount=amount
            )
            
            # Create SaleRecord (for Sales Records page)
            SaleRecord.objects.create(
                product=product,
                order=order,
                quantity=quantity,
                price=rate,
                total=amount,
                date=order.date.date()
            )
            
            # Update stock
            product.stock -= quantity
            product.save()
            
            total_amount += amount
        
        # Update order total
        order.total = total_amount
        order.save()
        
        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SaleRecordViewSet(viewsets.ModelViewSet):
    queryset = SaleRecord.objects.all()
    serializer_class = SaleRecordSerializer
    ordering = ['-date']