from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from services.security import TokenError, decode_token

_bearer_scheme = HTTPBearer(auto_error=True)


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
) -> str:
    """Validates the `Authorization: Bearer <access_token>` header and
    returns the authenticated user's id. Fully functional without a
    database - it only checks the token's signature, expiry and type.
    Use this directly wherever only the id is needed; use
    get_current_user below wherever the full profile is needed."""

    try:
        return decode_token(credentials.credentials, expected_type="access")
    except TokenError as exc:
        raise HTTPException(status_code=401, detail=str(exc))


def get_current_user(user_id: str = Depends(get_current_user_id)) -> str:
    """Placeholder for the full user-profile lookup. Once the database is
    wired, this should fetch the users row by id and return a UserOut (or
    raise 401 if the account no longer exists, e.g. a still-valid token
    for a deleted user). Route handlers can already depend on this now -
    only the body needs filling in once the DB is connected.

    TODO(db):
        user = get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=401, detail="Käyttäjää ei löydy.")
        return UserOut(
            id=str(user.id),
            email=user.email,
            name=user.name,
            email_verified=user.email_verified,
        )
    """

    return user_id
