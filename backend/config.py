import os

# Auth settings, read from environment variables (see .env.example).
# SECRET_KEY has a dev-only fallback so the app still boots locally without
# a .env file, but that fallback must never be used outside local dev - a
# real deployment should always set SECRET_KEY explicitly.
SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-insecure-secret-change-me")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")

DATABASE_URL = os.getenv("DATABASE_URL", "")


def is_using_insecure_dev_secret() -> bool:
    """True if SECRET_KEY is still the local-dev fallback. Callers can use
    this to warn loudly (or refuse to start) in a real deployment."""

    return SECRET_KEY == "dev-only-insecure-secret-change-me"
