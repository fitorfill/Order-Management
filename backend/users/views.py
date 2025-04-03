from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
# from rest_framework.authtoken.models import Token # No longer needed
# from rest_framework.authtoken.views import ObtainAuthToken # No longer needed
from rest_framework_simplejwt.tokens import RefreshToken # Import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer

class RegisterView(APIView):
    """API view for user registration."""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        # Log request data for debugging
        print("Registration request data:", request.data)
        
        serializer = RegisterSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            response_data = {
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
            
            return Response(response_data, status=status.HTTP_201_CREATED)
        
        print("Registration validation errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# The LoginView is no longer needed as Simple JWT provides /api/token/ endpoint
# class LoginView(ObtainAuthToken):
#     ... (Keep commented out or remove)

class UserProfileView(APIView):
    """API view for retrieving user profile."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
