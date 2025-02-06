from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Any
from ...deps import get_db, get_current_user
from ....models import User, Student
from ....schemas.student import StudentResponse


router = APIRouter()

@router.get("/info/{net_id}", response_model=StudentResponse)
def get_student_by_net_id(
    net_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Fetch a student record by net_id.
    """

    student = db.query(Student).filter(Student.net_id == net_id).first()
    if not student:
        student = db.query(Student).filter(Student.net_id.ilike(f"%{net_id}%")).first()
        
        raise HTTPException(
            status_code=404,
            detail=f"Student not found with net_id {net_id}"
        )
    return student