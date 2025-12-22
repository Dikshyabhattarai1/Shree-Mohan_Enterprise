from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db import transaction

from .models import Product, Order, OrderItem, CombinedRecord
from .serializers import (
    ProductSerializer,
    OrderSerializer,
    CombinedRecordSerializer
)

# ========================
# AUTHENTICATION VIEWS
# ========================
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response({'error': 'Username and password required'}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(username=username, password=password)
    if user is None:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    refresh = RefreshToken.for_user(user)
    return Response({
        'refresh': str(refresh),
        'access': str(refresh.access_token),
        'user': {'id': user.id, 'username': user.username, 'email': user.email}
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    return Response({'message': 'Logout successful'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verify_token(request):
    return Response({'valid': True, 'user': {'id': request.user.id, 'username': request.user.username, 'email': request.user.email}})


# ========================
# PRODUCT VIEWSET
# ========================
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]


# ========================
# ORDER VIEWSET
# ========================
class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        data = request.data

        # 1️⃣ Create Order
        order = Order.objects.create(
            order_id=data.get('order_id'),
            customer=data.get('customer'),
            customer_address=data.get('customer_address', ''),
            date_np=data.get('date_np', '')
        )

        # 2️⃣ Create OrderItems & CombinedRecords
        items = data.get('items', [])
        for item in items:
            product = Product.objects.get(id=item.get('product'))

            order_item = OrderItem.objects.create(
                order=order,
                product=product,
                particulars=item.get('particulars', product.name),
                quantity=item.get('quantity', 1),
                rate=item.get('rate', product.price),
            )
            product.stock -= order_item.quantity
            product.save(update_fields=['stock'])

            CombinedRecord.objects.create(
                order_id=order.order_id,
                customer=order.customer,
                customer_address=order.customer_address,
                date_np=order.date_np,
                product_name=product.name,
                quantity=order_item.quantity,
                rate=order_item.rate,
                total=order_item.amount,
            )

        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ========================
# COMBINED RECORD VIEWSET
# ========================
class CombinedRecordViewSet(viewsets.ModelViewSet):
    queryset = CombinedRecord.objects.all().order_by('-date_created')
    serializer_class = CombinedRecordSerializer
    permission_classes = [IsAuthenticated]
