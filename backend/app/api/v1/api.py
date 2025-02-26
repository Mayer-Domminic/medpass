from fastapi import APIRouter
from .endpoints import auth, risk, report

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(risk.router, prefix="/info", tags=["info"])
api_router.include_router(report.router, prefix="", tags=["report"])
