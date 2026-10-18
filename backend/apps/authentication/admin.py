from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    """Django-admin view of CarePulse users — for superuser/ops use only.
    This is NOT the public app; the public app has no sign-up (rules.md §1.1)."""
    list_display = ("username", "email", "role", "is_active", "created_at")
    list_filter = ("role", "is_active")
    search_fields = ("username", "email")
    ordering = ("-created_at",)
    fieldsets = (
        (None, {"fields": ("username", "email", "password")}),
        ("Role", {"fields": ("role",)}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("username", "email", "role", "password1", "password2"),
        }),
    )
