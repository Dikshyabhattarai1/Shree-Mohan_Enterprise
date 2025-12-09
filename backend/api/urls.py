# backend/api/urls.py
from rest_framework import routers
from .views import ProductViewSet, OrderViewSet, SaleRecordViewSet

router = routers.DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'salerecords', SaleRecordViewSet, basename='salerecord')

urlpatterns = router.urls
