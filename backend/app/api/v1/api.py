from fastapi import APIRouter
from .endpoints import auth, risk, settings, student, report, faculty, about, question, calendar, gemini, rag, practice_questions, notes

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# Jake's Mock Risk BS
from .endpoints import mock_risk
api_router.include_router(mock_risk.router, prefix="/info", tags=["info"])

# api_router.include_router(risk.router, prefix="/info", tags=["info"])

api_router.include_router(student.router, prefix="/student", tags=["student"])
api_router.include_router(faculty.router, prefix="/faculty", tags=["faculty"])
api_router.include_router(report.router, prefix="", tags=["report"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(about.router, prefix="/about", tags=["about"])
api_router.include_router(question.router, prefix="/question", tags=["question"])
#api_router.include_router(calendar.router, prefix="/calendar", tags=["calendar"])
api_router.include_router(about.router, prefix="/about", tags=["about"])
api_router.include_router(rag.router, prefix="/rag", tags=["rag"])
api_router.include_router(gemini.router)
api_router.include_router(practice_questions.router)
api_router.include_router(notes.router, prefix="/notes")