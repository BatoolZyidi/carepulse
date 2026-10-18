"""
rules.md §1.2 — Strict Data Isolation (RBAC) is enforced here at the
QUERYSET level on every Doctor/Patient-facing view, in addition to the
permission_classes gate. Admin endpoints are the ONLY way accounts are
created (rules.md §1.1 — no public /api/register/).
"""
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AssignmentAudit, Doctor, Patient
from .permissions import IsAdmin, IsDoctor, IsPatient
from .serializers import (
    AssignDoctorSerializer,
    AssignmentAuditSerializer,
    CreateDoctorSerializer,
    CreatePatientSerializer,
    DoctorSerializer,
    DoctorUpdateCheckupScheduleSerializer,
    PatientCarePlanSerializer,
    PatientSerializer,
)


# ------------------------------------------------------------------
# ADMIN — Provisioning (prd.md §3.1)
# ------------------------------------------------------------------
class AdminCreateDoctorView(APIView):
    """POST /api/admin/create-doctor/ — Admin-only. Auto-assigns role=DOCTOR."""
    permission_classes = [IsAdmin]

    def post(self, request):
        serializer = CreateDoctorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        doctor = serializer.save()
        return Response(DoctorSerializer(doctor).data, status=status.HTTP_201_CREATED)


class AdminCreatePatientView(APIView):
    """POST /api/admin/create-patient/ — Admin-only. Auto-assigns role=PATIENT."""
    permission_classes = [IsAdmin]

    def post(self, request):
        serializer = CreatePatientSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        patient = serializer.save()
        return Response(PatientSerializer(patient).data, status=status.HTTP_201_CREATED)


class AdminDoctorListView(generics.ListAPIView):
    """GET /api/admin/doctors/ — full roster, Admin-only (global visibility)."""
    permission_classes = [IsAdmin]
    serializer_class = DoctorSerializer
    queryset = Doctor.objects.all().order_by("full_name")


class AdminPatientListView(generics.ListAPIView):
    """GET /api/admin/patients/ — full roster, Admin-only (global visibility)."""
    permission_classes = [IsAdmin]
    serializer_class = PatientSerializer
    queryset = Patient.objects.select_related("doctor").all().order_by("full_name")


class AdminAssignPatientView(APIView):
    """
    PATCH /api/admin/patients/<patient_id>/assign/
    {"doctor_id": "<uuid>" | null}

    Patient-to-Doctor Assignment Engine (prd.md §3.1) with audit trail.
    """
    permission_classes = [IsAdmin]

    def patch(self, request, patient_id):
        patient = get_object_or_404(Patient, id=patient_id)
        serializer = AssignDoctorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        previous_doctor = patient.doctor
        new_doctor_id = serializer.validated_data["doctor_id"]

        patient.doctor_id = new_doctor_id
        patient.save(update_fields=["doctor"])

        AssignmentAudit.objects.create(
            patient=patient,
            previous_doctor=previous_doctor,
            new_doctor_id=new_doctor_id,
            changed_by=request.user,
        )
        return Response(PatientSerializer(patient).data)


class AdminAssignmentAuditView(generics.ListAPIView):
    """GET /api/admin/assignment-audit/ — real-time reassignment audit history."""
    permission_classes = [IsAdmin]
    serializer_class = AssignmentAuditSerializer
    queryset = AssignmentAudit.objects.select_related(
        "patient", "previous_doctor", "new_doctor", "changed_by"
    ).all()


# ------------------------------------------------------------------
# DOCTOR — Scoped Patient Roster (prd.md §3.2)
# ------------------------------------------------------------------
class DoctorPatientRosterView(generics.ListAPIView):
    """
    GET /api/doctor/patients/
    Strictly scoped: `patient.doctor.user == request.user` (rules.md §1.2).
    A Doctor must NEVER receive another clinician's patients.
    """
    permission_classes = [IsDoctor]
    serializer_class = PatientSerializer

    def get_queryset(self):
        return Patient.objects.filter(doctor__user=self.request.user).order_by("full_name")


class DoctorPatientDetailView(generics.RetrieveUpdateAPIView):
    """
    GET /api/doctor/patients/<id>/ — scoped to the doctor's own roster.
    PATCH /api/doctor/patients/<id>/ — allows doctor to edit care plan / checkup schedule.
    """
    permission_classes = [IsDoctor]
    serializer_class = PatientSerializer
    lookup_url_kwarg = "patient_id"

    def get_queryset(self):
        return Patient.objects.filter(doctor__user=self.request.user)


class DoctorUpdateCheckupScheduleView(APIView):
    """
    PATCH /api/doctor/patients/<patient_id>/checkup/
    Allows the assigned doctor to update the patient's next scheduled check-up date/time.
    """
    permission_classes = [IsDoctor]

    def patch(self, request, patient_id):
        patient = get_object_or_404(
            Patient.objects.filter(doctor__user=request.user),
            id=patient_id
        )
        serializer = DoctorUpdateCheckupScheduleSerializer(patient, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(PatientSerializer(patient).data)


class AdminUpdatePatientCarePlanView(APIView):
    """
    PATCH /api/admin/patients/<patient_id>/discharge-plan/
    Allows admin to update discharge plan, prescription, reports, or next checkup.
    """
    permission_classes = [IsAdmin]

    def patch(self, request, patient_id):
        patient = get_object_or_404(Patient, id=patient_id)
        serializer = PatientCarePlanSerializer(patient, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(PatientSerializer(patient).data)


class DoctorMeView(APIView):
    """GET /api/doctor/me/ — the logged-in doctor's own profile."""
    permission_classes = [IsDoctor]

    def get(self, request):
        doctor = get_object_or_404(Doctor, user=request.user)
        return Response(DoctorSerializer(doctor).data)


# ------------------------------------------------------------------
# PATIENT — View-Only Portal (prd.md §3.3)
# ------------------------------------------------------------------
class PatientMeView(APIView):
    """GET /api/patient/me/ — strictly `user=request.user` (rules.md §1.2)."""
    permission_classes = [IsPatient]

    def get(self, request):
        patient = get_object_or_404(Patient, user=request.user)
        return Response(PatientSerializer(patient).data)
