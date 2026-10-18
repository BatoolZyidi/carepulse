from django.contrib.auth.hashers import make_password
from django.db import transaction
from rest_framework import serializers

from apps.authentication.models import User, UserRole

from .models import AssignmentAudit, Doctor, Patient


# ------------------------------------------------------------------
# Read serializers
# ------------------------------------------------------------------
class DoctorSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    patient_count = serializers.SerializerMethodField()

    class Meta:
        model = Doctor
        fields = [
            "id", "user", "username", "email", "full_name", "specialty",
            "license_number", "phone_number", "patient_count",
        ]
        read_only_fields = ["id", "user"]

    def get_patient_count(self, obj):
        return obj.patients.count()


class PatientSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    doctor_name = serializers.CharField(source="doctor.full_name", read_only=True, default=None)
    status = serializers.CharField(read_only=True)

    class Meta:
        model = Patient
        fields = [
            "id", "user", "username", "email", "doctor", "doctor_name", "full_name",
            "date_of_birth", "phone_number", "emergency_contact_name",
            "emergency_contact_phone", "care_type", "primary_diagnosis",
            "discharge_date", "prescription", "diet_instructions",
            "medical_reports", "next_checkup_date", "status", "created_at",
        ]
        read_only_fields = ["id", "user", "created_at"]


# ------------------------------------------------------------------
# Admin-only provisioning serializers (rules.md §1.1 — no public sign-up)
# ------------------------------------------------------------------
class CreateDoctorSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=255)
    specialty = serializers.CharField(max_length=100)
    license_number = serializers.CharField(max_length=64, required=False, allow_blank=True)
    email = serializers.EmailField()
    phone_number = serializers.CharField(max_length=20)
    username = serializers.CharField(max_length=150)
    initial_password = serializers.CharField(write_only=True, min_length=8)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data["username"],
            email=validated_data["email"],
            role=UserRole.DOCTOR,
            password=make_password(validated_data["initial_password"]),
        )
        doctor = Doctor.objects.create(
            user=user,
            full_name=validated_data["full_name"],
            specialty=validated_data["specialty"],
            license_number=validated_data.get("license_number", ""),
            phone_number=validated_data["phone_number"],
        )
        return doctor


class CreatePatientSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=255)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    phone_number = serializers.CharField(max_length=20)
    emergency_contact_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    emergency_contact_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    primary_diagnosis = serializers.CharField()
    care_type = serializers.ChoiceField(choices=["post_op", "chronic"])
    discharge_date = serializers.DateField(required=False, allow_null=True)
    doctor_id = serializers.UUIDField(required=False, allow_null=True)
    email = serializers.EmailField()
    username = serializers.CharField(max_length=150)
    initial_password = serializers.CharField(write_only=True, min_length=8)

    # Discharge Care Plan (Prescription, Diet, Reports, Next Checkup)
    prescription = serializers.ListField(child=serializers.DictField(), required=False, default=list)
    diet_instructions = serializers.CharField(required=False, allow_blank=True, default="")
    medical_reports = serializers.ListField(child=serializers.DictField(), required=False, default=list)
    next_checkup_date = serializers.DateTimeField(required=False, allow_null=True)

    def to_internal_value(self, data):
        import json
        mutable_data = data.copy() if hasattr(data, "copy") else dict(data)
        if mutable_data.get("next_checkup_date") == "":
            mutable_data["next_checkup_date"] = None
        if mutable_data.get("discharge_date") == "":
            mutable_data["discharge_date"] = None
        if mutable_data.get("date_of_birth") == "":
            mutable_data["date_of_birth"] = None
        if isinstance(mutable_data.get("prescription"), str):
            try:
                mutable_data["prescription"] = json.loads(mutable_data["prescription"])
            except Exception:
                pass
        if isinstance(mutable_data.get("medical_reports"), str):
            try:
                mutable_data["medical_reports"] = json.loads(mutable_data["medical_reports"])
            except Exception:
                pass
        return super().to_internal_value(mutable_data)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value

    def validate_doctor_id(self, value):
        if value and not Doctor.objects.filter(id=value).exists():
            raise serializers.ValidationError("No doctor exists with that ID.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        doctor_id = validated_data.pop("doctor_id", None)
        user = User.objects.create(
            username=validated_data["username"],
            email=validated_data["email"],
            role=UserRole.PATIENT,
            password=make_password(validated_data["initial_password"]),
        )
        patient = Patient.objects.create(
            user=user,
            doctor_id=doctor_id,
            full_name=validated_data["full_name"],
            date_of_birth=validated_data.get("date_of_birth"),
            phone_number=validated_data["phone_number"],
            emergency_contact_name=validated_data.get("emergency_contact_name", ""),
            emergency_contact_phone=validated_data.get("emergency_contact_phone", ""),
            care_type=validated_data["care_type"],
            primary_diagnosis=validated_data["primary_diagnosis"],
            discharge_date=validated_data.get("discharge_date"),
            prescription=validated_data.get("prescription", []),
            diet_instructions=validated_data.get("diet_instructions", ""),
            medical_reports=validated_data.get("medical_reports", []),
            next_checkup_date=validated_data.get("next_checkup_date"),
        )
        return patient


class DoctorUpdateCheckupScheduleSerializer(serializers.ModelSerializer):
    """Allows assigned doctor to edit the next checkup schedule and diet/care guidance."""
    next_checkup_date = serializers.DateTimeField(required=False, allow_null=True)

    class Meta:
        model = Patient
        fields = ["next_checkup_date", "diet_instructions"]

    def to_internal_value(self, data):
        mutable_data = data.copy() if hasattr(data, "copy") else dict(data)
        if mutable_data.get("next_checkup_date") == "":
            mutable_data["next_checkup_date"] = None
        return super().to_internal_value(mutable_data)


class PatientCarePlanSerializer(serializers.ModelSerializer):
    """Full care plan serializer for Admin or Doctor updates."""
    next_checkup_date = serializers.DateTimeField(required=False, allow_null=True)

    class Meta:
        model = Patient
        fields = ["next_checkup_date", "prescription", "diet_instructions", "medical_reports"]

    def to_internal_value(self, data):
        import json
        mutable_data = data.copy() if hasattr(data, "copy") else dict(data)
        if mutable_data.get("next_checkup_date") == "":
            mutable_data["next_checkup_date"] = None
        if isinstance(mutable_data.get("prescription"), str):
            try:
                mutable_data["prescription"] = json.loads(mutable_data["prescription"])
            except Exception:
                pass
        if isinstance(mutable_data.get("medical_reports"), str):
            try:
                mutable_data["medical_reports"] = json.loads(mutable_data["medical_reports"])
            except Exception:
                pass
        return super().to_internal_value(mutable_data)


class AssignDoctorSerializer(serializers.Serializer):
    doctor_id = serializers.UUIDField(allow_null=True)

    def validate_doctor_id(self, value):
        if value and not Doctor.objects.filter(id=value).exists():
            raise serializers.ValidationError("No doctor exists with that ID.")
        return value


class AssignmentAuditSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    previous_doctor_name = serializers.CharField(source="previous_doctor.full_name", read_only=True, default=None)
    new_doctor_name = serializers.CharField(source="new_doctor.full_name", read_only=True, default=None)
    changed_by_username = serializers.CharField(source="changed_by.username", read_only=True)

    class Meta:
        model = AssignmentAudit
        fields = [
            "id", "patient", "patient_name", "previous_doctor", "previous_doctor_name",
            "new_doctor", "new_doctor_name", "changed_by_username", "changed_at",
        ]
        read_only_fields = fields
