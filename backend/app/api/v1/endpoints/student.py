from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json
import numpy as np
from typing import Dict, List, Tuple
from ....schemas.pydantic_base_models.pydanticstudentinformation import StudentSchema
from ....core.database import get_db
from app.models import Student
401
router = APIRouter()

@router.get("/student/{student_id}", response_model=StudentSchema)
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.studentid == student_id).first()

    if student is None:
        raise HTTPException(status_code=404, detail="Student not found in database!")

    student_dict = {column.name: getattr(student, column.name) for column in Student.__table__.columns}
    
    for key, value in student_dict.items():
        if isinstance(value, float) and np.isnan(value):
            student_dict[key] = None
            
    return student_dict
    