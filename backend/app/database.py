import sqlite3
import datetime
from pathlib import Path
from contextlib import contextmanager
from backend.app.config import settings

DB_FILE = Path(settings.DATABASE_PATH)

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_FILE), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    return conn

@contextmanager
def get_db():
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def run_migrations():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                applied_at TEXT NOT NULL
            );
        """)

        applied = {row["version"] for row in conn.execute("SELECT version FROM schema_migrations").fetchall()}

        if 1 not in applied:
            print("[Database] Applying Migration 001: Core Auth, Timer, Topics & AI schema...")
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    role TEXT NOT NULL DEFAULT 'student',
                    educational_level TEXT NOT NULL DEFAULT 'College',
                    age_range TEXT NOT NULL DEFAULT '18-22',
                    guardian_email TEXT,
                    consent_given INTEGER NOT NULL DEFAULT 1,
                    email_verified INTEGER NOT NULL DEFAULT 0,
                    target_exam TEXT DEFAULT 'GATE / Semester Exam 2026',
                    weekly_target_hours INTEGER DEFAULT 20,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS refresh_tokens (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    token_hash TEXT NOT NULL,
                    expires_at TEXT NOT NULL,
                    revoked INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS password_reset_tokens (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    token_hash TEXT NOT NULL,
                    expires_at TEXT NOT NULL,
                    used INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS login_attempts (
                    identifier TEXT PRIMARY KEY,
                    failed_attempts INTEGER NOT NULL DEFAULT 0,
                    locked_until TEXT,
                    last_attempt TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS learning_activities (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    subject TEXT NOT NULL,
                    topic_id TEXT,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS focus_sessions (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    activity_id TEXT,
                    activity_title TEXT,
                    mode TEXT NOT NULL,
                    planned_seconds INTEGER NOT NULL,
                    actual_seconds INTEGER NOT NULL,
                    started_at TEXT NOT NULL,
                    ended_at TEXT NOT NULL,
                    completed INTEGER NOT NULL DEFAULT 1,
                    notes TEXT,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS user_goals (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    target TEXT NOT NULL,
                    deadline TEXT NOT NULL,
                    weekly_hours INTEGER NOT NULL DEFAULT 20,
                    completed_weeks INTEGER NOT NULL DEFAULT 0,
                    total_weeks INTEGER NOT NULL DEFAULT 16,
                    status TEXT NOT NULL DEFAULT 'On Track',
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS user_topics (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    subject TEXT NOT NULL,
                    title TEXT NOT NULL,
                    status TEXT NOT NULL, -- 'mastered', 'inProgress', 'weak', 'unassessed'
                    score INTEGER,
                    prerequisites TEXT,
                    estimated_hours REAL DEFAULT 2.0,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS ai_conversations (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS ai_messages (
                    id TEXT PRIMARY KEY,
                    conversation_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    sources TEXT,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS pdf_documents (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    filename TEXT NOT NULL,
                    file_path TEXT NOT NULL,
                    filesize INTEGER NOT NULL,
                    page_count INTEGER NOT NULL DEFAULT 1,
                    ai_annotations_count INTEGER NOT NULL DEFAULT 0,
                    summary TEXT,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
            """)

            # Seed initial learning activities
            act_count = conn.execute("SELECT COUNT(*) as count FROM learning_activities").fetchone()["count"]
            if act_count == 0:
                now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
                activities = [
                    ('act_101', 'Linear Algebra: Eigenvalues & Diagonalization', 'Mathematics III', 'math_la', now_str),
                    ('act_102', 'Data Structures: AVL Trees & Balance Factors', 'Data Structures', 'cs_ds', now_str),
                    ('act_103', 'OS: Virtual Memory & Page Replacement Algorithms', 'Operating Systems', 'cs_os', now_str),
                    ('act_104', 'DBMS: Normalization 3NF & BCNF Decomposition', 'Database Systems', 'cs_db', now_str),
                    ('act_105', 'Computer Networks: TCP 3-Way Handshake & Flow Control', 'Networks', 'cs_cn', now_str),
                ]
                conn.executemany(
                    "INSERT INTO learning_activities (id, title, subject, topic_id, created_at) VALUES (?, ?, ?, ?, ?)",
                    activities
                )

            conn.execute(
                "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)",
                (1, "001_initial_schema", datetime.datetime.now(datetime.timezone.utc).isoformat())
            )
            print("[Database] Migration 001 applied successfully.")

