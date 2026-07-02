import pytest
from app.core.security import get_password_hash
from app.models.user import User

@pytest.mark.asyncio
async def test_login_flow(client, db):
    # Create test user
    user = User(
        email="test_user@example.com",
        hashed_password=get_password_hash("TestPassword123"),
        full_name="Test User",
        role="staff",
        is_active=True
    )
    db.add(user)
    await db.commit()
    
    # Login request
    response = await client.post(
        "/auth/login",
        json={"email": "test_user@example.com", "password": "TestPassword123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "test_user@example.com"
    
    # Authenticated me query
    token = data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    me_response = await client.get("/auth/me", headers=headers)
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "test_user@example.com"

@pytest.mark.asyncio
async def test_register_flow(client, db):
    # Register new user
    register_payload = {
        "email": "register_test@example.com",
        "password": "RegisterPassword123",
        "full_name": "Register Test",
        "role": "staff"
    }
    response = await client.post("/auth/register", json=register_payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "register_test@example.com"
    assert data["user"]["role"] == "staff"

    # Try duplicate registration
    dup_response = await client.post("/auth/register", json=register_payload)
    assert dup_response.status_code == 400
    assert dup_response.json()["detail"] == "Email already registered"

    # Verify newly registered token allows accessing /auth/me
    token = data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    me_response = await client.get("/auth/me", headers=headers)
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "register_test@example.com"
