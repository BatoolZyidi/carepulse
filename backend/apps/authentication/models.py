"""
Unified authentication model for CarePulse.

Per rules.md §1.1: there is NO public self-registration. Every User row is
created exclusively through Admin-provisioning endpoints (apps.profiles.views)
or the one-time Admin seed command. `role` is the single source of truth
that the frontend uses to route users to their isolated dashboard.
"""
import uuid

from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models


class UserRole(models.TextChoices):
    ADMIN = "admin", "Admin"
    DOCTOR = "doctor", "Doctor"
    PATIENT = "patient", "Patient"


class UserManager(BaseUserManager):
    """Custom manager — users are only ever created programmatically
    (Admin provisioning or seed command), never via open sign-up."""

    def create_user(self, username, email, password=None, role=UserRole.PATIENT, **extra_fields):
        if not email:
            raise ValueError("CarePulse users must have an email address.")
        if not username:
            raise ValueError("CarePulse users must have a username.")

        email = self.normalize_email(email)
        user = self.model(username=username, email=email, role=role, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", UserRole.ADMIN)
        return self.create_user(username, email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Mirrors the Supabase `users` table 1:1 (architecture.md §3)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(max_length=255, unique=True)
    role = models.CharField(max_length=10, choices=UserRole.choices, default=UserRole.PATIENT)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["email"]

    class Meta:
        db_table = "users"

    def __str__(self):
        return f"{self.username} ({self.role})"

    @property
    def is_admin(self):
        return self.role == UserRole.ADMIN

    @property
    def is_doctor(self):
        return self.role == UserRole.DOCTOR

    @property
    def is_patient(self):
        return self.role == UserRole.PATIENT
