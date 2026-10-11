import hmac
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Tuple
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHashError
from jose import jwt, JWTError
from backend.app.config import settings
from backend.app.database import get_db

ph = PasswordHasher(
    time_cost=2,
    memory_cost=19456,  # 19 MiB
    parallelism=1,
    hash_len=32,
    salt_len=16,
)

ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    return ph.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return ph.verify(hashed_password, plain_password)
    except (VerifyMismatchError, InvalidHashError):
        return False

def hash_token(token: str) -> str:
    """Create SHA-256 hash of single-use token or refresh token for DB storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": now})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=ALGORITHM)

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

def create_refresh_token() -> str:
    """Generate cryptographically secure high-entropy random token string."""
    return secrets.token_urlsafe(48)

def generate_csrf_token() -> str:
    return secrets.token_hex(24)

def constant_time_compare(val1: str, val2: str) -> bool:
    return hmac.compare_digest(val1.encode("utf-8"), val2.encode("utf-8"))

# Account Lockout & Rate Limiting Engine
MAX_FAILED_ATTEMPTS = 5
BASE_LOCKOUT_MINUTES = 15

def check_account_lockout(identifier: str) -> Tuple[bool, Optional[str]]:
    """
    Check if an IP address or account identifier is currently locked out.
    Returns (is_locked, error_message)
    """
    with get_db() as conn:
        row = conn.execute(
            "SELECT failed_attempts, locked_until FROM login_attempts WHERE identifier = ?",
            (identifier.lower(),)
        ).fetchone()

        if not row:
            return False, None

        if row["locked_until"]:
            locked_until_dt = datetime.fromisoformat(row["locked_until"])
            now = datetime.now(timezone.utc)
            if now < locked_until_dt:
                remaining_seconds = int((locked_until_dt - now).total_seconds())
                remaining_minutes = max(1, remaining_seconds // 60)
                return True, f"Account temporarily locked due to repeated failures. Try again in {remaining_minutes} minute(s)."

        return False, None

def record_failed_login(identifier: str):
    with get_db() as conn:
        now = datetime.now(timezone.utc)
        row = conn.execute(
            "SELECT failed_attempts FROM login_attempts WHERE identifier = ?",
            (identifier.lower(),)
        ).fetchone()

        if not row:
            conn.execute(
                "INSERT INTO login_attempts (identifier, failed_attempts, last_attempt) VALUES (?, 1, ?)",
                (identifier.lower(), now.isoformat())
            )
        else:
            new_attempts = row["failed_attempts"] + 1
            locked_until = None
            if new_attempts >= MAX_FAILED_ATTEMPTS:
                # Exponential backoff based on attempts beyond threshold
                exponent = new_attempts - MAX_FAILED_ATTEMPTS
                lock_duration_mins = BASE_LOCKOUT_MINUTES * (2 ** min(exponent, 4))
                locked_until = (now + timedelta(minutes=lock_duration_mins)).isoformat()

            conn.execute(
                "UPDATE login_attempts SET failed_attempts = ?, locked_until = ?, last_attempt = ? WHERE identifier = ?",
                (new_attempts, locked_until, now.isoformat(), identifier.lower())
            )

def reset_failed_logins(identifier: str):
    with get_db() as conn:
        conn.execute(
            "DELETE FROM login_attempts WHERE identifier = ?",
            (identifier.lower(),)
        )

