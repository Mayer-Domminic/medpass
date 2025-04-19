from fastapi import APIRouter
from .endpoints import auth, mock_risk, settings, student, report, calendar, faculty, about 

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(mock_risk.router, prefix="/info", tags=["info"])
api_router.include_router(student.router, prefix="/student", tags=["student"])
api_router.include_router(faculty.router, prefix="/faculty", tags=["faculty"])
api_router.include_router(report.router, prefix="", tags=["report"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(calendar.router, prefix="/calendar", tags=["calendar"])
api_router.include_router(about.router, prefix="/about", tags=["about"])
