from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User


from django.db.models import Q


class RoleAwareTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Unified /api/auth/login/ endpoint (prd.md §2 — single login portal for
    Admin, Doctor and Patient). Embeds `role` and profile display name in the
    JWT payload so the React frontend can route to the correct isolated
    dashboard without a second round-trip.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["username"] = user.username
        token["email"] = user.email
        return token

    def validate(self, attrs):
        username_or_email = attrs.get(self.username_field)
        if username_or_email:
            user = User.objects.filter(Q(username=username_or_email) | Q(email=username_or_email)).first()
            if user:
                attrs[self.username_field] = user.username
        data = super().validate(attrs)
        data["role"] = self.user.role
        data["user"] = {
            "id": str(self.user.id),
            "username": self.user.username,
            "email": self.user.email,
            "role": self.user.role,
        }
        return data


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "role", "created_at"]
        read_only_fields = fields
