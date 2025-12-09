# backend/api/views.py
from rest_framework import viewsets, status
from rest_framework.response import Response
from django.db import transaction
from django.shortcuts import get_object_or_404

from .models import Product, Order, SaleRecord
from .serializers import ProductSerializer, OrderSerializer, SaleRecordSerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('id')
    serializer_class = ProductSerializer


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by('-date')
    serializer_class = OrderSerializer


class SaleRecordViewSet(viewsets.ModelViewSet):
    queryset = SaleRecord.objects.all().order_by('-date')
    serializer_class = SaleRecordSerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """
        When creating a sale record, reduce product stock.
        Expected input:
        {
          "product": <product_id>,
          "quantity": <int>,
          "price": <number>,
          "total": <number>,
          "date": "YYYY-MM-DD"
        }
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # product field will be a Product instance because DRF resolves PK to object
        product_obj = serializer.validated_data['product']
        qty = serializer.validated_data.get('quantity', 0)

        # Lock product row for update to avoid race conditions
        product = Product.objects.select_for_update().get(pk=product_obj.id)

        if product.stock < qty:
            return Response({'detail': 'Not enough stock'}, status=status.HTTP_400_BAD_REQUEST)

        # reduce stock and save
        product.stock -= qty
        product.save()

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

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
