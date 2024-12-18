# backend/app/api/v1/endpoints/users.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ....schemas import user as user_schemas
from ....models import user as user_models
from ...deps import get_db

from fastapi import APIRouter, Depends
from ...deps import get_current_user

router = APIRouter()

@router.get("/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user

@router.post("/", response_model=user_schemas.User)
def create_user(
    user: user_schemas.UserCreate,
    db: Session = Depends(get_db)
):
    db_user = user_models.User(
        email=user.email,
        full_name=user.full_name,
        hashed_password="temp"  # TODO: Add proper password hashing
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/", response_model=List[user_schemas.User])
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    users = db.query(user_models.User).offset(skip).limit(limit).all()
    return users