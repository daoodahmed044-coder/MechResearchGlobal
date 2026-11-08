from pathlib import Path
import sys

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import main

client = TestClient(main.app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_search_validation_rejects_too_short_query():
    response = client.get("/api/universities", params={"query": "x"})
    assert response.status_code == 422
