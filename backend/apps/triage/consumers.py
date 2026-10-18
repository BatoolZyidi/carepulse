"""
WebSocket consumer backing prd.md §3.2's real-time Emergency Alert Banner.
Each authenticated Doctor connects to /ws/alerts/ and is subscribed to a
per-doctor channel group (`doctor_<doctor_id>`), so they only ever receive
pushes for their own assigned patients — consistent with rules.md §1.2's
strict data-isolation rule.
"""
import json

from channels.generic.websocket import AsyncJsonWebsocketConsumer


class DoctorAlertConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")

        if user is None or not user.is_authenticated or not getattr(user, "is_doctor", False):
            await self.close(code=4401)
            return

        doctor_profile = await self._get_doctor_id(user)
        if doctor_profile is None:
            await self.close(code=4403)
            return

        self.group_name = f"doctor_{doctor_profile}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def alert_push(self, event):
        """Handler for {"type": "alert.push", "payload": {...}} group_send messages."""
        await self.send(text_data=json.dumps(event["payload"]))

    @staticmethod
    async def _get_doctor_id(user):
        from asgiref.sync import sync_to_async

        from apps.profiles.models import Doctor

        @sync_to_async
        def _fetch():
            doctor = Doctor.objects.filter(user=user).first()
            return str(doctor.id) if doctor else None

        return await _fetch()
