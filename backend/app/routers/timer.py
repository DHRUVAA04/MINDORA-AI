import uuid
import datetime
from datetime import datetime as dt, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from backend.app.database import get_db
from backend.app.routers.auth import get_current_user

timer_router = APIRouter(prefix="/api/timer", tags=["Timer & Focus Sessions"])

class SaveSessionRequest(BaseModel):
    activity_id: Optional[str] = None
    activity_title: Optional[str] = None
    mode: str = Field("pomodoro", description="Timer mode e.g. pomodoro, custom, stopwatch")
    planned_seconds: int = 1500
    actual_seconds: int = 1500
    started_at: str
    ended_at: str
    completed: int = 1
    notes: Optional[str] = None

@timer_router.post("/sessions", status_code=status.HTTP_201_CREATED)
def save_focus_session(req: SaveSessionRequest, user: dict = Depends(get_current_user)):
    user_id = user["id"]
    session_id = "session_" + uuid.uuid4().hex[:12]
    now_str = dt.now(timezone.utc).isoformat()

    with get_db() as conn:
        conn.execute("""
            INSERT INTO focus_sessions (
                id, user_id, activity_id, activity_title, mode,
                planned_seconds, actual_seconds, started_at, ended_at,
                completed, notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            session_id,
            user_id,
            req.activity_id,
            req.activity_title,
            req.mode,
            req.planned_seconds,
            req.actual_seconds,
            req.started_at,
            req.ended_at,
            req.completed,
            req.notes,
            now_str,
        ))

        saved = conn.execute("SELECT * FROM focus_sessions WHERE id = ?", (session_id,)).fetchone()
        return {
            "success": True,
            "message": "Focus session recorded successfully. Self-timed study time saved.",
            "session": dict(saved),
        }

@timer_router.get("/sessions")
def list_focus_sessions(user: dict = Depends(get_current_user)):
    user_id = user["id"]
    with get_db() as conn:
        rows = conn.execute("""
            SELECT * FROM focus_sessions 
            WHERE user_id = ? 
            ORDER BY started_at DESC 
            LIMIT 50
        """, (user_id,)).fetchall()
        return {"sessions": [dict(r) for r in rows]}

@timer_router.get("/stats")
def get_timer_stats(user: dict = Depends(get_current_user)):
    user_id = user["id"]
    now = dt.now(timezone.utc)
    start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    seven_days_ago = (now - timedelta(days=7)).isoformat()

    with get_db() as conn:
        today_row = conn.execute("""
            SELECT SUM(actual_seconds) as total_seconds, COUNT(*) as count 
            FROM focus_sessions 
            WHERE user_id = ? AND started_at >= ?
        """, (user_id, start_of_today)).fetchone()

        weekly_row = conn.execute("""
            SELECT SUM(actual_seconds) as total_seconds, COUNT(*) as count 
            FROM focus_sessions 
            WHERE user_id = ? AND started_at >= ?
        """, (user_id, seven_days_ago)).fetchone()

        recent = conn.execute("""
            SELECT * FROM focus_sessions 
            WHERE user_id = ? 
            ORDER BY started_at DESC 
            LIMIT 10
        """, (user_id,)).fetchall()

        today_sec = today_row["total_seconds"] or 0
        weekly_sec = weekly_row["total_seconds"] or 0

        return {
            "stats": {
                "todayMinutes": round(today_sec / 60),
                "todaySeconds": today_sec,
                "weeklyTotalMinutes": round(weekly_sec / 60),
                "sessionsCount": today_row["count"] or 0,
            },
            "history": [dict(r) for r in recent],
        }

@timer_router.get("/activities")
def get_activities(user: dict = Depends(get_current_user)):
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM learning_activities ORDER BY title ASC").fetchall()
        return {"activities": [dict(r) for r in rows]}

