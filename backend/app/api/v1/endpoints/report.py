from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import (
    get_current_active_user
)
from app.models import LoginInfo as User
from app.models import (
    Student,
    GraduationStatus
)
from ....schemas.reportschema import StudentReport
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
    
    #Pydantic modeling handeling NaN to None conversion
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
    

@router.get("/report")
async def login(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        print(current_user.username)
        if current_user.issuperuser:
            raise HTTPException(
                status_code=400,
                detail="You can't be an admin, you must be a student."
            )

        studentid = db.query(Student.studentid).filter(Student.logininfoid == current_user.logininfoid).scalar()
        
        studentinfo = generateStudentInformationReport(studentid, db)
        
        return studentinfo.json()
    
    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your request"
        )