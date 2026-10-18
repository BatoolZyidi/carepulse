"""
RBAC permission classes (rules.md §1.2 — Strict Data Isolation).

These gate VIEW ACCESS ONLY. Queryset-level filtering (the actual data
isolation — `patient__doctor__user=request.user` / `user=request.user`)
MUST additionally be applied in every view's get_queryset(). Permission
classes alone are not sufficient for RBAC in this system.
"""
from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    message = "Only Admin accounts may perform this action."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_admin)


class IsDoctor(BasePermission):
    message = "Only Doctor accounts may perform this action."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_doctor)


class IsPatient(BasePermission):
    message = "Only Patient accounts may perform this action."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_patient)


class IsAdminOrDoctor(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_admin or request.user.is_doctor)
        )
