"""
services/supabase_client.py

Isolated Supabase bindings (rules.md §3.2). Django + `psycopg2` talks to the
Supabase Postgres database directly via DATABASES (see carepulse/settings/base.py) —
this module is specifically for the Supabase *client library* features Django's
ORM doesn't cover: Storage (call recording audio files) and, optionally,
Supabase Auth/Realtime if the team wants to lean on them later.

Kept as a lazy singleton so importing this module has zero side effects
when SUPABASE_URL / keys aren't set yet (e.g. fresh clone before .env setup).
"""
import logging
from typing import Optional

from django.conf import settings

logger = logging.getLogger(__name__)

_client = None


def get_supabase_client():
    """Returns a cached `supabase.Client`, or None if not configured."""
    global _client
    if _client is not None:
        return _client

    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        logger.warning("Supabase credentials not configured — supabase_client will no-op.")
        return None

    from supabase import create_client

    _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    return _client


def upload_call_recording(file_bytes: bytes, filename: str, content_type: str = "audio/mpeg") -> Optional[str]:
    """
    Uploads a call recording to the SUPABASE_STORAGE_BUCKET and returns its
    public URL, or None if Supabase Storage isn't configured. Used as a
    fallback if CALL-E doesn't host its own audio URLs.
    """
    client = get_supabase_client()
    if client is None:
        return None

    bucket = settings.SUPABASE_STORAGE_BUCKET
    try:
        client.storage.from_(bucket).upload(
            path=filename,
            file=file_bytes,
            file_options={"content-type": content_type, "upsert": "true"},
        )
        return client.storage.from_(bucket).get_public_url(filename)
    except Exception:  # noqa: BLE001
        logger.exception("Failed to upload call recording %s to Supabase Storage.", filename)
        return None
