import os
from pathlib import Path
from typing import List

# Read .env file manually if python-dotenv is not installed
env_file = Path(__file__).resolve().parent.parent.parent / ".env"
if env_file.exists():
    with open(env_file, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

class Settings:
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    PORT: int = int(os.getenv("PORT", "5000"))
    
    @property
    def DATABASE_PATH(self) -> str:
        explicit_path = os.getenv("DATABASE_PATH")
        if explicit_path:
            return explicit_path
        db_url = os.getenv("DATABASE_URL")
        if db_url and db_url.startswith("sqlite:///"):
            return db_url.replace("sqlite:///", "")
        return str(Path(__file__).resolve().parent.parent.parent / "mindora.db")

    JWT_SECRET: str = os.getenv("JWT_SECRET", "mindora_aurora_secret_key_change_in_production_2026_xyz")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    COOKIE_SECURE: bool = os.getenv("COOKIE_SECURE", "false").lower() == "true"
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    YOUTUBE_API_KEY: str = os.getenv("YOUTUBE_API_KEY", "")
    
    @property
    def CORS_ORIGINS(self) -> List[str]:
        raw = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
        origins = [origin.strip() for origin in raw.split(",") if origin.strip()]
        frontend_origin = os.getenv("FRONTEND_ORIGIN")
        if frontend_origin and frontend_origin not in origins:
            origins.append(frontend_origin.strip())
        return origins

settings = Settings()
