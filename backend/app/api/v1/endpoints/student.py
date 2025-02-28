from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import json
import numpy as np
from typing import Dict, List, Tuple
from ....schemas.pydantic_base_models.user_schemas import StudentSchema
from ....core.database import get_db, link_logininfo
from app.models import Student, LoginInfo as User
from app.core.security import (
    get_current_active_user
)

router = APIRouter()

#Temp-route for learning, will be removed and eventually
'''
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
'''

#API Route to Change an association of a Login Info to another Student
@router.post("/updatelogin")
async def update_login(
    student_id: int,
    current_user: User = Depends(get_current_active_user),
):
    try:
        if current_user.issuperuser:
            raise HTTPException(
                status_code=400,
                detail="You can't be an admin, you must be a student."
            )

        link_logininfo(student_id, current_user.logininfoid)
    
    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your request"
        )
    