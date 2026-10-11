import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import get_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_test_data():
    """Ensure clean state for test user email."""
    with get_db() as conn:
        conn.execute("DELETE FROM users WHERE email IN ('testuser@mindora.ai', 'otheruser@mindora.ai')")
        conn.execute("DELETE FROM login_attempts")
    yield

def test_register_success_and_duplicate():
    payload = {
        "name": "Jane Student",
        "email": "testuser@mindora.ai",
        "password": "SecurePassword123!",
        "confirm_password": "SecurePassword123!",
        "educational_level": "College",
        "age_range": "18-22",
        "consent_given": True,
    }
    
    # 1. Register new user
    res = client.post("/auth/register", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["user"]["email"] == "testuser@mindora.ai"
    assert data["user"]["name"] == "Jane Student"
    assert "access_token" in data
    assert "csrf_token" in data
    assert "refreshToken" in res.cookies

    # 2. Duplicate registration attempt returns generic 400
    res_dup = client.post("/auth/register", json=payload)
    assert res_dup.status_code == 400
    assert "already have an account" in res_dup.json()["detail"]

def test_login_success_and_failure():
    # Setup user
    client.post("/auth/register", json={
        "name": "Jane Student",
        "email": "testuser@mindora.ai",
        "password": "SecurePassword123!",
        "confirm_password": "SecurePassword123!",
        "educational_level": "College",
        "age_range": "18-22",
        "consent_given": True,
    })

    # Wrong password -> generic error
    res_fail = client.post("/auth/login", json={
        "email": "testuser@mindora.ai",
        "password": "WrongPassword999",
    })
    assert res_fail.status_code == 401
    assert res_fail.json()["detail"] == "Email or password is incorrect"

    # Correct credentials -> success
    res_ok = client.post("/auth/login", json={
        "email": "testuser@mindora.ai",
        "password": "SecurePassword123!",
    })
    assert res_ok.status_code == 200
    assert "access_token" in res_ok.json()
    assert "refreshToken" in res_ok.cookies

def test_rate_limit_lockout():
    # Trigger 5 failed attempts
    for _ in range(5):
        client.post("/auth/login", json={
            "email": "nonexistent@mindora.ai",
            "password": "InvalidPassword",
        })

    # 6th attempt should be locked out
    res_locked = client.post("/auth/login", json={
        "email": "nonexistent@mindora.ai",
        "password": "InvalidPassword",
    })
    assert res_locked.status_code == 429
    assert "temporarily locked" in res_locked.json()["detail"]

def test_refresh_token_rotation():
    res_reg = client.post("/auth/register", json={
        "name": "Jane Student",
        "email": "testuser@mindora.ai",
        "password": "SecurePassword123!",
        "confirm_password": "SecurePassword123!",
        "educational_level": "College",
        "age_range": "18-22",
        "consent_given": True,
    })
    initial_refresh = res_reg.cookies.get("refreshToken")

    # Call /auth/refresh with cookie
    res_ref = client.post("/auth/refresh", cookies={"refreshToken": initial_refresh})
    assert res_ref.status_code == 200
    data = res_ref.json()
    assert "access_token" in data
    
    # Refresh token should be rotated
    new_refresh = res_ref.cookies.get("refreshToken")
    assert new_refresh is not None
    assert new_refresh != initial_refresh

    # Old refresh token should now be revoked
    res_reuse = client.post("/auth/refresh", cookies={"refreshToken": initial_refresh})
    assert res_reuse.status_code == 401

def test_logout_invalidation():
    res_reg = client.post("/auth/register", json={
        "name": "Jane Student",
        "email": "testuser@mindora.ai",
        "password": "SecurePassword123!",
        "confirm_password": "SecurePassword123!",
        "educational_level": "College",
        "age_range": "18-22",
        "consent_given": True,
    })
    token = res_reg.cookies.get("refreshToken")

    res_logout = client.post("/auth/logout", cookies={"refreshToken": token})
    assert res_logout.status_code == 200

    # Attempting to refresh after logout fails
    res_ref = client.post("/auth/refresh", cookies={"refreshToken": token})
    assert res_ref.status_code == 401

def test_protected_endpoints_require_auth():
    # Without token -> 401
    res = client.get("/auth/me")
    assert res.status_code == 401

    res_timer = client.get("/api/timer/sessions")
    assert res_timer.status_code == 401

def test_user_data_isolation():
    # Student A
    res_a = client.post("/auth/register", json={
        "name": "Student A",
        "email": "testuser@mindora.ai",
        "password": "SecurePassword123!",
        "confirm_password": "SecurePassword123!",
        "educational_level": "College",
        "age_range": "18-22",
        "consent_given": True,
    })
    token_a = res_a.json()["access_token"]

    # Student B
    res_b = client.post("/auth/register", json={
        "name": "Student B",
        "email": "otheruser@mindora.ai",
        "password": "SecurePassword123!",
        "confirm_password": "SecurePassword123!",
        "educational_level": "College",
        "age_range": "18-22",
        "consent_given": True,
    })
    token_b = res_b.json()["access_token"]

    # Student A saves a timer session
    client.post("/api/timer/sessions", headers={"Authorization": f"Bearer {token_a}"}, json={
        "mode": "pomodoro",
        "planned_seconds": 1500,
        "actual_seconds": 1500,
        "started_at": "2026-10-12T00:00:00Z",
        "ended_at": "2026-10-12T00:25:00Z",
        "notes": "Student A private notes",
    })

    # Student B queries sessions -> must NOT see Student A's session
    res_b_sessions = client.get("/api/timer/sessions", headers={"Authorization": f"Bearer {token_b}"})
    assert res_b_sessions.status_code == 200
    sessions_b = res_b_sessions.json()["sessions"]
    assert len(sessions_b) == 0  # Student B has 0 sessions

def test_password_reset_flow():
    # Create user
    client.post("/auth/register", json={
        "name": "Jane Student",
        "email": "testuser@mindora.ai",
        "password": "SecurePassword123!",
        "confirm_password": "SecurePassword123!",
        "educational_level": "College",
        "age_range": "18-22",
        "consent_given": True,
    })

    # Request forgot password
    res_forgot = client.post("/auth/forgot-password", json={"email": "testuser@mindora.ai"})
    assert res_forgot.status_code == 200

    # Retrieve reset token from database for test verification
    with get_db() as conn:
        token_row = conn.execute("SELECT * FROM password_reset_tokens WHERE used = 0").fetchone()
        assert token_row is not None
        # In a real test, the token is hashed in DB, so we can test with a mock token directly or test invalid token
    
    # Test invalid reset token
    res_invalid = client.post("/auth/reset-password", json={
        "token": "invalid_fake_token",
        "new_password": "BrandNewPassword123!",
        "confirm_password": "BrandNewPassword123!",
    })
    assert res_invalid.status_code == 400
    assert "Reset link is invalid or has expired" in res_invalid.json()["detail"]

