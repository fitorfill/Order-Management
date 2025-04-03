import pytest
from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
# from rest_framework.authtoken.models import Token # No longer used
from rest_framework_simplejwt.tokens import RefreshToken # Needed for profile test

# Mark all tests in this module to use the database
pytestmark = pytest.mark.django_db

@pytest.fixture
def api_client():
    """Fixture to provide an API client instance."""
    return APIClient()

@pytest.fixture
def test_user_data():
    """Fixture for test user registration data."""
    return {
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'testpassword123',
        'password2': 'testpassword123'
    }

@pytest.fixture
def create_test_user(test_user_data):
    """Fixture to create a user directly in the database."""
    user = User.objects.create_user(
        username=test_user_data['username'],
        email=test_user_data['email'],
        password=test_user_data['password']
    )
    return user

# --- Test Registration Endpoint ---
def test_register_user_success(api_client, test_user_data):
    """Test successful user registration."""
    url = reverse('register') # Uses the name defined in users/urls.py
    response = api_client.post(url, test_user_data, format='json')

    assert response.status_code == status.HTTP_201_CREATED
    assert 'access' in response.data # Check for JWT access token
    assert 'refresh' in response.data # Check for JWT refresh token
    assert 'user' in response.data
    assert response.data['user']['username'] == test_user_data['username']
    assert response.data['user']['email'] == test_user_data['email']
    assert User.objects.filter(username=test_user_data['username']).exists()
    # No need to check for Token model anymore

def test_register_user_password_mismatch(api_client, test_user_data):
    """Test registration failure due to password mismatch."""
    url = reverse('register')
    invalid_data = test_user_data.copy()
    invalid_data['password2'] = 'wrongpassword'
    response = api_client.post(url, invalid_data, format='json')

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert 'password' in response.data # Assuming serializer returns password error key
    assert not User.objects.filter(username=test_user_data['username']).exists()

def test_register_user_missing_fields(api_client, test_user_data):
    """Test registration failure due to missing fields."""
    url = reverse('register')
    invalid_data = test_user_data.copy()
    del invalid_data['email']
    response = api_client.post(url, invalid_data, format='json')

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert 'email' in response.data
    assert not User.objects.filter(username=test_user_data['username']).exists()

def test_register_user_duplicate_username(api_client, create_test_user, test_user_data):
    """Test registration failure due to duplicate username."""
    url = reverse('register')
    # create_test_user fixture already created a user with this username
    response = api_client.post(url, test_user_data, format='json')

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert 'username' in response.data # Check for username error

# --- Test Login/Token Endpoint ---
def test_login_user_success(api_client, create_test_user, test_user_data):
    """Test successful login via token endpoint."""
    url = reverse('token_obtain_pair') # Use the Simple JWT URL name
    login_data = {
        'username': test_user_data['username'],
        'password': test_user_data['password']
    }
    response = api_client.post(url, login_data, format='json')

    assert response.status_code == status.HTTP_200_OK
    assert 'access' in response.data # Check for access token
    assert 'refresh' in response.data # Check for refresh token
    # We don't need to verify the token model directly anymore

def test_login_user_invalid_password(api_client, create_test_user, test_user_data):
    """Test login failure with invalid password."""
    url = reverse('token_obtain_pair') # Use the Simple JWT URL name
    login_data = {
        'username': test_user_data['username'],
        'password': 'wrongpassword'
    }
    response = api_client.post(url, login_data, format='json')

    assert response.status_code == status.HTTP_401_UNAUTHORIZED # Simple JWT returns 401 for bad credentials
    assert 'detail' in response.data # Simple JWT uses 'detail' for errors

def test_login_user_nonexistent_user(api_client, test_user_data):
    """Test login failure with a username that doesn't exist."""
    url = reverse('token_obtain_pair') # Use the Simple JWT URL name
    login_data = {
        'username': 'nonexistentuser',
        'password': test_user_data['password']
    }
    response = api_client.post(url, login_data, format='json')

    assert response.status_code == status.HTTP_401_UNAUTHORIZED # Simple JWT returns 401
    assert 'detail' in response.data

# --- Test User Profile Endpoint ---
def test_get_user_profile_success(api_client, create_test_user):
    """Test retrieving user profile successfully with authentication."""
    url = reverse('user-profile') # Uses the name defined in users/urls.py
    # Generate JWT token for the test user
    refresh = RefreshToken.for_user(create_test_user)
    access_token = str(refresh.access_token)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}') # Authenticate client with JWT

    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data['username'] == create_test_user.username
    assert response.data['email'] == create_test_user.email

def test_get_user_profile_unauthenticated(api_client):
    """Test retrieving user profile fails without authentication."""
    url = reverse('user-profile')
    response = api_client.get(url)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED # Default for JWT is 401

# --- Test Database Query Integration ---
def test_database_query_user_retrieval(create_test_user, test_user_data):
    """Test retrieving a user directly from the database."""
    # create_test_user fixture ensures the user exists
    retrieved_user = User.objects.get(username=test_user_data['username'])

    assert retrieved_user is not None
    assert retrieved_user.email == test_user_data['email']
    assert retrieved_user.username == test_user_data['username']
    # We don't check the password directly, but we know create_user set it
    assert retrieved_user.check_password(test_user_data['password']) is True
