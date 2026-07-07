from fastapi import APIRouter, Depends, HTTPException

from dependencies import get_current_user_id
from models.auth import LoginRequest, RefreshRequest, RegisterRequest, TokenResponse
from services.security import (
    TokenError,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])

_NOT_YET_WIRED = "Tietokantaa ei ole vielä kytketty tähän toimintoon. Ks. STATUS.md ja docs/adr/0001-authentication-and-authorization.md."


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(payload: RegisterRequest) -> TokenResponse:
    # Hashing works today and doesn't need a database - this is the value
    # that would be written to users.password_hash.
    hash_password(payload.password)

    # TODO(db): insert into users (email, name, password_hash). If the
    # email already exists, raise HTTPException(status_code=409,
    # detail="Sähköpostiosoite on jo käytössä.") instead of a plain 500.
    raise HTTPException(status_code=501, detail=_NOT_YET_WIRED)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest) -> TokenResponse:
    # TODO(db): look up the user by email, then:
    #   if not user or not user.password_hash or not verify_password(
    #       payload.password, user.password_hash
    #   ):
    #       raise HTTPException(status_code=401, detail="Väärä sähköposti tai salasana.")
    #   return TokenResponse(
    #       access_token=create_access_token(str(user.id)),
    #       refresh_token=create_refresh_token(str(user.id)),
    #   )
    raise HTTPException(status_code=501, detail=_NOT_YET_WIRED)


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest) -> TokenResponse:
    """Exchange a refresh token for a new access token. Token *validity*
    (signature, expiry, type) is fully checked below and doesn't need a
    database. What's still pending: checking the token hasn't been
    revoked - that needs a `refresh_tokens` lookup once the DB is wired,
    see docs/adr/0001-authentication-and-authorization.md."""

    try:
        user_id = decode_token(payload.refresh_token, expected_type="refresh")
    except TokenError as exc:
        raise HTTPException(status_code=401, detail=str(exc))

    # TODO(db): reject if this refresh token's hash is missing, expired, or
    # revoked in the `refresh_tokens` table. Consider rotating the refresh
    # token here too (issue a new one, revoke the old one).

    return TokenResponse(
        access_token=create_access_token(user_id),
        refresh_token=create_refresh_token(user_id),
    )


@router.get("/me")
def me(user_id: str = Depends(get_current_user_id)) -> dict:
    """Minimal "who am I" endpoint - also doubles as the live proof that
    the auth dependency correctly accepts valid access tokens and rejects
    everything else (missing header, wrong token type, expired, tampered).
    Returns just the id for now; a full profile needs the DB lookup in
    get_current_user (see dependencies.py)."""

    return {"id": user_id}


@router.get("/google/login")
def google_login() -> dict:
    # TODO: once GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET are set in .env,
    # build the Google OAuth authorize URL via authlib and redirect there
    # instead of raising.
    raise HTTPException(status_code=501, detail=_NOT_YET_WIRED)


@router.get("/google/callback")
def google_callback(code: str) -> TokenResponse:
    # TODO(db): exchange `code` for the user's Google profile via authlib,
    # then find-or-create a users row + an oauth_accounts row linking
    # (provider="google", provider_user_id=<google sub>) to it, then issue
    # tokens the same way /login does.
    raise HTTPException(status_code=501, detail=_NOT_YET_WIRED)
