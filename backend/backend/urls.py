from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static

def api_root(request):
    """Root endpoint - returns API information"""
    return JsonResponse({
        'message': 'Shree Mohan Enterprise API',
        'status': 'running',
        'version': '1.0',
        'endpoints': {
            'admin': '/admin/',
            'api': '/api/',
        }
    })

urlpatterns = [
    path('', api_root, name='api-root'),  # Root endpoint returns JSON
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),  # Your API routes
]

# Serve static files during development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)