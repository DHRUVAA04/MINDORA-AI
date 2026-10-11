import time
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.database import run_migrations
from backend.app.routers.auth import auth_router
from backend.app.routers.timer import timer_router
from backend.app.routers.data import data_router
from backend.app.routers.mentor import mentor_router

# Initialize database schema and auto-migrations
run_migrations()

app = FastAPI(
    title="Mindora AI — Aurora Study Nebula Backend",
    version="2.0.0",
    docs_url="/api/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url=None,
)

# CORS Middleware with strict allow-list
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if settings.COOKIE_SECURE:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# Mount routers
app.include_router(auth_router)
app.include_router(timer_router)
app.include_router(data_router)
app.include_router(mentor_router)

@app.get("/health")
@app.get("/api/health")
def health_check():
    ai_key_configured = bool(settings.ANTHROPIC_API_KEY and len(settings.ANTHROPIC_API_KEY.strip()) > 10)
    return {
        "status": "healthy",
        "service": "Mindora AI FastAPI Engine",
        "environment": settings.ENVIRONMENT,
        "ai_provider_configured": ai_key_configured,
        "ai_provider": "anthropic" if ai_key_configured else "mock_socratic",
        "timestamp": time.time(),
    }

