import json
import uuid
import asyncio
from datetime import datetime as dt, timezone
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from backend.app.database import get_db
from backend.app.routers.auth import get_current_user
from backend.app.services.mentor import build_mentor_prompt, get_llm_provider, calculate_expression

mentor_router = APIRouter(prefix="/mentor", tags=["AI Study Mentor"])

# ----------------- SCHEMAS -----------------

class ConversationCreate(BaseModel):
    title: Optional[str] = "Study Session"

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    topic: Optional[str] = None
    conversation_id: Optional[str] = None

# ----------------- GREETING -----------------

@mentor_router.get("/greeting")
def get_mentor_greeting(user: dict = Depends(get_current_user)):
    user_id = user["id"]
    first_name = (user["name"] or "Student").split()[0]

    with get_db() as conn:
        topics = conn.execute("SELECT title, status FROM user_topics WHERE user_id = ?", (user_id,)).fetchall()
        goals = conn.execute("SELECT title FROM user_goals WHERE user_id = ? ORDER BY created_at DESC LIMIT 1", (user_id,)).fetchone()

        if not topics:
            return {
                "greeting": f"Hi {first_name}! Welcome to Mindora. Take your first diagnostic quiz to build your personalized learning roadmap.",
                "has_data": False,
                "suggested_action": "start_diagnostic",
                "active_topic": None,
            }

        weak = [t["title"] for t in topics if t["status"] == "weak"]
        in_progress = [t["title"] for t in topics if t["status"] == "inProgress"]

        if weak:
            return {
                "greeting": f"Hi {first_name}! Ready to tackle {weak[0]} today? We can break it down step-by-step together.",
                "has_data": True,
                "suggested_action": "review_weak_topic",
                "active_topic": weak[0],
            }
        elif in_progress:
            return {
                "greeting": f"Hi {first_name}! Great to see your consistency. Want to pick up where you left off on {in_progress[0]}?",
                "has_data": True,
                "suggested_action": "continue_topic",
                "active_topic": in_progress[0],
            }
        else:
            goal_title = goals["title"] if goals else "your studies"
            return {
                "greeting": f"Hi {first_name}! You're making solid progress on {goal_title}. What would you like to explore today?",
                "has_data": True,
                "suggested_action": "general_inquiry",
                "active_topic": None,
            }

# ----------------- CONVERSATION MANAGEMENT -----------------

@mentor_router.get("/conversations")
def list_conversations(user: dict = Depends(get_current_user)):
    user_id = user["id"]
    with get_db() as conn:
        rows = conn.execute(
            "SELECT id, title, created_at, updated_at FROM ai_conversations WHERE user_id = ? ORDER BY updated_at DESC",
            (user_id,)
        ).fetchall()
        return {"conversations": [dict(r) for r in rows]}

@mentor_router.post("/conversations", status_code=status.HTTP_201_CREATED)
def create_conversation(req: ConversationCreate, user: dict = Depends(get_current_user)):
    user_id = user["id"]
    conv_id = "conv_" + uuid.uuid4().hex[:12]
    now_str = dt.now(timezone.utc).isoformat()
    title = (req.title or "Study Session").strip()

    with get_db() as conn:
        conn.execute(
            "INSERT INTO ai_conversations (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            (conv_id, user_id, title, now_str, now_str)
        )
        saved = conn.execute("SELECT * FROM ai_conversations WHERE id = ?", (conv_id,)).fetchone()
        return {"conversation": dict(saved)}

@mentor_router.get("/conversations/{conv_id}")
def get_conversation_history(conv_id: str, user: dict = Depends(get_current_user)):
    user_id = user["id"]
    with get_db() as conn:
        conv = conn.execute(
            "SELECT * FROM ai_conversations WHERE id = ? AND user_id = ?",
            (conv_id, user_id)
        ).fetchone()
        if not conv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

        rows = conn.execute(
            "SELECT id, role, content, sources, created_at FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC",
            (conv_id,)
        ).fetchall()

        messages = []
        for r in rows:
            m = dict(r)
            if m.get("sources"):
                try:
                    m["sources"] = json.loads(m["sources"])
                except Exception:
                    m["sources"] = [m["sources"]]
            else:
                m["sources"] = []
            messages.append(m)

        return {
            "conversation": dict(conv),
            "messages": messages,
        }

@mentor_router.delete("/conversations/{conv_id}")
def delete_conversation(conv_id: str, user: dict = Depends(get_current_user)):
    user_id = user["id"]
    with get_db() as conn:
        res = conn.execute("DELETE FROM ai_conversations WHERE id = ? AND user_id = ?", (conv_id, user_id))
        if res.rowcount == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
        return {"success": True, "message": "Conversation removed"}

# ----------------- STREAMING CHAT ENDPOINT -----------------

@mentor_router.post("/chat")
async def chat_with_mentor(req: ChatRequest, user: dict = Depends(get_current_user)):
    user_id = user["id"]
    now_str = dt.now(timezone.utc).isoformat()
    conv_id = req.conversation_id

    # 1. Establish or verify conversation
    with get_db() as conn:
        if conv_id:
            existing = conn.execute(
                "SELECT id FROM ai_conversations WHERE id = ? AND user_id = ?",
                (conv_id, user_id)
            ).fetchone()
            if not existing:
                conv_id = None

        if not conv_id:
            conv_id = "conv_" + uuid.uuid4().hex[:12]
            title = req.message[:35] + ("..." if len(req.message) > 35 else "")
            conn.execute(
                "INSERT INTO ai_conversations (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
                (conv_id, user_id, title, now_str, now_str)
            )

        # Record user message
        user_msg_id = "msg_" + uuid.uuid4().hex[:12]
        conn.execute(
            "INSERT INTO ai_messages (id, conversation_id, role, content, sources, created_at) VALUES (?, ?, 'user', ?, NULL, ?)",
            (user_msg_id, conv_id, req.message, now_str)
        )

        # Fetch recent messages for context
        history_rows = conn.execute(
            "SELECT role, content FROM ai_messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 8",
            (conv_id,)
        ).fetchall()
        chat_history = [{"role": r["role"], "content": r["content"]} for r in reversed(history_rows)]

        # Fetch student context
        topics = conn.execute("SELECT title, status FROM user_topics WHERE user_id = ?", (user_id,)).fetchall()
        weak_topics = [t["title"] for t in topics if t["status"] == "weak"]
        unassessed_topics = [t["title"] for t in topics if t["status"] == "unassessed"]

        goal = conn.execute("SELECT title, deadline FROM user_goals WHERE user_id = ? ORDER BY created_at DESC LIMIT 1", (user_id,)).fetchone()
        docs = conn.execute("SELECT filename, summary FROM pdf_documents WHERE user_id = ? ORDER BY created_at DESC LIMIT 2", (user_id,)).fetchall()

    student_data = {
        "name": user["name"],
        "educational_level": user.get("educational_level") or "College",
        "target_exam": user.get("target_exam") or "GATE / University Exam",
        "weak_topics": weak_topics,
        "unassessed_topics": unassessed_topics,
        "goal_title": goal["title"] if goal else "Engineering Foundations",
        "goal_deadline": goal["deadline"] if goal else "2026 Academic Term",
    }

    retrieved_notes = ""
    sources_used = []
    if docs:
        snippets = []
        for d in docs:
            snippets.append(f"• {d['filename']}: {d['summary']}")
            sources_used.append({"filename": d["filename"], "source": "User Uploaded Notes"})
        retrieved_notes = "\n".join(snippets)
    else:
        retrieved_notes = "None uploaded yet"

    # Build prompt
    active_topic = req.topic or (weak_topics[0] if weak_topics else "Engineering Core")
    system_prompt = build_mentor_prompt(
        student_data=student_data,
        active_topic=active_topic,
        retrieved_notes=retrieved_notes
    )

    provider = get_llm_provider()

    async def event_generator():
        # Emit initial start event with conversation ID
        yield f"data: {json.dumps({'type': 'start', 'conversation_id': conv_id})}\n\n"

        full_reply_chunks = []
        try:
            async for token in provider.stream_chat(chat_history, system_prompt):
                full_reply_chunks.append(token)
                yield f"data: {json.dumps({'type': 'token', 'token': token})}\n\n"
        except asyncio.CancelledError:
            # Client aborted or disconnected
            pass
        except Exception as e:
            import logging
            logging.error(f"[AI Mentor Provider Error] {e}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'error_type': 'provider_error', 'message': 'My AI service had a problem. Your message is saved, try again.'})}\n\n"
            return
        finally:
            full_reply = "".join(full_reply_chunks)
            if full_reply.strip():
                # Persist assistant response
                assistant_msg_id = "msg_" + uuid.uuid4().hex[:12]
                sources_to_save = sources_used if ("notes" in req.message.lower() or "summary" in req.message.lower()) else []
                sources_json = json.dumps(sources_to_save) if sources_to_save else None
                finished_at = dt.now(timezone.utc).isoformat()

                with get_db() as conn:
                    conn.execute(
                        "INSERT INTO ai_messages (id, conversation_id, role, content, sources, created_at) VALUES (?, ?, 'assistant', ?, ?, ?)",
                        (assistant_msg_id, conv_id, full_reply, sources_json, finished_at)
                    )
                    conn.execute(
                        "UPDATE ai_conversations SET updated_at = ? WHERE id = ?",
                        (finished_at, conv_id)
                    )

                yield f"data: {json.dumps({'type': 'done', 'conversation_id': conv_id, 'sources': sources_to_save})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )

