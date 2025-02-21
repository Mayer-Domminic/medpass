from pydantic import BaseModel
from typing import List, Dict

class StrengthWeakness(BaseModel):
    subject: str  # e.g., "ANAT", "BIOCHEM"
    unit_type: str  # e.g., "Exam", "Homework"
    performance_score: float  # percent score

class RiskAssessmentResponse(BaseModel):
    risk_score: float
    strengths: List[StrengthWeakness]
    weaknesses: List[StrengthWeakness]
    details: Dict