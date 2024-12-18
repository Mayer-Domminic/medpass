# backend/app/api/deps.py
from typing import Generator
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..core.database import SessionLocal
from ..core.auth import Auth0
from ..core.config import settings

auth0 = Auth0(settings.AUTH0_DOMAIN, settings.AUTH0_API_AUDIENCE)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    return await auth0.verify_token(token)

def get_db() -> Generator:
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()