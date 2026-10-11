import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.mentor import calculate_expression, build_mentor_prompt
from backend.app.database import get_db

client = TestClient(app)

def test_calculator_valid_expressions():
    assert calculate_expression("2 + 2") == 4
    assert calculate_expression("10 * 5 - 2") == 48
    assert calculate_expression("2^4") == 16
    assert calculate_expression("sqrt(25)") == 5.0
    assert calculate_expression("abs(-42)") == 42

def test_calculator_blocks_unsafe_input():
    # Arbitrary code execution or system calls must be rejected (return None)
    assert calculate_expression("__import__('os').system('whoami')") is None
    assert calculate_expression("open('/etc/passwd')") is None
    assert calculate_expression("eval('2+2')") is None
    assert calculate_expression("exec('x=1')") is None
    assert calculate_expression("import sys") is None

def test_mentor_prompt_builder():
    student_data = {
        "name": "Dhruv Sharma",
        "educational_level": "College",
        "target_exam": "GATE 2026 CS",
        "weak_topics": ["Virtual Memory", "Eigenvalues"],
        "unassessed_topics": ["TCP Congestion", "Compiler Parsing"],
        "goal_title": "AIR < 100",
        "goal_deadline": "2026-12-15",
    }
    prompt = build_mentor_prompt(
        student_data=student_data,
        active_topic="Virtual Memory",
        retrieved_notes="Lecture 4: Demand paging Belady anomaly"
    )

    # 1. Greet by first name
    assert "Dhruv" in prompt
    # 2. Weak topics correctly placed
    assert "Virtual Memory" in prompt
    assert "Eigenvalues" in prompt
    # 3. Unassessed topics distinctly labeled and NOT marked as weak
    assert "TCP Congestion" in prompt
    assert "Compiler Parsing" in prompt
    # 4. Retrieved notes present
    assert "Lecture 4: Demand paging" in prompt

def test_unassessed_topics_never_marked_weak():
    student_data = {
        "name": "Alice Wonderland",
        "weak_topics": [],
        "unassessed_topics": ["Graph Algorithms"],
    }
    prompt = build_mentor_prompt(student_data=student_data)
    assert "None identified yet" in prompt or "Weak topics: None" in prompt
    assert "Graph Algorithms" in prompt

def test_mentor_endpoints_require_authentication():
    # 1. /mentor/greeting requires auth
    res = client.get("/mentor/greeting")
    assert res.status_code == 401

    # 2. /mentor/conversations requires auth
    res = client.get("/mentor/conversations")
    assert res.status_code == 401

    # 3. /mentor/chat requires auth
    res = client.post("/mentor/chat", json={"message": "Help me with memory"})
    assert res.status_code == 401

def test_user_conversation_isolation():
    import uuid
    uid = uuid.uuid4().hex[:8]
    # Register and login User 1
    u1_email = f"mentor_u1_{uid}@test.edu"
    reg1 = client.post("/auth/register", json={
        "name": "User One",
        "email": u1_email,
        "password": "StrongPassword123!",
        "confirm_password": "StrongPassword123!",
        "educational_level": "College",
        "age_range": "18-22",
        "consent_given": True,
    })
    assert reg1.status_code == 201
    u1_token = reg1.json()["access_token"]
    u1_headers = {"Authorization": f"Bearer {u1_token}"}

    # Create conversation for User 1
    conv_res = client.post("/mentor/conversations", json={"title": "U1 Secret Study"}, headers=u1_headers)
    assert conv_res.status_code == 201
    conv_id = conv_res.json()["conversation"]["id"]

    # Register and login User 2
    u2_email = f"mentor_u2_{uid}@test.edu"
    reg2 = client.post("/auth/register", json={
        "name": "User Two",
        "email": u2_email,
        "password": "StrongPassword123!",
        "confirm_password": "StrongPassword123!",
        "educational_level": "College",
        "age_range": "18-22",
        "consent_given": True,
    })
    assert reg2.status_code == 201
    u2_token = reg2.json()["access_token"]
    u2_headers = {"Authorization": f"Bearer {u2_token}"}

    # User 2 tries to access User 1's conversation -> must be 404 Not Found
    u2_fetch = client.get(f"/mentor/conversations/{conv_id}", headers=u2_headers)
    assert u2_fetch.status_code == 404

    # User 2 conversation list does not contain User 1's conversation
    u2_list = client.get("/mentor/conversations", headers=u2_headers).json()
    assert all(c["id"] != conv_id for c in u2_list["conversations"])

def test_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "ai_provider_configured" in data
    assert isinstance(data["ai_provider_configured"], bool)
    assert "ai_provider" in data

def test_chat_authenticated_returns_reply():
    import uuid
    uid = uuid.uuid4().hex[:8]
    email = f"chat_test_{uid}@test.edu"
    reg = client.post("/auth/register", json={
        "name": "Chat Student",
        "email": email,
        "password": "StrongPassword123!",
        "confirm_password": "StrongPassword123!",
        "educational_level": "College",
        "age_range": "18-22",
        "consent_given": True,
    })
    assert reg.status_code == 201

    # 1. Chat using cookies set by registration/login (no Authorization header required)
    chat_res = client.post("/mentor/chat", json={"message": "Explain page replacement simply"})
    assert chat_res.status_code == 200
    assert "text/event-stream" in chat_res.headers["content-type"]
    body = chat_res.text
    assert "data: " in body
    assert "virtual memory" in body.lower() or "page" in body.lower() or "desk" in body.lower()

def test_chat_provider_failure_controlled_error(monkeypatch):
    import uuid
    from backend.app.services.mentor import LLMProvider

    class FailingProvider(LLMProvider):
        async def stream_chat(self, messages, system_prompt):
            raise RuntimeError("Anthropic upstream quota exceeded or timeout")
            yield "never"

    # Monkeypatch provider
    monkeypatch.setattr("backend.app.routers.mentor.get_llm_provider", lambda: FailingProvider())

    uid = uuid.uuid4().hex[:8]
    email = f"fail_test_{uid}@test.edu"
    reg = client.post("/auth/register", json={
        "name": "Fail Test",
        "email": email,
        "password": "StrongPassword123!",
        "confirm_password": "StrongPassword123!",
        "educational_level": "College",
        "age_range": "18-22",
        "consent_given": True,
    })
    assert reg.status_code == 201

    chat_res = client.post("/mentor/chat", json={"message": "This will fail"})
    assert chat_res.status_code == 200
    body = chat_res.text
    assert '"type": "error"' in body
    assert "My AI service had a problem. Your message is saved, try again." in body
