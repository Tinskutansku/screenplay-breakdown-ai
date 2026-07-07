# -*- coding: utf-8 -*-
from fastapi.testclient import TestClient

import main
from services.security import create_access_token, create_refresh_token

client = TestClient(main.app)


def test_register_returns_not_yet_wired():
    response = client.post(
        "/auth/register",
        json={"email": "anna@example.com", "password": "salasana123"},
    )
    assert response.status_code == 501


def test_register_rejects_invalid_email():
    response = client.post(
        "/auth/register",
        json={"email": "not-an-email", "password": "salasana123"},
    )
    assert response.status_code == 422


def test_register_rejects_short_password():
    response = client.post(
        "/auth/register",
        json={"email": "anna@example.com", "password": "short"},
    )
    assert response.status_code == 422


def test_login_returns_not_yet_wired():
    response = client.post(
        "/auth/login",
        json={"email": "anna@example.com", "password": "salasana123"},
    )
    assert response.status_code == 501


def test_refresh_with_valid_refresh_token_issues_new_tokens():
    refresh_token = create_refresh_token("user-abc")
    response = client.post("/auth/refresh", json={"refresh_token": refresh_token})
    assert response.status_code == 200
    body = response.json()
    assert "access_token" in body
    assert "refresh_token" in body


def test_refresh_rejects_access_token():
    access_token = create_access_token("user-abc")
    response = client.post("/auth/refresh", json={"refresh_token": access_token})
    assert response.status_code == 401


def test_refresh_rejects_garbage_token():
    response = client.post("/auth/refresh", json={"refresh_token": "garbage"})
    assert response.status_code == 401


def test_me_requires_auth_header():
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_me_accepts_valid_access_token():
    token = create_access_token("user-xyz")
    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json() == {"id": "user-xyz"}


def test_me_rejects_refresh_token():
    token = create_refresh_token("user-xyz")
    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401


def test_google_login_returns_not_yet_wired():
    response = client.get("/auth/google/login")
    assert response.status_code == 501
