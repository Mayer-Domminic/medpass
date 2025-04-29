from sqlalchemy import create_engine, inspect, MetaData, text, func, case, select
from sqlalchemy.orm import sessionmaker
from typing import Optional, List
from .config import settings
from .base import Base
from decimal import Decimal

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
    StudentQuestionPerformance,
    ContentArea,
    ChatContext,
    ChatMessage
)
from app.schemas.reportschema import StudentReport, ExamReport, GradeReport, DomainReport, StudentStatistics
from app.schemas.question import ExamResultsCreate, StudentQuestionPerformanceResponseReview
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
        
def ensure_pgvector_extension():
    db = next(get_db())
    
    try:
        db.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        db.commit()
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

# Gets only existing content area IDs from names
def get_content_areas(db, content_area_names: List[str]):
    """Get only existing content area IDs from names"""
    
    if not content_area_names:
        return {}
    
    content_area = db.query(
        ContentArea.contentareaid,
        ContentArea.contentname
    ).filter(
        ContentArea.contentname.in_(content_area_names)
    ).all()
    
    name_to_id = {}
    
    for data in content_area:
        name_to_id[data[1]] = data[0]
        
    missing_names = set(content_area_names) - set(name_to_id.keys())
    if missing_names:
        print(f"Content area names not found: {', '.join(missing_names)}")
    
    return name_to_id

# Get basic question information by ID
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
        Question.gradeclassificationid,
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
        "GradeClassificationID": question_data[7], 
        "ExamName": question_data[8] if question_data[8] is not None else ""
    }
   
    return question_dict

# Get question and all options by ID
def get_question_with_details(question_id, db):
    
    question_data = db.query(
        Question.questionid,
        Question.examid,
        Question.prompt,
        Question.questionDifficulty,
        Question.imageUrl,
        Question.imageDependent,
        Question.imageDescription,
        Question.gradeclassificationid  
    ).filter(
        Question.questionid == question_id
    ).first()
    
    if not question_data:
        return None
    
    options_data = db.query(
        QuestionOption.optionid,
        QuestionOption.correctanswer,
        QuestionOption.explanation,
        Option.optiondescription
    ).join(
        Option, Option.optionid == QuestionOption.optionid
    ).filter(
        QuestionOption.questionid == question_id
    ).all()
    
    content_area_data = db.query(
        ContentArea.contentareaid,
        ContentArea.contentname,
        ContentArea.description,
        ContentArea.discipline
    ).join(
        QuestionClassification, ContentArea.contentareaid == QuestionClassification.contentareaid
    ).filter(
        QuestionClassification.questionid == question_id
    ).all()
    
    #add grade classification data if it exists
    grade_classification_data = None
    if question_data[7]:  # If gradeclassificationid is not None
        grade_classification_data = db.query(
            GradeClassification.gradeclassificationid,
            GradeClassification.classificationname,
            GradeClassification.unittype,
            ClassOffering.classofferingid
        ).outerjoin(
            ClassOffering, GradeClassification.classofferingid == ClassOffering.classofferingid
        ).filter(
            GradeClassification.gradeclassificationid == question_data[7]
        ).first()
    
    question_dict = {
        "QuestionID": question_data[0],
        "ExamID": question_data[1],
        "Prompt": question_data[2],
        "QuestionDifficulty": question_data[3],
        "ImageUrl": question_data[4],
        "ImageDependent": question_data[5],
        "ImageDescription": question_data[6],
        "GradeClassificationID": question_data[7]  
    }
    
    options = []
    for option in options_data:
        options.append({
            "OptionID": option[0],
            "CorrectAnswer": option[1],
            "Explanation": option[2],
            "OptionDescription": option[3]
        })
        
    content_areas = []
    for area in content_area_data:
        content_areas.append({
            "ContentAreaID": area[0],
            "ContentName": area[1],
            "Description": area[2],
            "Discipline": area[3]
        })
    
    grade_classification = None
    if grade_classification_data:
        grade_classification = {
            "GradeClassificationID": grade_classification_data[0],
            "ClassificationName": grade_classification_data[1],
            "UnitType": grade_classification_data[2],
            "ClassOfferingID": grade_classification_data[3]
        }
        
    result = {
        "Question": question_dict,
        "Options": options,
        "ContentAreas": content_areas,
        "GradeClassification": grade_classification  
    }
    
    return result

# Get all exam results and associated student question performances for a student
def get_historical_performance(db, student_id=None, exam_id=None, skip=0, limit=100):
    """
    Get exam results with their associated student question performances.
    
    """
    # Start with a base query for exam results
    query = db.query(ExamResults)
    
    # Apply filters if provided
    if student_id:
        query = query.filter(ExamResults.studentid == student_id)
    if exam_id:
        query = query.filter(ExamResults.examid == exam_id)

    # Order by timestamp desc, then by examresultsid desc if timestamp is NULL
    query = query.order_by(
        ExamResults.timestamp.desc().nulls_last(),
        ExamResults.examresultsid.desc()
    )
        
    # Apply pagination
    query = query.offset(skip).limit(limit)
    
    # Execute the query to get all exam results
    exam_results = query.all()
    
    if not exam_results:
        return []
    
    # Build the response
    result = []
    
    for er in exam_results:
        # Get student name
        student = db.query(Student).filter(Student.studentid == er.studentid).first()
        student_name = f"{student.firstname} {student.lastname}" if student else "Unknown"
        
        # Get exam name
        exam = db.query(Exam).filter(Exam.examid == er.examid).first()
        exam_name = exam.examname if exam else "Unknown"
        
        # Get performances for this exam result
        performances = db.query(
            StudentQuestionPerformance
        ).outerjoin(
            Question, StudentQuestionPerformance.questionid == Question.questionid
        ).filter(
            StudentQuestionPerformance.examresultid == er.examresultsid
        ).all()
        
        # Format performances
        performance_list = []
        for perf in performances:
            # Get question details
            question = db.query(Question).filter(
                Question.questionid == perf.questionid
            ).first()
            
            performance_list.append({
                "StudentQuestionPerformanceID": perf.studentquestionperformanceid,
                "ExamResultsID": perf.examresultid,
                "QuestionID": perf.questionid,
                "Result": perf.result,
                "Confidence": perf.confidence,
                "QuestionPrompt": question.prompt if question else None,
                "QuestionDifficulty": question.questionDifficulty if question else None
            })
        
        # Add to result
        result.append({
            "ExamResults": {
                "ExamResultsID": er.examresultsid,
                "StudentID": er.studentid,
                "StudentName": student_name,
                "ExamID": er.examid,
                "ExamName": exam_name,
                "Score": er.score,
                "PassOrFail": er.passorfail,
                "Timestamp": er.timestamp,
                "ClerkshipID": er.clerkshipid
            },
            "Performances": performance_list
        })
    
    return result

#Pre Processing Step Before Embedding Converts a question to a string takes in a dictionary found in get_question_with_details
def convert_question_to_text(question_response: dict) -> str:
    
    question = question_response['Question']
    option = question_response['Options']
    content_areas = question_response['ContentAreas']
    grade_classification = question_response.get('GradeClassification')
    
    prompt = question['Prompt']
    
    # This is for a way to format our options for context in a A, B, C, D format (chr 65 is a + 1 is each letter after)
    option_lines = [
        f"{chr(65 + i)}. {opt['OptionDescription']}" for i, opt in enumerate(option)
    ]
    
    difficulty = question.get('QuestionDifficulty', 'Unknown')
    content_names = [ca["ContentName"] for ca in content_areas]
    # If multiple content areas combine them into a single string
    content_area_line = ', '.join(content_names) if content_names else "Uncategorized"
    
    context_lines = [
        f"Difficulty: {difficulty}",
        f"Content Areas: {content_area_line}"
    ]
    
    # Add grade classification if it exists
    if grade_classification:
        context_lines.append(f"Grade Classification: {grade_classification['ClassificationName']} ({grade_classification['UnitType']})")
    
    context_lines.append("") # Empty line before prompt
    
    text = "\n".join(context_lines + [prompt] + option_lines)
    
    return text

def generate_question_embedding(question_id, db):
    question_data = get_question_with_details(question_id, db)
    if not question_data:
        return None
    question_text = convert_question_to_text(question_data)
    # Use Gemini embedding
    embedding = embed_text(question_text)
    question = db.query(Question).filter(Question.questionid == question_id).first()
    if question:
        question.embedding = embedding
        db.commit()
        
# Chat Messages Embedding

def get_chat_context(chat_context_id, db):
    
    context_data = db.query(
        ChatContext.contextid,
        ChatContext.title,
        ChatContext.content,
        ChatContext.importancescore,
        ChatContext.createdat,
        ChatContext.updatedat,
        ChatContext.chatmetadata,
        ChatContext.conversationid,
        ChatContext.createdby
    ).filter(ChatContext.contextid == chat_context_id).first()

    if not context_data:
        return None

    return {
        "ContextID": context_data[0],
        "Title": context_data[1],
        "Content": context_data[2],
        "ImportanceScore": context_data[3],
        "CreatedAt": context_data[4],
        "UpdatedAt": context_data[5],
        "Metadata": context_data[6],
        "ConversationID": context_data[7],
        "CreatedBy": context_data[8]
    }
    
def get_chat_message(chat_message_id, db):
    message_data = db.query(
        ChatMessage.messageid,
        ChatMessage.conversationid,
        ChatMessage.sendertype,
        ChatMessage.content,
        ChatMessage.timestamp,
        ChatMessage.tokensinput,
        ChatMessage.tokensoutput,
        ChatMessage.messagecost,
        ChatMessage.messagemetadata
    ).filter(ChatMessage.messageid == chat_message_id).first()

    if not message_data:
        return None

    return {
        "MessageID": message_data[0],
        "ConversationID": message_data[1],
        "SenderType": message_data[2],
        "Content": message_data[3],
        "Timestamp": message_data[4],
        "TokensInput": message_data[5],
        "TokensOutput": message_data[6],
        "MessageCost": message_data[7],
        "Metadata": message_data[8]
    }
    
def get_latest_student_review_performance_data(db, exam_id, student_id):
    
    questions_performance = db.query(
        StudentQuestionPerformance.questionid,
        Question.prompt,
        StudentQuestionPerformance.result,
        StudentQuestionPerformance.confidence,
        ExamResults.timestamp
    ).join(
        Question, StudentQuestionPerformance.questionid == Question.questionid
    ).join(
        ExamResults, StudentQuestionPerformance.examresultid == ExamResults.examresultsid
    ).filter(
        ExamResults.examid == exam_id, ExamResults.studentid == student_id
    ).distinct(
        StudentQuestionPerformance.questionid
    ).order_by(
        StudentQuestionPerformance.questionid, ExamResults.timestamp.desc()
    ).all()

    performance_data = []
    for question in questions_performance:
        performance_data.append(StudentQuestionPerformanceResponseReview(
            questionid = question[0],
            prompt = question[1],
            result = question[2],
            confidence  = question[3],
            timestamp = question[4]
        ))
        
    return performance_data


def get_student_statistics(db, student_id):
    query = db.query(
        func.count(func.distinct(ExamResults.examresultsid)).label('total_exams_taken'),
        func.round(func.avg(ExamResults.score), 2).label('average_score'),
        func.count(StudentQuestionPerformance.studentquestionperformanceid).label('total_questions_answered'),
        func.round(100.0 * func.sum(case((StudentQuestionPerformance.result == True, 1), else_=0)) / func.count('*'), 2).label('correct_answer_percentage')
    ).join(
        StudentQuestionPerformance, StudentQuestionPerformance.examresultid == ExamResults.examresultsid
    ).filter(
        ExamResults.studentid == student_id
    )
    
    result = query.first()
    
    final_result = StudentStatistics(
        total_exams_taken=result[0],
        average_score=result[1],
        total_questions_answered=result[2],
        correct_answer_percentage=result[3]
    )
    
    return final_result