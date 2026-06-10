from pydantic import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "ImageShare API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]
    
    # Security
    SECRET_KEY: str = "DEVELOPMENT_SECRET_KEY_CHANGE_IN_PRODUCTION"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Database (SQLite for local testing on Python 3.14)
    DATABASE_URL: str = "sqlite:///./imageshare.db"

    # Cloudflare R2 Storage
    R2_ACCOUNT_ID: str = "your_cloudflare_account_id"
    R2_ACCESS_KEY_ID: str = "your_r2_access_key"
    R2_SECRET_ACCESS_KEY: str = "your_r2_secret_key"
    R2_BUCKET_NAME: str = "imageshare-production"
    R2_PUBLIC_URL_PREFIX: str = "https://i.imageshare.com"
    
    # Upload Limits
    MAX_UPLOAD_SIZE_ANONYMOUS: int = 10 * 1024 * 1024 # 10MB
    MAX_UPLOAD_SIZE_FREE: int = 50 * 1024 * 1024 # 50MB
    
    # OpenAI Settings
    OPENAI_API_KEY: str = "sk-placeholder"
    
    # SMTP Settings (For Welcome Emails)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM: str = "no-reply@imageshare.com"
    SMTP_FROM_NAME: str = "ImageShare"
    
    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

settings = Settings()
