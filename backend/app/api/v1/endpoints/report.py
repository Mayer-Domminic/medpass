from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session, aliased
from sqlalchemy import or_
from urllib.parse import unquote
from typing import Optional, List
import json
from app.core.database import (
    get_db,
    generateStudentInformationReport,
    generateGradeReport,
    generateExamReport,
    generateDomainReport,
    get_student_statistics
)
from app.core.security import get_current_active_user
from app.models import (
    LoginInfo as User,
    Student,
    ClassRoster,
    FacultyAccess,
    Faculty,
    GraduationStatus,
    Domain,
    ClassDomain,
    ClassOffering,
    GradeClassification,
    ExamResults
)
from app.schemas.reportschema import (
    StudentCompleteReport,
    DomainGrouping,
    AccessibleStudentInfo,
    StudentStatistics,
    ExamDate
)

router = APIRouter()

#Checks if a faculty member has access to a specific student (either by year or month)
def check_faculty_access(faculty_id, student_id, db: Session) -> bool:
    student_year = db.query(GraduationStatus.rosteryear).filter(
        GraduationStatus.studentid == student_id
    ).scalar()
    
    if student_year is None:
        return False
    
    # Returns a true or false
    return db.query(FacultyAccess).filter(
        FacultyAccess.facultyid == faculty_id,
        or_(
            FacultyAccess.studentid == student_id,
            FacultyAccess.rosteryear == student_year
        )
    ).first() is not None

#Generates a student report based on a student's information, total exams, and grades
@router.get("/report", response_model=StudentCompleteReport)
async def generate_report(
    current_user: User = Depends(get_current_active_user),
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

#return all subdomains (classification names) under a given domain
@router.get(
    "/domains/{domain_name}/subdomains",
    response_model=List[str],
    status_code=status.HTTP_200_OK
)
async def get_domain_subdomains(
    domain_name: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> List[str]:
    try:
        decoded_domain = unquote(domain_name)
        
        dom = db.query(Domain).filter(Domain.domainname == decoded_domain).first()
        
        if not dom:
            if '%2F' in decoded_domain:
                decoded_domain = decoded_domain.replace('%2F', '/')
                dom = db.query(Domain).filter(Domain.domainname == decoded_domain).first()
            
            special_domains = {
                "Biostatistics & Epidemiology/Population Health": "Biostatistics & Epidemiology/Population Health",
                "Respiratory & Renal/Urinary Systems": "Respiratory & Renal/Urinary Systems",
                "Behavioral Health & Nervous Systems/Special Senses": "Behavioral Health & Nervous Systems/Special Senses",
                "Blood & Lymphoreticular/Immune Systems": "Blood & Lymphoreticular/Immune Systems"
            }
            
            for original, formatted in special_domains.items():
                if (decoded_domain == original or 
                    decoded_domain.replace('/', ' ') == original.replace('/', ' ') or
                    decoded_domain.replace('%20', ' ') == original):
                    dom = db.query(Domain).filter(Domain.domainname == formatted).first()
                    if dom:
                        break
        
        if not dom:
            raise HTTPException(status_code=404, detail=f"Domain not found: {decoded_domain}")
        
        rows = (
            db.query(GradeClassification.classificationname)
            .join(ClassOffering, GradeClassification.classofferingid == ClassOffering.classofferingid)
            .join(ClassDomain, ClassDomain.classid == ClassOffering.classid)
            .filter(ClassDomain.domainid == dom.domainid)
            .distinct()
            .all()
        )
        return [r[0] for r in rows]
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching subdomains for domain '{domain_name}': {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while fetching subdomains: {str(e)}"
        )
        
@router.get("/faculty_report", response_model=StudentCompleteReport)
async def generate_faculty_report(
    student_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        
        print("Type of current_user.logininfoid:", type(current_user.logininfoid))
        print("Value of current_user.logininfoid:", current_user.logininfoid)
        
        is_student = db.query(Student.studentid).filter(
            Student.logininfoid == current_user.logininfoid
        ).first()
        
        
        if is_student:
            raise HTTPException(
                status_code=403,
                detail="Only faculty members can access this route"
            )
            
        faculty = db.query(Faculty).filter(
            Faculty.logininfoid == current_user.logininfoid
        ).first()
        
        if not faculty:
            raise HTTPException(
                status_code=404,
                detail="No faculty Info Found"
            )
        
        if not check_faculty_access(faculty.facultyid, student_id, db):
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to access this student's report"
            )
        
        studentinfo = generateStudentInformationReport(student_id, db)
        if not studentinfo:
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to acces this student's report"
            )
            
        #Exams and Grades can be empty if they have no exams/grades on records
        exams = generateExamReport(student_id, db) or []
        
        grades = generateGradeReport(student_id, db) or []
        
        try:
            json.dumps(studentinfo)
        except Exception as e:
            print("Failed serializing studentinfo:", e)

        try:
            json.dumps(exams)
        except Exception as e:
            print("Failed serializing exams:", e)

        try:
            json.dumps(grades)
        except Exception as e:
            print("Failed serializing grades:", e)
            
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
        
@router.get("/faculty_class_report", response_model=List[StudentCompleteReport])
async def generate_faculty_class_report(
    rosteryear: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        
        is_student = db.query(Student.studentid).filter(
            Student.logininfoid == current_user.logininfoid
        ).first()
        
        if is_student:
            raise HTTPException(
                status_code=403,
                detail="Only faculty members can access this route"
            )
            
        faculty = db.query(Faculty).filter(
            Faculty.logininfoid == current_user.logininfoid
        ).first()
        
        if not faculty:
            raise HTTPException(
                status_code=404,
                detail="No faculty Info Found"
            )
        
        year_access = db.query(FacultyAccess).filter_by(
            facultyid=faculty.facultyid,
            rosteryear=rosteryear
        ).first()
        
        if not year_access:
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to access this class year"
            )
        
        
        student_ids = db.query(Student.studentid).join(GraduationStatus).filter(
            GraduationStatus.rosteryear == rosteryear
        ).all()
        
        reports = []
        
        for (student_id,) in student_ids:
            studentinfo = generateStudentInformationReport(student_id, db)
            if not studentinfo:
                continue
            #Exams and Grades can be empty if they have no exams/grades on records
            exams = generateExamReport(student_id, db) or []
            grades = generateGradeReport(student_id, db) or []
            
            reports.append(StudentCompleteReport(
                StudentInfo=studentinfo,
                Exams=exams,
                Grades=grades
            ))
            
        return reports
    
    except HTTPException:
        raise
    
    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your request"
        )
        
@router.get("/faculty_access", response_model=List[AccessibleStudentInfo])
async def get_accessible_students(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db) 
):
    try:
        
        is_student = db.query(Student.studentid).filter(
            Student.logininfoid == current_user.logininfoid
        ).first()
        
        if is_student:
            raise HTTPException(
                status_code=403,
                detail="Only faculty members can access this route"
            )
            
        faculty = db.query(Faculty).filter(
            Faculty.logininfoid == current_user.logininfoid
        ).first()
        
        if not faculty:
            raise HTTPException(
                status_code=404,
                detail="No faculty Info Found"
            )
        
        student_access = db.query(
            Student.studentid,
            Student.firstname,
            Student.lastname,
            GraduationStatus.rosteryear
        ).join(
            FacultyAccess, FacultyAccess.studentid == Student.studentid
        ).join(
            GraduationStatus, GraduationStatus.studentid == Student.studentid
        ).filter(
            FacultyAccess.facultyid == faculty.facultyid
        )
        
        year_access = db.query(
            Student.studentid,
            Student.firstname,
            Student.lastname,
            GraduationStatus.rosteryear
        ).join(
            GraduationStatus, GraduationStatus.studentid == Student.studentid
        ).join(
            FacultyAccess, FacultyAccess.rosteryear == GraduationStatus.rosteryear
        ).filter(
            FacultyAccess.facultyid == faculty.facultyid
        )
        
        all_students = student_access.union(year_access).distinct().all()
        
        return [
            AccessibleStudentInfo(
                studentid=s.studentid,
                name=f"{s.lastname}, {s.firstname}",
                rosteryear=s.rosteryear
            )
            for s in all_students
        ]
        
    except HTTPException:
        raise
    
    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your request"
        )
        
@router.get("/statistics-average-report", response_model=StudentStatistics)
async def get_stats_average(
    current_user: User = Depends(get_current_active_user), 
    db: Session = Depends(get_db)
):
    
    try:
        if current_user.issuperuser:
            raise HTTPException(
                status_code=403,
                detail="Admins accounts can not access student review performance route"
            )

        studentid = db.query(Student.studentid).filter(Student.logininfoid == current_user.logininfoid).scalar()
        if not studentid:
            raise HTTPException(
                status_code=404,
                detail="Login Info is not Attached to a Student"
            )
        
        average_statistics = get_student_statistics(db, studentid)
        if not average_statistics:
            raise HTTPException(
                status_code=404,
                detail="Student Average Data Info Not Found"
            )
        
        db_exam_dates = db.query(ExamResults.examresultsid, ExamResults.timestamp, ExamResults.score).filter(
            ExamResults.studentid == studentid, ExamResults.examid == 5
        ).order_by(
            ExamResults.timestamp
        )
        
        exam_dates = [ExamDate(examresultsid=result[0], timestamp=result[1], score=result[2]) for result in db_exam_dates]
        
        average_statistics.exam_dates = exam_dates
        
        return average_statistics
            
    except HTTPException:
        raise
    
    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your request"
        )