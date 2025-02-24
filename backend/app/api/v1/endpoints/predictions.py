from fastapi import APIRouter, HTTPException, Depends
from pathlib import Path
import json
from typing import Optional

from app.core.database import get_db

router = APIRouter(prefix="/predictions", tags=["predictions"])

@router.get("/step1/{student_id}")
async def get_step1_prediction(student_id: int):
    predictions_path = Path(__file__).parent.parent.parent.parent / "data" / "predictions" / "student_predictions.json"
    
    if not predictions_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Predictions not generated yet"
        )

    with open(predictions_path, "r") as f:
        predictions = json.load(f)
    
    for pred in predictions:
        if pred['student_id'] == student_id:
            return {
                "student_id": student_id,
                "predicted_pass": bool(pred['predicted_passorfail'])
            }
    
    raise HTTPException(
        status_code=404,
        detail=f"No prediction found for student {student_id}"
    )