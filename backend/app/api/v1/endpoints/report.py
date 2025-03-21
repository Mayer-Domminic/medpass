from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from app.core.database import (get_db, 
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
    Student
)
from app.schemas.reportschema import StudentCompleteReport, DomainReport, DomainGrouping

import pandas as pd
from typing import Optional, List
from datetime import datetime


router = APIRouter()

#Generates a student report based on a student's information, total exams, and grades
@router.get("/report", response_model=StudentCompleteReport)
async def generate_report(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        print(current_user.username)
        if current_user.issuperuser:
            raise HTTPException(
                status_code=403,
                detail="Admins accounts can not access student reports route"
            )

        studentid = db.query(Student.studentid).filter(Student.logininfoid == current_user.logininfoid).scalar()
        if not studentid:
            raise HTTPException(
                status_code=404,
                detail="Login Info is not Attached to a Student"
            )
        
        studentinfo = generateStudentInformationReport(studentid, db)
        if not studentinfo:
            raise HTTPException(
                status_code=404,
                detail="No Student Info Found"
            )
        
        #Exams and Grades can be empty if they have no exams/grades on records
        exams = generateExamReport(studentid, db) or []
        
        grades = generateGradeReport(studentid, db) or []
        
        
        return StudentCompleteReport(
            StudentInfo = studentinfo,
            Exams = exams,
            Grades = grades
        )
    
    except HTTPException:
        raise
    
    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your request"
        )

# Generates a domain report about a student, does not contain exams or student informaiton 
# Only contains grades mapped to a specific domain    
@router.get("/domainreport", response_model=DomainGrouping)
async def generate_domain_report(
    current_user: User = Depends(get_current_active_user),
    domain_id: Optional[int] = None, #Optional Allows to Query a single report if needed
    db: Session = Depends(get_db)
):
    try:
        if current_user.issuperuser:
            raise HTTPException(
                status_code=403,
                detail="Admins accounts can not access student reports route"
            )

        studentid = db.query(Student.studentid).filter(Student.logininfoid == current_user.logininfoid).scalar()
        if not studentid:
            raise HTTPException(
                status_code=404,
                detail="Login Info is not Attached to a Student"
            )
            
        if domain_id:
            domain_grades = generateDomainReport(studentid, db, domain_id)
        else:
            domain_grades = generateDomainReport(studentid, db)
            
        domain_reports = {}
        for grades in domain_grades:
            domain_name = grades.DomainName
            if domain_name not in domain_reports:
                domain_reports[domain_name] = []
            domain_reports[domain_name].append(grades)
            
        return {"Domains": domain_reports}
    
    except HTTPException:
        raise
    
    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your request"
        )