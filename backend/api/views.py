from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db import transaction
from .models import Product, Order, OrderItem, SaleRecord
from .serializers import ProductSerializer, OrderSerializer, SaleRecordSerializer


# ============================================
# AUTHENTICATION VIEWS
# ============================================

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Custom login endpoint that returns JWT tokens
    POST /api/login/
    Body: {"username": "admin", "password": "your_password"}
    """
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response(
            {'error': 'Please provide both username and password'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Authenticate user
    user = authenticate(username=username, password=password)
    
    if user is not None:
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
            }
        }, status=status.HTTP_200_OK)
    else:
        return Response(
            {'error': 'Invalid username or password'},
            status=status.HTTP_401_UNAUTHORIZED
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Logout endpoint - blacklists the refresh token (optional)
    POST /api/logout/
    """
    try:
        return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verify_token(request):
    """
    Verify if token is valid
    GET /api/verify-token/
    """
    return Response({
        'valid': True,
        'user': {
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
        }
    })


# ============================================
# PRODUCT VIEWS (Protected)
# ============================================

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]


# ============================================
# ORDER VIEWS (Protected)
# ============================================

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

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


# ============================================
# SALES RECORD VIEWS (Protected)
# ============================================

class SaleRecordViewSet(viewsets.ModelViewSet):
    queryset = SaleRecord.objects.all()
    serializer_class = SaleRecordSerializer
    permission_classes = [IsAuthenticated]
    ordering = ['-date']