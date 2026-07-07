from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from config import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    JWT_ALGORITHM,
    REFRESH_TOKEN_EXPIRE_DAYS,
    SECRET_KEY,
)

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# --- Password hashing ---------------------------------------------------

def hash_password(plain_password: str) -> str:
    return _pwd_context.hash(plain_password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    return _pwd_context.verify(plain_password, password_hash)


# --- JWT access/refresh tokens -------------------------------------------
#
# Both token types carry a "type" claim ("access" or "refresh") so a
# refresh token can't accidentally be accepted where an access token is
# expected, and vice versa - a common and easy-to-miss JWT auth bug.

class TokenError(Exception):
    """Raised for any invalid, expired, or wrong-type token."""


def create_access_token(user_id: str, expires_delta: timedelta | None = None) -> str:
    return _create_token(
        user_id,
        token_type="access",
        expires_delta=expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def create_refresh_token(user_id: str, expires_delta: timedelta | None = None) -> str:
    return _create_token(
        user_id,
        token_type="refresh",
        expires_delta=expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    )


def _create_token(user_id: str, token_type: str, expires_delta: timedelta) -> str:
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": user_id,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_token(token: str, expected_type: str) -> str:
    """Validate a token and return the user id (the "sub" claim). Raises
    TokenError for anything invalid: bad signature, expired, wrong type."""

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except JWTError as exc:
        raise TokenError("Token on virheellinen tai vanhentunut.") from exc

    if payload.get("type") != expected_type:
        raise TokenError(f"Odotettiin {expected_type}-tyyppistä tokenia.")

    user_id = payload.get("sub")
    if not user_id:
        raise TokenError("Token ei sisällä käyttäjätunnistetta.")

    return user_id
