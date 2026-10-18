"""Local development settings for the real Supabase-backed project configuration."""
from .base import *  # noqa: F401,F403

DEBUG = True

# In-memory channel layer for local dev (no Redis dependency)
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer",
    },
}
