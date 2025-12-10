# backend/api/views.py
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .models import Product, Order, OrderItem, SaleRecord
from .serializers import (
    ProductSerializer, OrderSerializer, OrderCreateSerializer,
    SaleRecordSerializer
)

@method_decorator(csrf_exempt, name='dispatch')
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('id')
    serializer_class = ProductSerializer


@method_decorator(csrf_exempt, name='dispatch')
class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by('-date')
    serializer_class = OrderSerializer
    
    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """
        Create an order and automatically complete it:
        - Create order and items
        - Reduce stock
        - Create sales records
        - Mark as completed
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Get items data for stock validation
        items_data = serializer.validated_data.get('items', [])
        
        # Check stock availability for all items BEFORE creating order
        for item_data in items_data:
            product = item_data.get('product')
            quantity = item_data.get('quantity', 0)
            
            if product and product.stock < quantity:
                return Response(
                    {'detail': f'Not enough stock for {product.name}. Available: {product.stock}, Required: {quantity}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Create the order (this calls serializer.create())
        order = serializer.save()
        
        # Now complete the order automatically
        for item in order.items.all():
            product = item.product
            
            if product:
                # Reduce stock
                product.stock -= item.quantity
                product.save()
                
                # Create sale record
                SaleRecord.objects.create(
                    product=product,
                    order=order,
                    quantity=item.quantity,
                    price=item.rate,
                    total=item.amount,
                    date=order.date.date() if hasattr(order.date, 'date') else order.date
                )
        
        # Mark order as completed
        order.status = 'Completed'
        order.save()
        
        # Return the complete order data
        headers = self.get_success_headers(serializer.data)
        output_serializer = OrderSerializer(order)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    @transaction.atomic
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """
        Complete an order manually (for orders that weren't auto-completed)
        POST /api/orders/{id}/complete/
        """
        order = self.get_object()
        
        if order.status == 'Completed':
            return Response({'detail': 'Order already completed'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create sales records for each item and reduce stock
        for item in order.items.all():
            product = item.product
            
            if not product:
                continue
            
            # Check stock
            if product.stock < item.quantity:
                return Response(
                    {'detail': f'Not enough stock for {product.name}. Available: {product.stock}, Required: {item.quantity}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Reduce stock
            product.stock -= item.quantity
            product.save()
            
            # Create sale record
            SaleRecord.objects.create(
                product=product,
                order=order,
                quantity=item.quantity,
                price=item.rate,
                total=item.amount,
                date=order.date.date() if hasattr(order.date, 'date') else order.date
            )
        
        # Mark order as completed
        order.status = 'Completed'
        order.save()
        
        return Response({'detail': 'Order completed successfully', 'order': OrderSerializer(order).data})


@method_decorator(csrf_exempt, name='dispatch')
class SaleRecordViewSet(viewsets.ModelViewSet):
    queryset = SaleRecord.objects.all().order_by('-date')
    serializer_class = SaleRecordSerializer
    
    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        """
        When deleting a sale record, restore product stock.
        """
        instance = self.get_object()
        product = Product.objects.select_for_update().get(pk=instance.product.id)
        product.stock += instance.quantity
        product.save()
        
        return super().destroy(request, *args, **kwargs)