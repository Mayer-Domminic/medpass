# backend/app/api/v1/api.py
from fastapi import APIRouter
from .endpoints import users

api_router = APIRouter()
api_router.include_router(users.router, prefix="/users", tags=["users"])
