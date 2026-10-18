from django.apps import AppConfig


class TriageConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.triage"
    label = "triage"

    def ready(self):
        import apps.triage.signals  # noqa: F401  (registers the post_save receiver)
