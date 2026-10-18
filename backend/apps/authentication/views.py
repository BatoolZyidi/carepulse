from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import RoleAwareTokenObtainPairSerializer, UserSerializer


class LoginView(TokenObtainPairView):
    """
    POST /api/auth/login/
    {"username": "...", "password": "..."}

    The single, unified login portal (prd.md §1 — "NO public self-registration").
    Returns JWT access/refresh tokens plus the caller's role so the frontend
    can route to /admin, /doctor or /patient.
    """
    serializer_class = RoleAwareTokenObtainPairSerializer


class MeView(APIView):
    """GET /api/auth/me/ — returns the authenticated user's own profile."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
