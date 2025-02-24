from fastapi import APIRouter, HTTPException, Depends
from pathlib import Path
import joblib
import pandas as pd
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.studentinformationmodels import Student, ExamResults
from ..models.classfacultymodels import StudentGrade
from ..models.examquestionmodels import Exam

model_path = Path(__file__).parent.parent.parent.parent / "data" / "predictions" / "step1_model.pkl"
try:
    model = joblib.load(model_path) if model_path.exists() else None
except Exception as e:
    model = None
    print(f"Error loading model: {str(e)}")

def get_student_features(student_id: int, db: Session):
    student = db.get(Student, student_id)
    if not student:
        return None
    
    features = {
        'cumgpa': student.cumgpa,
        'bcpmgpa': student.bcpmgpa,
        'mmicalc': student.mmicalc
    }
    
    # Calculate grades
    grades = db.query(
        func.coalesce(func.sum(StudentGrade.pointsearned), 0).label('total_earned'),
        func.coalesce(func.sum(StudentGrade.pointsavailable), 0).label('total_available')
    ).filter(StudentGrade.studentid == student_id).first()
    
    features['avg_grade'] = (
        grades.total_earned / grades.total_available 
        if grades.total_available > 0 else 0.0
    )
    
    # Previous exams
    prev_exams = db.query(ExamResults).join(Exam).filter(
        ExamResults.studentid == student_id,
        Exam.examname != 'Step 1'
    ).all()
    
    features.update({
        'num_prev_exams': len(prev_exams),
        'avg_prev_score': sum(e.score for e in prev_exams) / len(prev_exams) if prev_exams else 0,
        'prev_pass_rate': sum(int(e.passorfail) for e in prev_exams) / len(prev_exams) if prev_exams else 0
    })
    
    return pd.DataFrame([features])

@router.get("/step1/{student_id}")
async def predict_step1(student_id: int, db: Session = Depends(get_db)):
    if not model:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    features = get_student_features(student_id, db)
    if features is None:
        raise HTTPException(status_code=404, detail="Student not found")
    
    try:
        proba = model.predict_proba(features)[0][1]
        return {
            "student_id": student_id,
            "prediction": bool(model.predict(features)[0]),
            "confidence": round(proba, 2),
            "risk_level": "high" if proba < 0.7 else "medium" if proba < 0.85 else "low"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))