"""
Base Django settings for CarePulse.
Shared across local & production. Never hardcode secrets here —
everything sensitive is pulled from environment variables via `decouple`.
"""
from datetime import timedelta
from pathlib import Path

from decouple import Csv, config

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = config("DJANGO_SECRET_KEY", default="insecure-dev-key-change-me")
DEBUG = config("DJANGO_DEBUG", default=False, cast=bool)
ALLOWED_HOSTS = config("DJANGO_ALLOWED_HOSTS", default="localhost,127.0.0.1", cast=Csv())

# ------------------------------------------------------------------
# Applications
# ------------------------------------------------------------------
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third party
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "channels",
    "django_celery_beat",
    # CarePulse apps
    "apps.authentication",
    "apps.profiles",
    "apps.triage",
    "apps.scheduler",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "carepulse.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "carepulse.wsgi.application"
ASGI_APPLICATION = "carepulse.asgi.application"

# ------------------------------------------------------------------
# Database — Supabase (PostgreSQL)
# ------------------------------------------------------------------
import urllib.parse

SUPABASE_DB_URL = config("SUPABASE_DB_URL", default="")
if SUPABASE_DB_URL:
    url = urllib.parse.urlparse(SUPABASE_DB_URL)
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": url.path.lstrip("/") or "postgres",
            "USER": urllib.parse.unquote(url.username or "postgres"),
            "PASSWORD": urllib.parse.unquote(url.password or ""),
            "HOST": url.hostname or "localhost",
            "PORT": str(url.port or 5432),
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": config("SUPABASE_DB_NAME", default="postgres"),
            "USER": config("SUPABASE_DB_USER", default="postgres"),
            "PASSWORD": config("SUPABASE_DB_PASSWORD", default=""),
            "HOST": config("SUPABASE_DB_HOST", default="localhost"),
            "PORT": config("SUPABASE_DB_PORT", default="5432"),
        }
    }

# ------------------------------------------------------------------
# Custom User Model
# ------------------------------------------------------------------
AUTH_USER_MODEL = "authentication.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ------------------------------------------------------------------
# REST Framework / JWT
# ------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
    ),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=config("JWT_ACCESS_TOKEN_LIFETIME_MIN", default=60, cast=int)),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=config("JWT_REFRESH_TOKEN_LIFETIME_DAYS", default=7, cast=int)),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "SIGNING_KEY": config("JWT_SECRET_KEY", default=SECRET_KEY),
    "ALGORITHM": "HS256",
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}

# ------------------------------------------------------------------
# CORS
# ------------------------------------------------------------------
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# ------------------------------------------------------------------
# Channels (WebSockets — real-time HIGH-risk doctor alerts)
# ------------------------------------------------------------------
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [config("CELERY_BROKER_URL", default="redis://localhost:6379/0")],
        },
    },
}

# ------------------------------------------------------------------
# Celery (Scheduler — daily automated CALL-E outbound check-ins)
# ------------------------------------------------------------------
CELERY_BROKER_URL = config("CELERY_BROKER_URL", default="redis://localhost:6379/0")
CELERY_RESULT_BACKEND = config("CELERY_RESULT_BACKEND", default="redis://localhost:6379/0")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = "UTC"
DAILY_CHECKIN_HOUR_UTC = config("DAILY_CHECKIN_HOUR_UTC", default=14, cast=int)

# ------------------------------------------------------------------
# Third-Party Service Credentials (never hardcode — pulled at runtime)
# ------------------------------------------------------------------
SUPABASE_URL = config("SUPABASE_URL", default="")
SUPABASE_ANON_KEY = config("SUPABASE_ANON_KEY", default="")
SUPABASE_SERVICE_ROLE_KEY = config("SUPABASE_SERVICE_ROLE_KEY", default="")
SUPABASE_STORAGE_BUCKET = config("SUPABASE_STORAGE_BUCKET", default="call-recordings")

CALLE_API_KEY = config("CALLE_API_KEY", default="")
CALLE_API_BASE_URL = config("CALLE_API_BASE_URL", default="https://api.calle.ai/v1")
CALLE_WEBHOOK_SECRET = config("CALLE_WEBHOOK_SECRET", default="")
CALLE_AGENT_ID = config("CALLE_AGENT_ID", default="")
# Public URL of THIS backend — CALL-E posts the completed call transcript here.
# For local dev, set this to your ngrok/tunnel URL so CALL-E can reach you.
# e.g. BACKEND_BASE_URL=https://your-ngrok-id.ngrok-free.app
BACKEND_BASE_URL = config("BACKEND_BASE_URL", default="")

# --- Clinical NLP (AMD Token Factory — Gemma) ---
GEMMA_API_KEY = config("GEMMA_API_KEY", default=config("AMD_API_KEY", default=config("GEMINI_API_KEY", default="")))
GEMMA_API_BASE_URL = config("GEMMA_API_BASE_URL", default="https://developer.amd.com.cn/radeon/api/v1")
GEMMA_MODEL = config("GEMMA_MODEL", default="Gemma-4-31B-IT")

# Backwards compatibility aliases
GEMINI_API_KEY = GEMMA_API_KEY
GEMINI_MODEL = GEMMA_MODEL

# ------------------------------------------------------------------
# Admin Seed (bootstraps the one-and-only Admin account)
# ------------------------------------------------------------------
ADMIN_SEED_USERNAME = config("ADMIN_SEED_USERNAME", default="admin")
ADMIN_SEED_EMAIL = config("ADMIN_SEED_EMAIL", default="admin@carepulse.health")
ADMIN_SEED_PASSWORD = config("ADMIN_SEED_PASSWORD", default="")

# ------------------------------------------------------------------
# I18N / Static
# ------------------------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# CarePulse triage thresholds (rules.md §2.3) — centralised so services agree.
TRIAGE_HIGH_RISK_PAIN_LEVEL = 8
TRIAGE_HIGH_RISK_TEMP_F = 101.0
TRIAGE_RED_FLAG_KEYWORDS = ["chest pain", "bleeding", "shortness of breath"]
