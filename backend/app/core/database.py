from sqlalchemy import create_engine, inspect, MetaData, text
from sqlalchemy.orm import sessionmaker
from typing import Optional, List
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
    Faculty,
    FacultyAccess,
    Question,
    QuestionOption,
    QuestionClassification,
    Option,
    ContentArea
)
from app.schemas.reportschema import StudentReport, ExamReport, GradeReport, DomainReport
from app.schemas.question import (QuestionResponse)
from app.schemas.pydantic_base_models import user_schemas

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

#Updates Faculty Access
def update_faculty_access(id, db, year: Optional[int] = None, students_ids: Optional[List[int]] = None):
    
    try:
        faculty = db.query(Faculty).filter(Faculty.facultyid == id).first()
        
        if faculty is None:
            raise ValueError(f"Error: No Faculty Member with ID {id} Found")
        
        if year:
            db_access = FacultyAccess(
                facultyid = id,
                rosteryear = year
            )
            db.add(db_access)
            
        if students_ids:
            for student in students_ids:
                db_access = FacultyAccess(
                    facultyid = id,
                    studentid = student
                )
                db.add(db_access)
        
        db.commit()
        return True, "Access Updated Successfully"
    except ValueError as e:
        db.rollback()
        return False, str(e)
    except Exception as e:
        db.rollback()
        return False, f"Database Error: {str(e)}"

def get_content_areas(db, content_area_names: List[str]):
    """Get only existing content area IDs from names"""
    content_area_ids = []
    
    for name in content_area_names:
        # Check if content area exists
        content_area = db.query(ContentArea).filter(ContentArea.contentname == name).first()
        
        if content_area:
            content_area_ids.append(content_area.contentareaid)
    
    return content_area_ids

def get_question(db, question_id: int):
    """Get basic question information by ID"""
    question_data = db.query(
        Question.questionid,
        Question.prompt,
        Question.questionDifficulty,
        Question.imageUrl,
        Question.imageDependent,
        Question.imageDescription,
        Question.examid,
        Exam.examname
    ).outerjoin(
        Exam, Question.examid == Exam.examid
    ).filter(
        Question.questionid == question_id
    ).first()
   
    if not question_data:
        return None
   
    question_dict = {
        "QuestionID": question_data[0],
        "Prompt": question_data[1],
        "QuestionDifficulty": question_data[2],
        "ImageUrl": question_data[3],
        "ImageDependent": question_data[4],
        "ImageDescription": question_data[5],
        "ExamID": question_data[6],
        "ExamName": question_data[7] if question_data[7] is not None else ""
    }
   
    return question_dict

def get_question_with_details(db, question_id: int):
    """
    Get detailed question information by ID including options and content areas
    """
    # Get the question
    db_question = db.query(Question).filter(Question.questionid == question_id).first()
    
    if not db_question:
        return None
    
    # Get question options with their correctness
    question_options = db.query(
        QuestionOption, Option
    ).join(
        Option, Option.optionid == QuestionOption.optionid
    ).filter(
        QuestionOption.questionid == question_id
    ).all()
    
    options = []
    for q_option, option in question_options:
        options.append({
            "optionId": option.optionid,
            "description": option.optiondescription,
            "isCorrect": q_option.correctanswer,
            "explanation": q_option.explanation
        })
    
    # Get content areas
    content_areas = db.query(
        ContentArea
    ).join(
        QuestionClassification, ContentArea.contentareaid == QuestionClassification.contentareaid
    ).filter(
        QuestionClassification.questionid == question_id
    ).all()
    
    content_area_list = [{
        "contentAreaId": area.contentareaid,
        "name": area.contentname,
        "discipline": area.discipline
    } for area in content_areas]
    
    # Create response
    response = {
        "question": {
            "QuestionID": db_question.questionid,
            "ExamID": db_question.examid,
            "Prompt": db_question.prompt,
            "QuestionDifficulty": db_question.questionDifficulty,
            "ImageUrl": db_question.imageUrl,
            "ImageDependent": db_question.imageDependent,
            "ImageDescription": db_question.imageDescription,
            "ExamName": db_question.exam.examname if db_question.exam else None
        },
        "options": options,
        "contentAreas": content_area_list
    }
    
    return response

#Pre Processing Step Before Embedding Converts a question to a string takes in a dictionary found in get_question_with_details
def convert_question_to_text(question_response: dict) -> str:
    
    question = question_response['Question']
    option = question_response['Options']
    content_areas = question_response['ContentAreas']
    
    prompt = question['Prompt']
    
    # This is for a way to format our options for context in a A, B, C, D format (chr 65 is a + 1 is each letter after)
    option_lines = [
        f"{chr(65 + i)}. {opt['OptionDescription']}" for i, opt in enumerate(option)
    ]
    
    difficulty = question.get('QuestionDifficulty', 'Unknown')
    content_names = [ca["ContentName"] for ca in content_areas]
    # If multiple content areas combine them into a single string
    content_area_line = ', '.join(content_names) if content_names else "Uncatergorized"
    
    context_lines = [
        f"Difficulty: {difficulty}",
        f"Content Areas: {content_area_line}",
        ""
    ]
    
    text = "\n".join(context_lines + [prompt] + option_lines)
    
    return text

def generate_question_embedding(question_id, db):
    
    question_data = get_question_with_details(question_id, db)
    
    if not question_data:
        return None
    
    question_text = convert_question_to_text(question_data)
    embedding = model.encode(question_text).tolist()
    
    question = db.query(Question).filter(Question.questionid == question_id).first()
    if question:
        question.embedding = embedding
        db.commit()