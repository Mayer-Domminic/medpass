from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import (
    get_current_active_user
)
from app.models import LoginInfo as User
from app.models import (
    Student,
    GraduationStatus,
    Exam,
    ExamResults,
    GradeClassification,
    StudentGrade,
    ClassOffering
)
from ....schemas.reportschema import StudentReport, ExamReport, GradeReport, StudentCompleteReport

import pandas as pd
import io
import json
from datetime import datetime


router = APIRouter()

def generateStudentInformationReport(student_id, db):
    data = db.query(
        Student.studentid,
        Student.lastname,
        Student.firstname,
        Student.cumgpa,
        Student.bcpmgpa,
        Student.mmicalc,
        GraduationStatus.rosteryear,
        GraduationStatus.graduationyear,
        GraduationStatus.graduated,
        GraduationStatus.graduationlength,
        GraduationStatus.status
    ).join(
        GraduationStatus, Student.studentid == GraduationStatus.studentid
    ).filter(
        Student.studentid == student_id
    ).first()
    
    '''
    Pydantic handeling Float(NaN) to None conversion will not need to handle
    multiple rows as a student will only have a singular student report
    '''
    studentinformation = StudentReport(
        StudentID = data.studentid,
        LastName = data.lastname,
        FirstName = data.firstname,
        CumGPA = data.bcpmgpa,
        MMICalc = data.mmicalc,
        RosterYear = data.rosteryear,
        GraduationYear = data.graduationyear,
        Graduated = data.graduated,
        GraduationLength = data.graduationlength,
        Status = data.status
    )
    
    return studentinformation

def generateExamReport(student_id, db):
    data = db.query(
        Exam.examname,
        ExamResults.score,
        Exam.passscore,
        ExamResults.passorfail
    ).join(
        Exam, ExamResults.examid == Exam.examid
    ).filter(
        ExamResults.studentid == student_id
    ).all()
    
    exams = []
    #Converting to a dictionary as there can be multiple records of exams
    for row in data:
        exam_dict = {
            "ExamName": row[0],
            "Score": row[1],
            "PassScore": row[2],
            "PassOrFail": row[3]
        }
        pydanticData = ExamReport(**exam_dict)
        exams.append(pydanticData)
        
    return exams

def generateGradeReport(student_id, db):
    data = db.query(
        GradeClassification.classificationname,
        StudentGrade.pointsearned,
        StudentGrade.pointsavailable,
        ClassOffering.classid,
        ClassOffering.datetaught
    ).join(
        GradeClassification, StudentGrade.gradeclassificationid == GradeClassification.gradeclassificationid
    ).join(
        ClassOffering, GradeClassification.classofferingid == ClassOffering.classofferingid
    ).filter(
        StudentGrade.studentid == student_id
    ).all()
    
    grades = []
    #Converting to dictionary as there can be multiple records of grades
    for row in data:
        grade_dict = {
            "ClassificationName": row[0],
            "PointsEarned": row[1],
            "PointsAvailable": row[2],
            "ClassID": row[3],
            "DateTaught": row[4]
        }
        pydanticData = GradeReport(**grade_dict)
        grades.append(pydanticData)
        
    return grades
    
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