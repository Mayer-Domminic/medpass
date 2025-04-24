from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models import LoginInfo as User
from app.schemas.wrisks import RiskAssessmentResponse

router = APIRouter()

@router.get("/risk", response_model=RiskAssessmentResponse)
async def get_risk_assessment(
    student_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Mock implementation of risk assessment for a student.
    Returns sample data for testing purposes.
    """
    # Return mock risk assessment data
    return {
        "risk_score": 65,
        "risk_level": "Medium",
        "strengths": [
            {"subject": "Cardiology", "unit_type": "Course", "performance": 92, "performance_score": 92},
            {"subject": "Biochemistry", "unit_type": "Course", "performance": 88, "performance_score": 88},
            {"subject": "Pharmacology", "unit_type": "Exam", "performance": 85, "performance_score": 85}
        ],
        "weaknesses": [
            {"subject": "Immunology", "unit_type": "Course", "performance": 68, "performance_score": 68},
            {"subject": "Neurology", "unit_type": "Exam", "performance": 72, "performance_score": 72},
            {"subject": "Microbiology", "unit_type": "Course", "performance": 65, "performance_score": 65}
        ],
        "ml_prediction": {
            "prediction": 1,
            "probability": 0.8,
            "prediction_text": "On-time graduation likely",
            "confidence_score": 80
        },
        "details": {
            "student_name": "Test Student",
            "total_exams": 5,
            "passed_exams": 4
        }
    }