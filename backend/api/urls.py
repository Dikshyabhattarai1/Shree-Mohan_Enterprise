from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductViewSet,
    OrderViewSet,
    CombinedRecordViewSet,
    login_view,
    logout_view,
    verify_token
)

# Create a router and register our viewsets
router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'combined-records', CombinedRecordViewSet, basename='combinedrecord')

# API URL patterns
urlpatterns = [
    # Auth endpoints
    path('auth/login/', login_view, name='login'),
    path('auth/logout/', logout_view, name='logout'),
    path('auth/verify-token/', verify_token, name='verify-token'),

    # Router endpoints
    path('', include(router.urls)),
]