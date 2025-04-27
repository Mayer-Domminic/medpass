from pydantic_settings import BaseSettings
from typing import Optional
import os
from pathlib import Path

class Settings(BaseSettings):
    PROJECT_NAME: str = "MEDPASS"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    POSTGRES_SERVER: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    DATABASE_URL: Optional[str] = None
    
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ENVIRONMENT: str = "production"

    NEXTAUTH_URL: str
    NEXTAUTH_SECRET: str
    NEXT_PUBLIC_API_BASE_URL: str
    
    GEMINI_API_KEYS: Optional[str] = None
    AWS_S3_ACCESS: str
    AWS_S3_DEV: str

    class Config:
        env_file = str(Path(__file__).resolve().parent.parent.parent.parent / ".env")
        extra = "allow"

    @property
    def sync_database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}/{self.POSTGRES_DB}"

settings = Settings()