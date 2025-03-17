from sqlalchemy import create_engine, inspect, MetaData, text
from sqlalchemy.orm import sessionmaker
from typing import Optional
from app.models import Student, LoginInfo
from .config import settings
from .base import Base
import math
from app.models import (
    Student,
    GraduationStatus,
    Exam,
    ExamResults,
    GradeClassification,
    StudentGrade,
    ClassOffering,
    Domain,
    ClassDomain,
    Faculty
)
from app.schemas.reportschema import StudentReport, ExamReport, GradeReport, DomainReport

engine = create_engine(settings.sync_database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Dependency to get a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def drop_all_tables():
    """Drop all tables in the database."""
    Base.metadata.drop_all(engine)
    print("All tables dropped.")

def create_all_tables():
    """Create all tables defined in models."""
    Base.metadata.create_all(engine)
    print("All tables created.")

def list_tables():
    """List all existing tables."""
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print("Existing tables:", tables)

def get_table_schemas():
    """Return table schemas with columns and types."""
    metadata = MetaData()
    metadata.reflect(bind=engine)
    return {
        table.name: {
            "columns": {col.name: str(col.type) for col in table.columns},
            "primary_key": [key.name for key in table.primary_key]
        }
        for table in metadata.tables.values()
    }

def print_table_schemas():
    """Print formatted table schemas."""
    schemas = get_table_schemas()
    for name, schema in schemas.items():
        print(f"\n=== {name.upper()} ===")
        print(f"Columns ({len(schema['columns'])}) | Primary Key: {', '.join(schema['primary_key']) or 'None'}")
        for col, type_ in schema['columns'].items():
            print(f"  → {col}: {type_}")

def nuclear_clean():
    """Drop all tables regardless of model registration"""
    metadata = MetaData()
    
    with engine.begin() as conn:
        # Reflect all existing tables
        metadata.reflect(bind=engine)
        
        # Drop all known tables first
        metadata.drop_all(bind=engine)
        
        # Drop any remaining tables (including those not in models)
        inspector = inspect(engine)
        remaining = inspector.get_table_names()
        
        if remaining:
            tables = ', '.join([f'"{table}"' for table in remaining])
            conn.execute(text(f'DROP TABLE IF EXISTS {tables} CASCADE'))
            
        # Drop all sequences
        sequences = inspector.get_sequence_names()
        if sequences:
            seqs = ', '.join([f'"{seq}"' for seq in sequences])
            conn.execute(text(f'DROP SEQUENCE IF EXISTS {seqs} CASCADE'))
    
    print("Complete database wipe performed")
    
def link_logininfo(id, logininfoid, usertype):
    db = next(get_db())
    
    #Removes old link
    other_students = db.query(Student).filter(Student.logininfoid == logininfoid).all()
    for students in other_students:
        students.logininfoid = None
        
        
    other_faculty = db.query(Student).filter(Student.logininfoid == logininfoid).all()
    for faculty in other_faculty:
        faculty.logininfoid = None

    db.commit()
    
    if usertype.lower() == "student":
        user = db.query(Student).filter(Student.studentid == id).first()
    elif usertype.lower() == "faculty":
        user = db.query(Faculty).filter(Faculty.facultyid == id).first()
    else:
        raise ValueError("Invalid user type")
    
    if user:
        user.logininfoid = logininfoid
        user.firstname = "LeBron"
        user.lastname = "James"
        db.commit()
        
    db.close()

#Pulls All the Information Relevant to Student 
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

#Pulls All Exams related to a specific student id
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

#Pull all grades, from all blocks (classes) that is related to a student
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

#Special Case: Pulls all grades of a student with the NBME classificaiton attached.
def generateDomainReport(student_id, db, domain_id: Optional[int] = None):
    query = db.query(
        Domain.domainname,
        GradeClassification.classificationname,
        StudentGrade.pointsearned,
        StudentGrade.pointsavailable,
        ClassOffering.classid,
        ClassOffering.datetaught
    ).join(
        GradeClassification, StudentGrade.gradeclassificationid == GradeClassification.gradeclassificationid
    ).join(
        ClassOffering, GradeClassification.classofferingid == ClassOffering.classofferingid
    ).join(
        ClassDomain, ClassDomain.classid == ClassOffering.classid
    ).join(
        Domain, ClassDomain.domainid == Domain.domainid
    ).filter(
        StudentGrade.studentid == student_id
    )
    
    #Handles if domain_id is provided otherwise will provide all
    
    if domain_id:
        query = query.filter(Domain.domainid == domain_id)
    print(str(query.statement))
    data = query.all()
    domain_grades = []
    #Converting to dictionary as there can be multiple records of grades
    for row in data:
        grade_dict = {
            "DomainName": row[0],
            "ClassificationName": row[1],
            "PointsEarned": row[2],
            "PointsAvailable": row[3],
            "ClassID": row[4],
            "DateTaught": row[5]
        }
        pydanticData = DomainReport(**grade_dict)
        domain_grades.append(pydanticData)
    print(data)
    return domain_grades

