from django.urls import path

from . import views

urlpatterns = [
    # --- Admin: Provisioning & Governance (prd.md §3.1) ---
    path("admin/create-doctor/", views.AdminCreateDoctorView.as_view(), name="admin-create-doctor"),
    path("admin/create-patient/", views.AdminCreatePatientView.as_view(), name="admin-create-patient"),
    path("admin/doctors/", views.AdminDoctorListView.as_view(), name="admin-doctor-list"),
    path("admin/patients/", views.AdminPatientListView.as_view(), name="admin-patient-list"),
    path("admin/patients/<uuid:patient_id>/assign/", views.AdminAssignPatientView.as_view(), name="admin-assign-patient"),
    path("admin/patients/<uuid:patient_id>/discharge-plan/", views.AdminUpdatePatientCarePlanView.as_view(), name="admin-patient-discharge-plan"),
    path("admin/assignment-audit/", views.AdminAssignmentAuditView.as_view(), name="admin-assignment-audit"),

    # --- Doctor: Scoped Roster (prd.md §3.2) ---
    path("doctor/me/", views.DoctorMeView.as_view(), name="doctor-me"),
    path("doctor/patients/", views.DoctorPatientRosterView.as_view(), name="doctor-patient-roster"),
    path("doctor/patients/<uuid:patient_id>/", views.DoctorPatientDetailView.as_view(), name="doctor-patient-detail"),
    path("doctor/patients/<uuid:patient_id>/checkup/", views.DoctorUpdateCheckupScheduleView.as_view(), name="doctor-patient-checkup"),

    # --- Patient: View-Only Portal (prd.md §3.3) ---
    path("patient/me/", views.PatientMeView.as_view(), name="patient-me"),
]
