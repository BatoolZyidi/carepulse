"""
python manage.py seed_dummy_data

Seeds 2 Doctor accounts and 4 Patient accounts from
backend/data/dummy_data.json into the database.
Run AFTER migrate and seed_admin.
"""
import json
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import transaction

# pyrefly: ignore [missing-import]
from apps.authentication.models import User, UserRole
# pyrefly: ignore [missing-import]
from apps.profiles.models import CareCategory, Doctor, Patient


DATA_FILE = Path(__file__).resolve().parents[5] / "data" / "dummy_data.json"


class Command(BaseCommand):
    help = "Seed dummy doctors and patients from backend/data/dummy_data.json"

    def handle(self, *args, **options):
        with open(DATA_FILE, encoding="utf-8") as f:
            data = json.load(f)

        with transaction.atomic():
            doctor_map = self._seed_doctors(data["doctors"])
            self._seed_patients(data["patients"], doctor_map)

        self.stdout.write(self.style.SUCCESS(
            f"Done — {len(data['doctors'])} doctors, {len(data['patients'])} patients seeded."
        ))

    # ------------------------------------------------------------------
    def _seed_doctors(self, doctors_data):
        doctor_map = {}
        for d in doctors_data:
            user, created = User.objects.get_or_create(
                username=d["username"],
                defaults={
                    "email": d["email"],
                    "role": UserRole.DOCTOR,
                    "is_staff": False,
                    "is_superuser": False,
                },
            )
            if created:
                user.set_password(d["password"])
                user.save()
                self.stdout.write(f"  Created doctor user: {user.username}")
            else:
                self.stdout.write(self.style.WARNING(
                    f"  Doctor user already exists: {user.username} — skipping user creation."
                ))

            doctor, _ = Doctor.objects.update_or_create(
                user=user,
                defaults={
                    "full_name": d["full_name"],
                    "specialty": d["specialty"],
                    "license_number": d["license_number"],
                    "phone_number": d["phone_number"],
                },
            )
            doctor_map[d["username"]] = doctor
        return doctor_map

    def _seed_patients(self, patients_data, doctor_map):
        for p in patients_data:
            user, created = User.objects.get_or_create(
                username=p["username"],
                defaults={
                    "email": p["email"],
                    "role": UserRole.PATIENT,
                    "is_staff": False,
                    "is_superuser": False,
                },
            )
            if created:
                user.set_password(p["password"])
                user.save()
                self.stdout.write(f"  Created patient user: {user.username}")
            else:
                self.stdout.write(self.style.WARNING(
                    f"  Patient user already exists: {user.username} — updating assignments."
                ))

            assigned_doctor = doctor_map.get(p.get("assigned_doctor"))

            # update_or_create so doctor assignments are applied even on re-runs
            Patient.objects.update_or_create(
                user=user,
                defaults={
                    "doctor": assigned_doctor,
                    "full_name": p["full_name"],
                    "date_of_birth": p.get("date_of_birth"),
                    "phone_number": p["phone_number"],
                    "emergency_contact_name": p.get("emergency_contact_name", ""),
                    "emergency_contact_phone": p.get("emergency_contact_phone", ""),
                    "care_type": p["care_type"],
                    "primary_diagnosis": p["primary_diagnosis"],
                    "discharge_date": p.get("discharge_date"),
                },
            )
            self.stdout.write(f"  Patient {p['full_name']} -> {assigned_doctor}")
