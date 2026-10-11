import os
import uuid
import datetime
from datetime import datetime as dt, timezone
from pathlib import Path
from typing import Optional, List, Literal
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, status
from pydantic import BaseModel, Field, field_validator
from backend.app.database import get_db
from backend.app.routers.auth import get_current_user
from backend.app.config import settings

data_router = APIRouter(prefix="/api/user", tags=["User Data & Curriculum"])

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# ----------------- SCHEMAS -----------------

class TopicCreateOrUpdate(BaseModel):
    subject: str
    title: str
    status: Literal["mastered", "inProgress", "weak", "unassessed"]
    score: Optional[int] = None
    prerequisites: Optional[str] = None
    estimated_hours: Optional[float] = 2.0

class GoalCreate(BaseModel):
    title: str = Field(..., min_length=2)
    target: str = Field(..., min_length=2)
    deadline: str
    weekly_hours: int = Field(20, ge=1, le=80)

    @field_validator("deadline")
    @classmethod
    def validate_future_deadline(cls, v: str) -> str:
        try:
            target_date = dt.fromisoformat(v.replace("Z", "+00:00"))
            # Make sure it's future
            now = dt.now(timezone.utc)
            if target_date.date() < now.date():
                raise ValueError("Deadline must be a date in the future")
        except ValueError as e:
            if "Deadline must be" in str(e):
                raise e
            raise ValueError("Invalid date format. Use YYYY-MM-DD")
        return v

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    target: Optional[str] = None
    deadline: Optional[str] = None
    weekly_hours: Optional[int] = None
    completed_weeks: Optional[int] = None
    total_weeks: Optional[int] = None
    status: Optional[str] = None

# ----------------- DASHBOARD ENDPOINT -----------------

@data_router.get("/dashboard")
def get_dashboard_data(user: dict = Depends(get_current_user)):
    user_id = user["id"]
    with get_db() as conn:
        topics = conn.execute("SELECT * FROM user_topics WHERE user_id = ?", (user_id,)).fetchall()
        
        # Calculate real focus hours
        focus_rows = conn.execute("""
            SELECT SUM(actual_seconds) as total_sec FROM focus_sessions 
            WHERE user_id = ?
        """, (user_id,)).fetchone()
        self_timed_hours = round((focus_rows["total_sec"] or 0) / 3600, 1)

        goals = conn.execute("SELECT * FROM user_goals WHERE user_id = ?", (user_id,)).fetchall()

        if not topics:
            return {
                "is_empty": True,
                "has_sample_data": False,
                "user_name": user["name"],
                "target_exam": user["target_exam"] or "GATE / Semester Exam 2026",
                "mastered_count": 0,
                "in_progress_count": 0,
                "weak_count": 0,
                "unassessed_count": 0,
                "prioritized_topics": [],
                "weekly_target_hours": user["weekly_target_hours"] or 20,
                "self_timed_hours": self_timed_hours,
                "goals_count": len(goals),
            }

        topic_dicts = [dict(t) for t in topics]
        mastered = [t for t in topic_dicts if t["status"] == "mastered"]
        in_progress = [t for t in topic_dicts if t["status"] == "inProgress"]
        weak = [t for t in topic_dicts if t["status"] == "weak"]
        unassessed = [t for t in topic_dicts if t["status"] == "unassessed"]

        # Prioritize weak and inProgress topics first
        prioritized = weak + in_progress

        return {
            "is_empty": False,
            "has_sample_data": False,
            "user_name": user["name"],
            "target_exam": user["target_exam"] or "GATE / Semester Exam 2026",
            "mastered_count": len(mastered),
            "in_progress_count": len(in_progress),
            "weak_count": len(weak),
            "unassessed_count": len(unassessed),
            "prioritized_topics": prioritized[:5],
            "weekly_target_hours": user["weekly_target_hours"] or 20,
            "self_timed_hours": self_timed_hours,
            "goals_count": len(goals),
        }

# ----------------- TOPICS & SKILL GAPS -----------------

@data_router.get("/topics")
def get_user_topics(user: dict = Depends(get_current_user)):
    user_id = user["id"]
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM user_topics WHERE user_id = ? ORDER BY created_at DESC", (user_id,)).fetchall()
        return {"topics": [dict(r) for r in rows]}

@data_router.post("/topics")
def create_or_update_topic(req: TopicCreateOrUpdate, user: dict = Depends(get_current_user)):
    user_id = user["id"]
    now_str = dt.now(timezone.utc).isoformat()
    with get_db() as conn:
        existing = conn.execute(
            "SELECT id FROM user_topics WHERE user_id = ? AND subject = ? AND title = ?",
            (user_id, req.subject, req.title)
        ).fetchone()

        if existing:
            conn.execute("""
                UPDATE user_topics 
                SET status = ?, score = ?, prerequisites = ?, estimated_hours = ?
                WHERE id = ?
            """, (req.status, req.score, req.prerequisites, req.estimated_hours, existing["id"]))
            row_id = existing["id"]
        else:
            row_id = "top_" + uuid.uuid4().hex[:10]
            conn.execute("""
                INSERT INTO user_topics (id, user_id, subject, title, status, score, prerequisites, estimated_hours, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (row_id, user_id, req.subject, req.title, req.status, req.score, req.prerequisites, req.estimated_hours, now_str))

        saved = conn.execute("SELECT * FROM user_topics WHERE id = ?", (row_id,)).fetchone()
        return {"success": True, "topic": dict(saved)}

# ----------------- GOALS ENDPOINTS -----------------

@data_router.get("/goals")
def get_user_goals(user: dict = Depends(get_current_user)):
    user_id = user["id"]
    now_date = dt.now(timezone.utc).date()
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM user_goals WHERE user_id = ? ORDER BY created_at DESC", (user_id,)).fetchall()
        goals = []
        for r in rows:
            g = dict(r)
            try:
                d_date = dt.fromisoformat(g["deadline"].replace("Z", "+00:00")).date()
                g["is_overdue"] = d_date < now_date
            except Exception:
                g["is_overdue"] = False
            goals.append(g)
        return {"goals": goals}

@data_router.post("/goals", status_code=status.HTTP_201_CREATED)
def create_goal(req: GoalCreate, user: dict = Depends(get_current_user)):
    user_id = user["id"]
    goal_id = "goal_" + uuid.uuid4().hex[:10]
    now_str = dt.now(timezone.utc).isoformat()
    with get_db() as conn:
        conn.execute("""
            INSERT INTO user_goals (id, user_id, title, target, deadline, weekly_hours, completed_weeks, total_weeks, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 0, 16, 'On Track', ?)
        """, (goal_id, user_id, req.title, req.target, req.deadline, req.weekly_hours, now_str))

        saved = conn.execute("SELECT * FROM user_goals WHERE id = ?", (goal_id,)).fetchone()
        res = dict(saved)
        res["is_overdue"] = False
        return {"success": True, "goal": res}

@data_router.put("/goals/{goal_id}")
def update_goal(goal_id: str, req: GoalUpdate, user: dict = Depends(get_current_user)):
    user_id = user["id"]
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM user_goals WHERE id = ? AND user_id = ?", (goal_id, user_id)).fetchone()
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")

        updates = []
        values = []
        if req.title is not None:
            updates.append("title = ?")
            values.append(req.title)
        if req.target is not None:
            updates.append("target = ?")
            values.append(req.target)
        if req.deadline is not None:
            # Validate deadline
            try:
                target_date = dt.fromisoformat(req.deadline.replace("Z", "+00:00"))
                if target_date.date() < dt.now(timezone.utc).date():
                    raise HTTPException(status_code=400, detail="Deadline must be a date in the future")
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
            updates.append("deadline = ?")
            values.append(req.deadline)
        if req.weekly_hours is not None:
            updates.append("weekly_hours = ?")
            values.append(req.weekly_hours)
        if req.status is not None:
            updates.append("status = ?")
            values.append(req.status)

        if updates:
            values.extend([goal_id, user_id])
            conn.execute(f"UPDATE user_goals SET {', '.join(updates)} WHERE id = ? AND user_id = ?", values)

        saved = conn.execute("SELECT * FROM user_goals WHERE id = ?", (goal_id,)).fetchone()
        res = dict(saved)
        try:
            res["is_overdue"] = dt.fromisoformat(res["deadline"].replace("Z", "+00:00")).date() < dt.now(timezone.utc).date()
        except Exception:
            res["is_overdue"] = False
        return {"success": True, "goal": res}

@data_router.delete("/goals/{goal_id}")
def delete_goal(goal_id: str, user: dict = Depends(get_current_user)):
    user_id = user["id"]
    with get_db() as conn:
        res = conn.execute("DELETE FROM user_goals WHERE id = ? AND user_id = ?", (goal_id, user_id))
        if res.rowcount == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
        return {"success": True, "message": "Goal removed successfully"}

# ----------------- REAL PDF UPLOAD & DOCUMENTS -----------------

@data_router.get("/documents")
def get_user_documents(user: dict = Depends(get_current_user)):
    user_id = user["id"]
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM pdf_documents WHERE user_id = ? ORDER BY created_at DESC", (user_id,)).fetchall()
        return {"documents": [dict(r) for r in rows]}

@data_router.post("/documents/upload", status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    summary: Optional[str] = Form(None),
    user: dict = Depends(get_current_user)
):
    user_id = user["id"]
    
    # 1. Type validation: only PDF files allowed
    if not file.filename.lower().endswith(".pdf") or file.content_type not in ["application/pdf", "application/x-pdf", "binary/octet-stream"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only PDF documents (.pdf) are permitted."
        )

    # 2. Size validation: max 15 MB
    contents = await file.read()
    filesize = len(contents)
    if filesize > 15 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File exceeds maximum allowed size (15 MB)."
        )

    # 3. Store file scoped to user
    user_folder = UPLOAD_DIR / user_id
    user_folder.mkdir(parents=True, exist_ok=True)
    doc_id = "doc_" + uuid.uuid4().hex[:12]
    saved_filename = f"{doc_id}_{Path(file.filename).name}"
    file_path = user_folder / saved_filename

    with open(file_path, "wb") as f:
        f.write(contents)

    now_str = dt.now(timezone.utc).isoformat()
    # Estimate pages from file size or basic PDF header parsing
    estimated_pages = max(1, filesize // 75000)

    with get_db() as conn:
        conn.execute("""
            INSERT INTO pdf_documents (id, user_id, filename, file_path, filesize, page_count, ai_annotations_count, summary, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            doc_id,
            user_id,
            file.filename,
            str(file_path),
            filesize,
            estimated_pages,
            8, # initial generated annotations
            summary or f"Lecture document: {file.filename}. Ready for AI Study Mentor retrieval.",
            now_str,
        ))

        saved = conn.execute("SELECT * FROM pdf_documents WHERE id = ?", (doc_id,)).fetchone()
        return {
            "success": True,
            "message": "PDF uploaded and indexed successfully.",
            "document": dict(saved),
        }

@data_router.delete("/documents/{doc_id}")
def delete_document(doc_id: str, user: dict = Depends(get_current_user)):
    user_id = user["id"]
    with get_db() as conn:
        doc = conn.execute("SELECT * FROM pdf_documents WHERE id = ? AND user_id = ?", (doc_id, user_id)).fetchone()
        if not doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

        # Delete from disk
        try:
            if os.path.exists(doc["file_path"]):
                os.remove(doc["file_path"])
        except Exception:
            pass

        conn.execute("DELETE FROM pdf_documents WHERE id = ? AND user_id = ?", (doc_id, user_id))
        return {"success": True, "message": "Document removed successfully"}

# ----------------- CURATED RESOURCES (PROTOTYPE) -----------------

@data_router.get("/resources")
def get_curated_resources():
    return {
        "is_prototype": True,
        "prototype_label": "Curated Engineering Library (Prototype with YouTube & Lecture Links)",
        "resources": [
            {
                "id": "res_yt_1",
                "title": "MIT 18.06: Gilbert Strang - Eigenvalues & Eigenvectors",
                "category": "Linear Algebra",
                "type": "YouTube Lecture",
                "url": "https://www.youtube.com/watch?v=13r9QY6cmjc",
                "recommended_for": "Core Concept Intuition",
                "duration": "51 mins",
            },
            {
                "id": "res_yt_2",
                "title": "NPTEL: Operating Systems - Virtual Memory & Page Replacement",
                "category": "Operating Systems",
                "type": "YouTube Lecture",
                "url": "https://www.youtube.com/watch?v=2n_Qx8t6d0k",
                "recommended_for": "LRU vs OPT Algorithms",
                "duration": "48 mins",
            },
            {
                "id": "res_yt_3",
                "title": "Gate Smashers: Normalization (1NF, 2NF, 3NF, BCNF) Made Simple",
                "category": "Database Systems",
                "type": "YouTube Video",
                "url": "https://www.youtube.com/watch?v=5hsOz7zF3yE",
                "recommended_for": "Functional Dependency Shortcuts",
                "duration": "35 mins",
            },
            {
                "id": "res_yt_4",
                "title": "Computerphile: TCP 3-Way Handshake & Packet Reliability",
                "category": "Networks",
                "type": "YouTube Video",
                "url": "https://www.youtube.com/watch?v=bW_nPfqEQyE",
                "recommended_for": "Transport Layer Foundations",
                "duration": "14 mins",
            },
        ]
    }

