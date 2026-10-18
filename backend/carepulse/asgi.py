"""
ASGI config for CarePulse.
Serves both standard HTTP (Django views) and WebSocket traffic
(real-time HIGH-risk alert push to Doctor dashboards) via Channels.
"""
import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "carepulse.settings.local")

django_asgi_app = get_asgi_application()

from apps.triage.routing import websocket_urlpatterns  # noqa: E402  (after django setup)

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": AuthMiddlewareStack(URLRouter(websocket_urlpatterns)),
    }
)
