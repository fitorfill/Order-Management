from django.contrib import admin
from django.urls import path, include
from rest_framework.authtoken.views import obtain_auth_token
from rest_framework.documentation import include_docs_urls

urlpatterns = [
    path('admin/', admin.site.urls),
    # Include the orders app URLs
    path('api/', include('orders.urls')),
    # Token authentication endpoint
    path('api/token/', obtain_auth_token, name='api-token'),
    # API documentation
    path('docs/', include_docs_urls(title='Silk Road Trading API')),
]
