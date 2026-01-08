"""
ASGI config for textileflow project.
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'textileflow.settings')

application = get_asgi_application()
