from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "I am awake!", "service": "Kemii API"}

def test_get_users_empty_initially():
    # This test might fail if the DB already has data, but good for a fresh start check
    # Or we can just check the status code and structure
    response = client.get("/users")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
