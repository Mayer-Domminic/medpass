from fastapi import APIRouter
from .endpoints import auth, info, users

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(info.router, prefix="", tags=["info"])
