from django.contrib import admin
from django.urls import path, include
# from rest_framework.authtoken.views import obtain_auth_token # Replaced by simplejwt views
from rest_framework_simplejwt.views import ( # Import simplejwt views
    TokenObtainPairView,
    TokenRefreshView,
)
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

# Create a schema view for Swagger documentation
schema_view = get_schema_view(
    openapi.Info(
        title="Silk Road Trading API",
        default_version='v1',
        description="API for managing orders in the Silk Road Trading system",
        terms_of_service="https://www.example.com/terms/",
        contact=openapi.Contact(email="contact@silkroadtrading.com"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    path('admin/', admin.site.urls),
    # Include the users app URLs
    path('api/users/', include('users.urls')),
    # Simple JWT Token endpoints
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # API documentation with Swagger UI
    path('docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]
