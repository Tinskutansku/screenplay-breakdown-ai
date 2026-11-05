# -*- coding: utf-8 -*-
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

import main

client = TestClient(main.app)

EXAMPLES_DIR = Path(__file__).resolve().parents[2] / "frontend" / "public" / "esimerkit"


def test_parse_script_rejects_empty_text():
    response = client.post("/parse-script", json={"script_text": "   "})
    assert response.status_code == 400
    assert "tyhjä" in response.json()["detail"]


def test_parse_script_accepts_valid_text():
    response = client.post(
        "/parse-script",
        json={"script_text": "INT. HUONE - PAIVA\nAnna istuu."},
    )
    assert response.status_code == 200
    scenes = response.json()
    assert len(scenes) == 1
    assert scenes[0]["location"] == "HUONE"


def test_upload_script_rejects_unsupported_extension():
    response = client.post(
        "/upload-script",
        files={"file": ("kasikirjoitus.pdf", b"hello", "application/pdf")},
    )
    assert response.status_code == 400


def test_upload_script_rejects_empty_file():
    response = client.post(
        "/upload-script",
        files={"file": ("empty.txt", b"", "text/plain")},
    )
    assert response.status_code == 400


def test_upload_script_rejects_non_utf8_txt():
    response = client.post(
        "/upload-script",
        files={"file": ("bad.txt", b"\xff\xfe garbled", "text/plain")},
    )
    assert response.status_code == 400


def test_upload_script_rejects_malformed_fdx():
    response = client.post(
        "/upload-script",
        files={"file": ("broken.fdx", b"<not-xml", "application/xml")},
    )
    assert response.status_code == 400


def test_upload_script_accepts_valid_txt():
    response = client.post(
        "/upload-script",
        files={
            "file": (
                "ok.txt",
                "INT. HUONE - PAIVA\nAnna istuu.".encode("utf-8"),
                "text/plain",
            )
        },
    )
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_health_returns_ok():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.parametrize("filename", ["viimeinen-juna.txt", "viimeinen-juna.fdx"])
def test_bundled_example_scripts_parse_end_to_end(filename):
    """The example screenplays shipped with the demo UI must always parse
    into the same six scenes, whichever format is uploaded."""

    path = EXAMPLES_DIR / filename
    response = client.post("/upload-script", files={"file": (filename, path.read_bytes())})

    assert response.status_code == 200
    scenes = response.json()
    assert len(scenes) == 6
    assert scenes[2]["location"] == "ASEMARAVINTOLA"
    assert scenes[3]["cast_members"] == ["Konduktööri", "Juho"]
    assert scenes[4]["int_ext"] == "INT/EXT"


def test_unexpected_internal_error_returns_json_detail(monkeypatch):
    """A genuinely unexpected bug (not a user-input mistake) should still
    come back as {"detail": ...} JSON, not a bare-text 500, so the frontend
    doesn't need a special case for "the server broke in some new way"."""

    def boom(text):
        raise RuntimeError("unexpected bug")

    monkeypatch.setattr("routers.scripts.parse_screenplay", boom)

    no_raise_client = TestClient(main.app, raise_server_exceptions=False)
    response = no_raise_client.post("/parse-script", json={"script_text": "INT. X - Y"})

    assert response.status_code == 500
    assert "detail" in response.json()
