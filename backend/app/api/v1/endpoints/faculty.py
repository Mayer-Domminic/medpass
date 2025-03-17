from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import (get_db,
    link_logininfo, 
    generateStudentInformationReport, 
    generateGradeReport, 
    generateExamReport,
    generateDomainReport
)
from app.core.security import (
    get_current_active_user
)
from app.models import LoginInfo as User
from app.models import (
    Faculty,
    Student
)
from app.schemas.reportschema import StudentCompleteReport, DomainReport, DomainGrouping

import pandas as pd
from typing import Optional, List
from datetime import datetime

router = APIRouter()

@router.post("/updatelogin")
async def update_login(
    faculty_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        student = db.query(Student.studentid).filter(Student.logininfoid == current_user.logininfoid)
        if student:
            raise HTTPException(
                status_code=400,
                detail="You can't be an student, you must be a faculty."
            )

        link_logininfo(faculty_id, current_user.logininfoid, "faculty")
    
    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your request"
        )