# -*- coding: utf-8 -*-
from datetime import timedelta

import pytest

from services.security import (
    TokenError,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)


def test_hash_password_round_trip():
    hashed = hash_password("salasana123")
    assert hashed != "salasana123"
    assert verify_password("salasana123", hashed) is True


def test_hash_password_rejects_wrong_password():
    hashed = hash_password("salasana123")
    assert verify_password("vaarasalasana", hashed) is False


def test_hash_password_produces_different_hash_each_time():
    # bcrypt salts each hash, so the same password should never hash to the
    # same string twice - if it did, that'd mean the salt isn't working.
    assert hash_password("sama") != hash_password("sama")


def test_access_token_decodes_to_same_user_id():
    token = create_access_token("user-123")
    assert decode_token(token, expected_type="access") == "user-123"


def test_refresh_token_decodes_to_same_user_id():
    token = create_refresh_token("user-123")
    assert decode_token(token, expected_type="refresh") == "user-123"


def test_access_token_rejected_as_refresh():
    token = create_access_token("user-123")
    with pytest.raises(TokenError):
        decode_token(token, expected_type="refresh")


def test_refresh_token_rejected_as_access():
    token = create_refresh_token("user-123")
    with pytest.raises(TokenError):
        decode_token(token, expected_type="access")


def test_expired_token_is_rejected():
    token = create_access_token("user-123", expires_delta=timedelta(seconds=-1))
    with pytest.raises(TokenError):
        decode_token(token, expected_type="access")


def test_garbage_token_is_rejected():
    with pytest.raises(TokenError):
        decode_token("not-a-real-token", expected_type="access")


def test_token_signed_with_different_key_is_rejected():
    from jose import jwt as jose_jwt
    from config import JWT_ALGORITHM

    forged = jose_jwt.encode(
        {"sub": "user-123", "type": "access"},
        "a-completely-different-secret",
        algorithm=JWT_ALGORITHM,
    )
    with pytest.raises(TokenError):
        decode_token(forged, expected_type="access")
