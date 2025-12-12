from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductViewSet, 
    OrderViewSet, 
    SaleRecordViewSet,
    login_view,
    logout_view,
    verify_token
)

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'salerecords', SaleRecordViewSet)

urlpatterns = [
    # Authentication endpoints
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),
    path('verify-token/', verify_token, name='verify-token'),
    
    # API routes
    path('', include(router.urls)),
]