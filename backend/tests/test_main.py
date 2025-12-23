from fastapi.testclient import TestClient
import pytest
from main import app

@pytest.fixture
def client():
    return TestClient(app)

def test_read_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "I am awake!", "service": "Kemii API"}
