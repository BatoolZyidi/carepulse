"""Celery application entrypoint (docker-compose runs `celery -A carepulse worker` / `beat`)."""
import os

from celery import Celery
from celery.schedules import crontab
from django.conf import settings

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "carepulse.settings.local")

app = Celery("carepulse")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()


@app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    """Daily automated CALL-E check-in trigger (prd.md §3.4 — Scheduler Service).

    Referenced by task NAME (string) rather than importing the task function
    at module load time — Django's app registry isn't ready yet when this
    module is first imported from carepulse/__init__.py.
    """
    sender.add_periodic_task(
        crontab(hour=settings.DAILY_CHECKIN_HOUR_UTC, minute=0),
        sender.signature("scheduler.run_daily_checkins"),
        name="daily-patient-checkin-calls",
    )
