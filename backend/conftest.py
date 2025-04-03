import os
import django
from django.conf import settings

# Ensure Django settings are configured for pytest
# This is often needed when pytest doesn't automatically pick up
# the DJANGO_SETTINGS_MODULE from pytest.ini for discovery.
def pytest_configure():
    if not settings.configured:
        # Set the settings module environment variable if not already set
        # (pytest-django usually does this, but explicitly setting can help)
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
        
        # Setup Django
        # This ensures apps are loaded etc. before tests run
        try:
            django.setup()
        except Exception as e:
            print(f"Error during django.setup() in pytest_configure: {e}")
            # Optionally re-raise or handle differently
            raise
