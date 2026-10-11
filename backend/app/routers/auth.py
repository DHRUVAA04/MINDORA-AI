import uuid
import datetime
from datetime import datetime as dt, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Request, Response, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.app.config import settings
from backend.app.database import get_db
from backend.app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    UserResponse,
    AuthResponse,
)
from backend.app.security import (
    hash_password,
    verify_password,
    hash_token,
    create_access_token,
    create_refresh_token,
    generate_csrf_token,
    decode_access_token,
    check_account_lockout,
    record_failed_login,
    reset_failed_logins,
    constant_time_compare,
)

auth_router = APIRouter(prefix="/auth", tags=["Authentication"])
security_scheme = HTTPBearer(auto_error=False)

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

def set_auth_cookies(response: Response, access_token: str, refresh_token: str, csrf_token: str, remember_me: bool = False):
    refresh_max_age = (settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400) if remember_me else 86400
    access_max_age = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

    # httpOnly, SameSite=Lax short-lived access token cookie for browser requests
    response.set_cookie(
        key="accessToken",
        value=access_token,
        max_age=access_max_age,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        path="/",
    )
    
    # httpOnly, SameSite=Lax rotating refresh token cookie
    response.set_cookie(
        key="refreshToken",
        value=refresh_token,
        max_age=refresh_max_age,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        path="/",
    )
    
    # Accessible CSRF cookie for Double-Submit or header validation
    response.set_cookie(
        key="csrfToken",
        value=csrf_token,
        max_age=refresh_max_age,
        httponly=False,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        path="/",
    )

def clear_auth_cookies(response: Response):
    response.delete_cookie(key="accessToken", path="/")
    response.delete_cookie(key="refreshToken", path="/")
    response.delete_cookie(key="refreshToken", path="/auth")
    response.delete_cookie(key="csrfToken", path="/")

def get_current_user(
    request: Request,
    creds: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> dict:
    token = None
    if creds and creds.credentials:
        token = creds.credentials
    else:
        # Check header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]
        # Check httpOnly cookie
        elif request.cookies.get("accessToken"):
            token = request.cookies.get("accessToken")
        elif request.cookies.get("access_token"):
            token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token expired or invalid",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload["sub"]
    with get_db() as conn:
        user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account no longer exists",
            )
        return dict(user)

# ----------------- ENDPOINTS -----------------

@auth_router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, request: Request, response: Response):
    ip = get_client_ip(request)
    is_locked, lock_msg = check_account_lockout(f"reg_ip_{ip}")
    if is_locked:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=lock_msg)

    clean_email = str(req.email).lower().strip()

    with get_db() as conn:
        existing = conn.execute("SELECT id FROM users WHERE email = ?", (clean_email,)).fetchone()
        if existing:
            # Prevent email enumeration with generic error message
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to complete registration. If you already have an account, please log in.",
            )

        user_id = "usr_" + uuid.uuid4().hex[:12]
        pwd_hash = hash_password(req.password)
        now_str = dt.now(timezone.utc).isoformat()

        conn.execute("""
            INSERT INTO users (
                id, name, email, password_hash, role, educational_level,
                age_range, guardian_email, consent_given, email_verified,
                target_exam, weekly_target_hours, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id,
            req.name,
            clean_email,
            pwd_hash,
            "student",
            req.educational_level,
            req.age_range,
            str(req.guardian_email).lower() if req.guardian_email else None,
            1 if req.consent_given else 0,
            1, # prototype verified flag
            "GATE / Semester Exam 2026",
            20,
            now_str,
        ))

        # Create refresh token and CSRF token
        raw_refresh = create_refresh_token()
        refresh_hash = hash_token(raw_refresh)
        refresh_expires = (dt.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)).isoformat()
        token_id = "rt_" + uuid.uuid4().hex[:10]

        conn.execute("""
            INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, revoked, created_at)
            VALUES (?, ?, ?, ?, 0, ?)
        """, (token_id, user_id, refresh_hash, refresh_expires, now_str))

        csrf_token = generate_csrf_token()
        access_token = create_access_token({"sub": user_id, "email": clean_email, "name": req.name})
        set_auth_cookies(response, access_token, raw_refresh, csrf_token)

        user_res = UserResponse(
            id=user_id,
            name=req.name,
            email=clean_email,
            role="student",
            educational_level=req.educational_level,
            age_range=req.age_range,
            email_verified=True,
            target_exam="GATE / Semester Exam 2026",
            weekly_target_hours=20,
            created_at=now_str,
        )

        return AuthResponse(
            user=user_res,
            csrf_token=csrf_token,
            access_token=access_token,
            message="Registration successful. Welcome to Mindora AI!",
        )

@auth_router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, request: Request, response: Response):
    ip = get_client_ip(request)
    clean_email = str(req.email).lower().strip()
    
    # Check rate limit on both IP and account identifier
    is_ip_locked, ip_msg = check_account_lockout(f"ip_{ip}")
    if is_ip_locked:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=ip_msg)

    is_acct_locked, acct_msg = check_account_lockout(f"acc_{clean_email}")
    if is_acct_locked:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=acct_msg)

    with get_db() as conn:
        user = conn.execute("SELECT * FROM users WHERE email = ?", (clean_email,)).fetchone()
        
        # Generic error message to prevent enumeration + constant-time password check
        if not user or not verify_password(req.password, user["password_hash"]):
            record_failed_login(f"ip_{ip}")
            record_failed_login(f"acc_{clean_email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email or password is incorrect",
            )

        # Successful login: reset failed login attempts
        reset_failed_logins(f"ip_{ip}")
        reset_failed_logins(f"acc_{clean_email}")

        now_dt = dt.now(timezone.utc)
        now_str = now_dt.isoformat()

        # Issue rotating refresh token
        raw_refresh = create_refresh_token()
        refresh_hash = hash_token(raw_refresh)
        days = settings.REFRESH_TOKEN_EXPIRE_DAYS if req.remember_me else 1
        refresh_expires = (now_dt + timedelta(days=days)).isoformat()
        token_id = "rt_" + uuid.uuid4().hex[:10]

        conn.execute("""
            INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, revoked, created_at)
            VALUES (?, ?, ?, ?, 0, ?)
        """, (token_id, user["id"], refresh_hash, refresh_expires, now_str))

        csrf_token = generate_csrf_token()
        access_token = create_access_token({"sub": user["id"], "email": user["email"], "name": user["name"]})
        set_auth_cookies(response, access_token, raw_refresh, csrf_token, remember_me=req.remember_me)

        user_res = UserResponse(
            id=user["id"],
            name=user["name"],
            email=user["email"],
            role=user["role"],
            educational_level=user["educational_level"] or "College",
            age_range=user["age_range"] or "18-22",
            email_verified=bool(user["email_verified"]),
            target_exam=user["target_exam"] or "GATE / Semester Exam 2026",
            weekly_target_hours=user["weekly_target_hours"] or 20,
            created_at=user["created_at"],
        )

        return AuthResponse(
            user=user_res,
            csrf_token=csrf_token,
            access_token=access_token,
            message="Sign in successful",
        )

@auth_router.post("/refresh", response_model=AuthResponse)
def refresh_token_endpoint(request: Request, response: Response):
    raw_refresh = request.cookies.get("refreshToken")
    if not raw_refresh:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session refresh token not found. Please log in.",
        )

    hashed = hash_token(raw_refresh)
    now_str = dt.now(timezone.utc).isoformat()

    with get_db() as conn:
        token_record = conn.execute("""
            SELECT * FROM refresh_tokens 
            WHERE token_hash = ? AND revoked = 0 AND expires_at > ?
        """, (hashed, now_str)).fetchone()

        if not token_record:
            clear_auth_cookies(response)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Your session has expired. Please log in again.",
            )

        user = conn.execute("SELECT * FROM users WHERE id = ?", (token_record["user_id"],)).fetchone()
        if not user:
            clear_auth_cookies(response)
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

        # Rotate refresh token (revoke current and generate new)
        conn.execute("UPDATE refresh_tokens SET revoked = 1 WHERE id = ?", (token_record["id"],))

        new_refresh = create_refresh_token()
        new_hash = hash_token(new_refresh)
        new_expires = (dt.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)).isoformat()
        new_id = "rt_" + uuid.uuid4().hex[:10]

        conn.execute("""
            INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, revoked, created_at)
            VALUES (?, ?, ?, ?, 0, ?)
        """, (new_id, user["id"], new_hash, new_expires, now_str))

        csrf_token = generate_csrf_token()
        access_token = create_access_token({"sub": user["id"], "email": user["email"], "name": user["name"]})
        set_auth_cookies(response, access_token, new_refresh, csrf_token)

        user_res = UserResponse(
            id=user["id"],
            name=user["name"],
            email=user["email"],
            role=user["role"],
            educational_level=user["educational_level"] or "College",
            age_range=user["age_range"] or "18-22",
            email_verified=bool(user["email_verified"]),
            target_exam=user["target_exam"] or "GATE / Semester Exam 2026",
            weekly_target_hours=user["weekly_target_hours"] or 20,
            created_at=user["created_at"],
        )

        return AuthResponse(
            user=user_res,
            csrf_token=csrf_token,
            access_token=access_token,
            message="Token refreshed successfully",
        )

@auth_router.post("/logout")
def logout(request: Request, response: Response):
    raw_refresh = request.cookies.get("refreshToken")
    if raw_refresh:
        hashed = hash_token(raw_refresh)
        with get_db() as conn:
            conn.execute("UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?", (hashed,))

    clear_auth_cookies(response)
    return {"success": True, "message": "Logged out successfully"}

@auth_router.get("/me", response_model=UserResponse)
def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        role=user["role"],
        educational_level=user["educational_level"] or "College",
        age_range=user["age_range"] or "18-22",
        email_verified=bool(user["email_verified"]),
        target_exam=user["target_exam"] or "GATE / Semester Exam 2026",
        weekly_target_hours=user["weekly_target_hours"] or 20,
        created_at=user["created_at"],
    )

@auth_router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, request: Request):
    ip = get_client_ip(request)
    is_locked, lock_msg = check_account_lockout(f"forgot_{ip}")
    if is_locked:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=lock_msg)

    clean_email = str(req.email).lower().strip()

    with get_db() as conn:
        user = conn.execute("SELECT id, name FROM users WHERE email = ?", (clean_email,)).fetchone()
        if user:
            raw_reset_token = create_refresh_token()
            token_hashed = hash_token(raw_reset_token)
            expires_at = (dt.now(timezone.utc) + timedelta(minutes=30)).isoformat()
            now_str = dt.now(timezone.utc).isoformat()
            t_id = "pr_" + uuid.uuid4().hex[:10]

            conn.execute("""
                INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, used, created_at)
                VALUES (?, ?, ?, ?, 0, ?)
            """, (t_id, user["id"], token_hashed, expires_at, now_str))

            # Prototype reset link logged in development console only
            if settings.ENVIRONMENT == "development":
                reset_link = f"http://localhost:5173/reset-password?token={raw_reset_token}"
                print(f"\n[PROTOTYPE EMAIL SYSTEM - DEV ONLY] Password reset link for {clean_email}:\n{reset_link}\n")

    return {
        "success": True,
        "message": "If an account with that email exists, password reset instructions have been generated.",
    }

@auth_router.post("/reset-password")
def reset_password(req: ResetPasswordRequest):
    token_hashed = hash_token(req.token)
    now_str = dt.now(timezone.utc).isoformat()

    with get_db() as conn:
        reset_record = conn.execute("""
            SELECT * FROM password_reset_tokens 
            WHERE token_hash = ? AND used = 0 AND expires_at > ?
        """, (token_hashed, now_str)).fetchone()

        if not reset_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset link is invalid or has expired. Please request a new one.",
            )

        new_hash = hash_password(req.new_password)
        conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_hash, reset_record["user_id"]))
        conn.execute("UPDATE password_reset_tokens SET used = 1 WHERE id = ?", (reset_record["id"],))
        
        # Invalidate all active sessions for security
        conn.execute("UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?", (reset_record["user_id"],))

    return {
        "success": True,
        "message": "Password updated successfully. You may now log in with your new password.",
    }

@auth_router.delete("/account")
def delete_account(response: Response, user: dict = Depends(get_current_user)):
    user_id = user["id"]
    with get_db() as conn:
        # Delete user record (foreign key cascades will clear sessions, goals, topics, conversations)
        conn.execute("DELETE FROM users WHERE id = ?", (user_id,))

    clear_auth_cookies(response)
    return {
        "success": True,
        "message": "Your account and all associated study data have been permanently deleted.",
    }

