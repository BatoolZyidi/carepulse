"""
prd.md §3.2 — "WebSockets/Server-Sent Events (SSE) push immediate alerts
when risk_level == 'HIGH'."

Rather than pushing from inside the webhook view directly, we decouple via
a Django signal: whenever an `Alert` row is created, this signal fires and
pushes a packet down the assigned Doctor's `doctor_<id>` channel group.
Keeping this in signals.py (per the requested project structure) means any
future code path that creates an Alert (manual escalation, admin override,
etc.) gets the same real-time push for free.
"""
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Alert
from .serializers import AlertSerializer


@receiver(post_save, sender=Alert)
def push_alert_to_doctor(sender, instance: Alert, created, **kwargs):
    if not created:
        return

    channel_layer = get_channel_layer()
    if channel_layer is None:
        return  # Channels/Redis not configured (e.g. during tests) — skip silently.

    group_name = f"doctor_{instance.doctor_id}"
    payload = AlertSerializer(instance).data

    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            "type": "alert.push",
            "payload": payload,
        },
    )
