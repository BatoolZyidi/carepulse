"""
python manage.py seed_admin

Bootstraps the single Admin superuser account from ADMIN_SEED_* env vars.
This is the ONLY way an Admin account is ever created outside the DB directly —
there is no public registration endpoint (rules.md §1.1).
"""
from django.conf import settings
from django.core.management.base import BaseCommand

from apps.authentication.models import User, UserRole


class Command(BaseCommand):
    help = "Seed the initial CarePulse Admin account from environment variables."

    def handle(self, *args, **options):
        username = settings.ADMIN_SEED_USERNAME
        email = settings.ADMIN_SEED_EMAIL
        password = settings.ADMIN_SEED_PASSWORD

        if not password:
            self.stderr.write(self.style.ERROR(
                "ADMIN_SEED_PASSWORD is not set in .env — refusing to seed a passwordless admin."
            ))
            return

        if User.objects.filter(role=UserRole.ADMIN).exists():
            self.stdout.write(self.style.WARNING("An Admin account already exists. Skipping."))
            return

        User.objects.create_superuser(username=username, email=email, password=password)
        self.stdout.write(self.style.SUCCESS(f"Admin account '{username}' created successfully."))
