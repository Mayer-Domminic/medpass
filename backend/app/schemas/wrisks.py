from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any

class StrengthWeakness(BaseModel):
    """Schema for student strengths and weaknesses"""
    subject: str
    unit_type: str
    performance_score: float

class MLPrediction(BaseModel):
    """Schema for ML model prediction"""
    prediction: int = Field(..., description="1=on-time graduation, 0=delayed graduation, -1=error")
    probability: float = Field(..., description="Probability of the predicted class (0.0-1.0)")
    prediction_text: str = Field(..., description="Human-readable prediction")
    confidence_score: float = Field(..., description="Confidence percentage (0-100)")

class RiskAssessmentResponse(BaseModel):
    """Schema for risk assessment response"""
    risk_score: float = Field(..., description="Overall risk score (0-100, lower means higher risk)")
    risk_level: str = Field(..., description="Risk level categorization (High, Medium, Low)")
    strengths: List[StrengthWeakness] = []
    weaknesses: List[StrengthWeakness] = []
    ml_prediction: MLPrediction
    details: Dict[str, Any] = {}