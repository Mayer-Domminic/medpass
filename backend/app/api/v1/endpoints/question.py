from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from datetime import datetime

from app.core.security import get_current_active_user
from app.models import (
    LoginInfo as User
)
from app.core.database import get_db, get_question, get_question_with_details, get_historical_performance, generate_question_embedding, get_latest_student_review_performance_data
from app.schemas.question import (
    QuestionCreate,
    QuestionOptionCreate,
    QuestionResponse, 
    BulkQuestionResponse,
    QuestionData,
    ExamResultsCreate,
    StudentQuestionPerformanceCreate,
    ExamResultsWithPerformancesCreate,
    ExamResultsResponse,
    StudentQuestionPerformanceResponse,
    BulkExamResultsResponse,
    BulkStudentQuestionPerformanceResponse,
    ExamResultsWithPerformancesResponse,
    StudentQuestionPerformanceResponseReview
)
from app.models.exam_models import Question, ContentArea, Option, QuestionOption, QuestionClassification
from app.models.result_models import ExamResults, StudentQuestionPerformance, GradeClassification
from app.models import Student, Exam, Clerkship

router = APIRouter()

#-----------------------------------------------------------------------------
# Helper Functions
#-----------------------------------------------------------------------------

async def get_content_areas(db: Session, content_area_names: List[str]):
    """Get only existing content area IDs from names"""
    content_area_ids = []
    
    for name in content_area_names:
        # Check if content area exists
        content_area = db.query(ContentArea).filter(ContentArea.contentname == name).first()
        
        if content_area:
            content_area_ids.append(content_area.contentareaid)
    
    return content_area_ids

async def create_content_areas(db, content_area_names):
    """Create content areas if they don't exist and return their IDs"""
    content_area_ids = []
    
    for name in content_area_names:
        # First check if the content area already exists
        existing_content_area = db.query(ContentArea).filter(ContentArea.contentname == name).first()
        
        if existing_content_area:
            # Use the existing content area
            content_area_ids.append(existing_content_area.contentareaid)
        else:
            # Get the maximum ID currently in the table
            max_id_result = db.query(func.max(ContentArea.contentareaid)).scalar()
            next_id = 1 if max_id_result is None else max_id_result + 1
            
            # Create a new content area with an ID greater than any existing ID
            new_content_area = ContentArea(
                contentareaid=next_id,
                contentname=name,
                description=None,
                discipline=None
            )
            db.add(new_content_area)
            db.flush()  # Get the generated ID
            content_area_ids.append(new_content_area.contentareaid)
    
    return content_area_ids

async def create_question_options(db: Session, question_id: int, options_data):
    """Create options and question-option relationships"""
    for option_data in options_data:
        # Get the maximum option ID currently in the table
        max_option_id = db.query(func.max(Option.optionid)).scalar()
        next_option_id = 1 if max_option_id is None else max_option_id + 1
        
        # Create option with a unique ID
        option = Option(
            optionid=next_option_id,
            optiondescription=option_data.OptionDescription
        )
        db.add(option)
        db.flush()  # Get the option ID
        
        # Get the maximum question-option ID currently in the table
        max_qo_id = db.query(func.max(QuestionOption.questionoptionid)).scalar()
        next_qo_id = 1 if max_qo_id is None else max_qo_id + 1
        
        # Create question-option relationship with explanation included
        question_option = QuestionOption(
            questionoptionid=next_qo_id,
            questionid=question_id,
            optionid=option.optionid,
            correctanswer=option_data.CorrectAnswer,
            explanation=option_data.Explanation if option_data.CorrectAnswer else None
        )
        db.add(question_option)

async def create_question_classifications(db: Session, question_id: int, content_area_ids: List[int]):
    """Create question-content area classifications"""
    for content_area_id in content_area_ids:
        # Check if this classification already exists
        existing = db.query(QuestionClassification).filter(
            QuestionClassification.questionid == question_id,
            QuestionClassification.contentareaid == content_area_id
        ).first()
        
        if not existing:
            # Get the maximum classification ID currently in the table
            max_class_id = db.query(func.max(QuestionClassification.questionclassid)).scalar()
            next_class_id = 1 if max_class_id is None else max_class_id + 1
            
            # Create a new classification with a unique ID
            classification = QuestionClassification(
                questionclassid=next_class_id,
                questionid=question_id,
                contentareaid=content_area_id
            )
            db.add(classification)

#-----------------------------------------------------------------------------
# GET Endpoints - Question Retrieval
#-----------------------------------------------------------------------------

@router.get("/{question_id}", response_model=dict)
async def get_question_details(
    question_id: int,
    db: Session = Depends(get_db)
):
    """
    Get detailed question information by ID including options and content areas
    """
    # Use the existing database function
    result = get_question_with_details(question_id, db)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Question with ID {question_id} not found"
        )
    
    return result

@router.get("/{question_id}/basic", response_model=QuestionResponse)
async def get_question_basic(
    question_id: int,
    db: Session = Depends(get_db)
):
    """Get basic question information by ID"""
    # Use the database function
    question_dict = get_question(db, question_id)
    
    if not question_dict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Question with ID {question_id} not found"
        )
    
    # Return the question data directly, assuming QuestionResponse matches the keys in question_dict
    return QuestionResponse(**question_dict)

#-----------------------------------------------------------------------------
# POST Endpoints - Question Creation
#-----------------------------------------------------------------------------

@router.post("/", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_question(
    question_data: QuestionCreate,
    db: Session = Depends(get_db)
):
    """Create a new question with options and grade classification"""
    try:
        max_question_id = db.query(func.max(Question.questionid)).scalar()
        next_question_id = 1 if max_question_id is None else max_question_id + 1

        # Check if GradeClassificationID exists if provided
        if question_data.GradeClassificationID:
            grade_class = db.query(GradeClassification).filter(
                GradeClassification.gradeclassificationid == question_data.GradeClassificationID
            ).first()
            if not grade_class:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Grade Classification with ID {question_data.GradeClassificationID} not found"
                )

        # Create the question
        db_question = Question(
            questionid=next_question_id,
            examid=question_data.ExamID,
            prompt=question_data.Prompt,
            questionDifficulty=question_data.QuestionDifficulty,
            imageUrl=question_data.ImageUrl,
            imageDependent=question_data.ImageDependent,
            imageDescription=question_data.ImageDescription,
            gradeclassificationid=question_data.GradeClassificationID
        )
        db.add(db_question)
        db.flush()  # Get the question ID without committing
        
        generate_question_embedding(db_question.questionid, db)  # generate embedding for the question
        
        # Create options and question-option relationships
        await create_question_options(db, db_question.questionid, question_data.Options)
        
        # Commit all changes
        db.commit()
        
        # Map SQLAlchemy model to Pydantic response model
        return QuestionResponse(
            QuestionID=db_question.questionid,
            ExamID=db_question.examid,
            Prompt=db_question.prompt,
            QuestionDifficulty=db_question.questionDifficulty,
            ImageUrl=db_question.imageUrl,
            ImageDependent=db_question.imageDependent,
            ImageDescription=db_question.imageDescription,
            GradeClassificationID=db_question.gradeclassificationid,
            ExamName=None
        )
    
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database integrity error: {str(e)}"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )

@router.post("/bulk", response_model=BulkQuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_questions_bulk(
    questions_data: List[QuestionCreate],
    db: Session = Depends(get_db)
):
    """Create multiple questions in a single request"""
    created_questions = []
   
    try:
        for question_data in questions_data:
            # Check if GradeClassificationID exists if provided
            if question_data.GradeClassificationID:
                grade_class = db.query(GradeClassification).filter(
                    GradeClassification.gradeclassificationid == question_data.GradeClassificationID
                ).first()
                if not grade_class:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Grade Classification with ID {question_data.GradeClassificationID} not found"
                    )
                   
            # Create the question
            db_question = Question(
                examid=question_data.ExamID,
                prompt=question_data.Prompt,
                questionDifficulty=question_data.QuestionDifficulty,
                imageUrl=question_data.ImageUrl,
                imageDependent=question_data.ImageDependent,
                imageDescription=question_data.ImageDescription,
                gradeclassificationid=question_data.GradeClassificationID
            )
            db.add(db_question)
            db.flush()  # Get the question ID without committing
            
            # Create options and question-option relationships
            await create_question_options(db, db_question.questionid, question_data.Options)
           
            # Map SQLAlchemy model to Pydantic response model
            created_questions.append(QuestionResponse(
                QuestionID=db_question.questionid,
                ExamID=db_question.examid,
                Prompt=db_question.prompt,
                QuestionDifficulty=db_question.questionDifficulty,
                ImageUrl=db_question.imageUrl,
                ImageDependent=db_question.imageDependent,
                ImageDescription=db_question.imageDescription,
                GradeClassificationID=db_question.gradeclassificationid,
                ExamName=None
            ))
       
        # Commit all changes
        db.commit()
       
        return {
            "Questions": created_questions,
            "TotalCreated": len(created_questions)
        }
   
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database integrity error: {str(e)}"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )

@router.post("/from-data", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_question_from_data(
    question_data: QuestionData,
    exam_id: Optional[int] = None,
    grade_classification_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Create a question from the QuestionData format (which matches your interface)
    This allows converting from your front-end format to the database format
    """
    try:
        # Check if GradeClassificationID exists if provided
        if grade_classification_id:
            grade_class = db.query(GradeClassification).filter(
                GradeClassification.gradeclassificationid == grade_classification_id
            ).first()
            if not grade_class:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Grade Classification with ID {grade_classification_id} not found"
                )
                
        # Extract options data from the Answers dictionary
        options_data = []
        for option_key, option_text in question_data.Answers.items():
            is_correct = option_key == question_data.CorrectOption
            
            option = {
                "OptionDescription": option_text,
                "CorrectAnswer": is_correct,
                "Explanation": question_data.Explanation if is_correct else None
            }
            options_data.append(option)
        
        max_question_id = db.query(func.max(Question.questionid)).scalar()
        next_question_id = 1 if max_question_id is None else max_question_id + 1

        # Create a QuestionCreate object
        db_question_data = QuestionCreate(
            ExamID=exam_id,
            Prompt=question_data.Question,
            ImageUrl=question_data.ImageUrl,
            ImageDependent=question_data.ImageDependent,
            ImageDescription=question_data.ImageDescription,
            Options=[QuestionOptionCreate(**opt) for opt in options_data],
            ContentAreas=[],  # Empty list since we're removing content areas
            GradeClassificationID=grade_classification_id
        )
        
        # Create the question
        db_question = Question(
            questionid=next_question_id,
            examid=db_question_data.ExamID,
            prompt=db_question_data.Prompt,
            imageUrl=db_question_data.ImageUrl,
            imageDependent=db_question_data.ImageDependent,
            imageDescription=db_question_data.ImageDescription,
            gradeclassificationid=db_question_data.GradeClassificationID
        )
        db.add(db_question)
        db.flush()  # Get the question ID without committing

        generate_question_embedding(db_question.questionid, db)  # Generate embedding for the question
        
        # Create options and question-option relationships
        await create_question_options(db, db_question.questionid, db_question_data.Options)
        
        # Commit all changes
        db.commit()
        
        # Map SQLAlchemy model to Pydantic response model
        return QuestionResponse(
            QuestionID=db_question.questionid,
            ExamID=db_question.examid,
            Prompt=db_question.prompt,
            QuestionDifficulty=db_question.questionDifficulty,
            ImageUrl=db_question.imageUrl,
            ImageDependent=db_question.imageDependent,
            ImageDescription=db_question.imageDescription,
            GradeClassificationID=db_question.gradeclassificationid,
            ExamName=None
        )
    
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database integrity error: {str(e)}"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )
#-----------------------------------------------------------------------------
# Exam Results Endpoints
#-----------------------------------------------------------------------------

@router.post("/exam-results/", response_model=ExamResultsResponse, status_code=status.HTTP_201_CREATED)
async def create_exam_result_endpoint(
    exam_data: ExamResultsCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new exam result record for a student
    """
    try:
        # Verify student exists
        student = db.query(Student).filter(Student.studentid == exam_data.StudentID).first()
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student with ID {exam_data.StudentID} not found"
            )
        
        # Verify exam exists
        exam = db.query(Exam).filter(Exam.examid == exam_data.ExamID).first()
        if not exam:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Exam with ID {exam_data.ExamID} not found"
            )
        
        # Only verify clerkship if provided and not None
        if exam_data.ClerkshipID is not None:
            clerkship = db.query(Clerkship).filter(Clerkship.clerkshipid == exam_data.ClerkshipID).first()
            if not clerkship:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Clerkship with ID {exam_data.ClerkshipID} not found"
                )
        
        # If pass_or_fail is not provided, determine based on exam pass score
        pass_or_fail = exam_data.PassOrFail
        if pass_or_fail is None and exam.passscore is not None:
            pass_or_fail = exam_data.Score >= exam.passscore
        
        # Use current time if timestamp not provided
        timestamp = exam_data.Timestamp or datetime.now()
        
        exam_result = ExamResults(
            studentid=exam_data.StudentID,
            examid=exam_data.ExamID,
            clerkshipid=exam_data.ClerkshipID,  # This can be None
            score=exam_data.Score,
            passorfail=pass_or_fail,
            timestamp=timestamp
        )
        
        db.add(exam_result)
        db.commit()
        db.refresh(exam_result)
        
        return ExamResultsResponse(
            ExamResultsID=exam_result.examresultsid,
            StudentID=exam_result.studentid,
            ExamID=exam_result.examid,
            Score=exam_result.score,
            PassOrFail=exam_result.passorfail,
            Timestamp=exam_result.timestamp,
            ClerkshipID=exam_result.clerkshipid  # This can be None in the response
        )
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database integrity error: {str(e)}"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )

@router.post("/exam-results/bulk/", response_model=BulkExamResultsResponse, status_code=status.HTTP_201_CREATED)
async def create_exam_results_bulk(
    exam_results_data: List[ExamResultsCreate],
    db: Session = Depends(get_db)
):
    """
    Create multiple exam results in a single request
    """
    created_exam_results = []
    failed_exam_results = []
    
    try:
        for data in exam_results_data:
            try:
                # Verify student exists
                student = db.query(Student).filter(Student.studentid == data.StudentID).first()
                if not student:
                    failed_exam_results.append({
                        "data": data.dict(),
                        "error": f"Student with ID {data.StudentID} not found"
                    })
                    continue
                
                # Verify exam exists
                exam = db.query(Exam).filter(Exam.examid == data.ExamID).first()
                if not exam:
                    failed_exam_results.append({
                        "data": data.dict(),
                        "error": f"Exam with ID {data.ExamID} not found"
                    })
                    continue
                
                # Only verify clerkship if provided and not None
                if data.ClerkshipID is not None:
                    clerkship = db.query(Clerkship).filter(Clerkship.clerkshipid == data.ClerkshipID).first()
                    if not clerkship:
                        failed_exam_results.append({
                            "data": data.dict(),
                            "error": f"Clerkship with ID {data.ClerkshipID} not found"
                        })
                        continue
                
                # If pass_or_fail is not provided, determine based on exam pass score
                pass_or_fail = data.PassOrFail
                if pass_or_fail is None and exam.passscore is not None:
                    pass_or_fail = data.Score >= exam.passscore
                
                # Use current time if timestamp not provided
                timestamp = data.Timestamp or datetime.now()
                
                # Create and add exam result
                exam_result = ExamResults(
                    studentid=data.StudentID,
                    examid=data.ExamID,
                    clerkshipid=data.ClerkshipID,  
                    score=data.Score,
                    passorfail=pass_or_fail,
                    timestamp=timestamp
                )
                
                db.add(exam_result)
                db.flush()
                
                created_exam_results.append(ExamResultsResponse(
                    ExamResultsID=exam_result.examresultsid,
                    StudentID=exam_result.studentid,
                    ExamID=exam_result.examid,
                    Score=exam_result.score,
                    PassOrFail=exam_result.passorfail,
                    Timestamp=exam_result.timestamp,
                    ClerkshipID=exam_result.clerkshipid  
                ))
            
            except Exception as e:
                failed_exam_results.append({
                    "data": data.dict(),
                    "error": str(e)
                })
        
        # Commit all successful changes
        if created_exam_results:
            db.commit()
            
        return BulkExamResultsResponse(
            TotalCreated=len(created_exam_results),
            CreatedExamResults=created_exam_results,
            TotalFailed=len(failed_exam_results),
            FailedExamResults=failed_exam_results
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )


#-----------------------------------------------------------------------------
# Student Question Performance Endpoints
#-----------------------------------------------------------------------------

@router.post("/question-performance/", response_model=StudentQuestionPerformanceResponse, status_code=status.HTTP_201_CREATED)
async def create_question_performance_endpoint(
    exam_results_id: int,
    performance_data: StudentQuestionPerformanceCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new student question performance record
    """
    try:
        # Verify exam result exists
        exam_result = db.query(ExamResults).filter(ExamResults.examresultsid == exam_results_id).first()
        if not exam_result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Exam result with ID {exam_results_id} not found"
            )
        
        # Verify question exists
        question = db.query(Question).filter(Question.questionid == performance_data.QuestionID).first()
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Question with ID {performance_data.QuestionID} not found"
            )
        
        # Create performance record
        performance = StudentQuestionPerformance(
            examresultid=exam_results_id,
            questionid=performance_data.QuestionID,
            result=performance_data.Result,
            confidence=performance_data.Confidence
        )
        
        db.add(performance)
        db.commit()
        db.refresh(performance)
        
        return StudentQuestionPerformanceResponse(
            StudentQuestionPerformanceID=performance.studentquestionperformanceid,
            ExamResultsID=performance.examresultid,
            QuestionID=performance.questionid,
            Result=performance.result,
            Confidence=performance.confidence
        )
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database integrity error: {str(e)}"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )

@router.post("/question-performance/bulk/", response_model=BulkStudentQuestionPerformanceResponse, status_code=status.HTTP_201_CREATED)
async def create_question_performances_bulk(
    exam_results_id: int,
    performances_data: List[StudentQuestionPerformanceCreate],
    db: Session = Depends(get_db)
):
    """
    Create multiple question performance records for a single exam result
    """
    # First verify exam result exists
    exam_result = db.query(ExamResults).filter(ExamResults.examresultsid == exam_results_id).first()
    if not exam_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exam result with ID {exam_results_id} not found"
        )
    
    created_performances = []
    failed_performances = []
    
    try:
        for data in performances_data:
            try:
                # Verify question exists
                question = db.query(Question).filter(Question.questionid == data.QuestionID).first()
                if not question:
                    failed_performances.append({
                        "data": data.dict(),
                        "error": f"Question with ID {data.QuestionID} not found"
                    })
                    continue
                
                # Create performance record
                performance = StudentQuestionPerformance(
                    examresultid=exam_results_id,
                    questionid=data.QuestionID,
                    result=data.Result,
                    confidence=data.Confidence
                )
                
                db.add(performance)
                db.flush()
                
                created_performances.append(StudentQuestionPerformanceResponse(
                    StudentQuestionPerformanceID=performance.studentquestionperformanceid,
                    ExamResultsID=performance.examresultid,
                    QuestionID=performance.questionid,
                    Result=performance.result,
                    Confidence=performance.confidence
                ))
            
            except Exception as e:
                failed_performances.append({
                    "data": data.dict(),
                    "error": str(e)
                })
        
        # Commit all successful changes
        if created_performances:
            db.commit()
            
        return BulkStudentQuestionPerformanceResponse(
            ExamResultsID=exam_results_id,
            TotalCreated=len(created_performances),
            CreatedPerformances=created_performances,
            TotalFailed=len(failed_performances),
            FailedPerformances=failed_performances
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )

@router.post("/exam-results-with-performance/", response_model=ExamResultsWithPerformancesResponse, status_code=status.HTTP_201_CREATED)
async def create_exam_result_with_performances(
    data: ExamResultsWithPerformancesCreate,
    db: Session = Depends(get_db)
):
    """
    Create an exam result and its related question performance records in one transaction
    """
    try:
        # Verify student exists
        student = db.query(Student).filter(Student.studentid == data.StudentID).first()
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student with ID {data.StudentID} not found"
            )
        
        # Verify exam exists
        exam = db.query(Exam).filter(Exam.examid == data.ExamID).first()
        if not exam:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Exam with ID {data.ExamID} not found"
            )
        
        # Verify clerkship if provided
        if data.ClerkshipID:
            clerkship = db.query(Clerkship).filter(Clerkship.clerkshipid == data.ClerkshipID).first()
            if not clerkship:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Clerkship with ID {data.ClerkshipID} not found"
                )
        
        # If pass_or_fail is not provided, determine based on exam pass score
        pass_or_fail = data.PassOrFail
        if pass_or_fail is None and exam.passscore is not None:
            pass_or_fail = data.Score >= exam.passscore
        
        # Use current time if timestamp not provided
        timestamp = data.Timestamp or datetime.now()
        
        # Create exam result
        exam_result = ExamResults(
            studentid=data.StudentID,
            examid=data.ExamID,
            clerkshipid=data.ClerkshipID,
            score=data.Score,
            passorfail=pass_or_fail,
            timestamp=timestamp
        )
        
        db.add(exam_result)
        db.flush()  # Get the exam result ID
        
        # Create performance records
        created_performances = []
        failed_performances = []
        
        for performance_data in data.Performances:
            try:
                # Verify question exists
                question = db.query(Question).filter(Question.questionid == performance_data.QuestionID).first()
                if not question:
                    failed_performances.append({
                        "data": performance_data.dict(),
                        "error": f"Question with ID {performance_data.QuestionID} not found"
                    })
                    continue
                
                # Create performance record
                performance = StudentQuestionPerformance(
                    examresultid=exam_result.examresultsid,
                    questionid=performance_data.QuestionID,
                    result=performance_data.Result,
                    confidence=performance_data.Confidence
                )
                
                db.add(performance)
                db.flush()
                
                created_performances.append(StudentQuestionPerformanceResponse(
                    StudentQuestionPerformanceID=performance.studentquestionperformanceid,
                    ExamResultsID=performance.examresultid,
                    QuestionID=performance.questionid,
                    Result=performance.result,
                    Confidence=performance.confidence
                ))
            
            except Exception as e:
                failed_performances.append({
                    "data": performance_data.dict(),
                    "error": str(e)
                })
        
        # Commit all changes
        db.commit()
        
        return ExamResultsWithPerformancesResponse(
            ExamResults=ExamResultsResponse(
                ExamResultsID=exam_result.examresultsid,
                StudentID=exam_result.studentid,
                ExamID=exam_result.examid,
                Score=exam_result.score,
                PassOrFail=exam_result.passorfail,
                Timestamp=exam_result.timestamp,
                ClerkshipID=exam_result.clerkshipid
            ),
            PerformanceRecords=BulkStudentQuestionPerformanceResponse(
                ExamResultsID=exam_result.examresultsid,
                TotalCreated=len(created_performances),
                CreatedPerformances=created_performances,
                TotalFailed=len(failed_performances),
                FailedPerformances=failed_performances
            )
        )
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )
    
@router.get("/historical-performance/", response_model=List[dict])
async def get_historical_performance_endpoint(
    student_id: Optional[int] = None,
    exam_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get all exam results with their associated student question performances.
    Can be filtered by student_id or exam_id.
    """
    try:
        results = get_historical_performance(db, student_id, exam_id, skip, limit)
        return results
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )
        
@router.get("/review-performance/", response_model=List[StudentQuestionPerformanceResponseReview])
async def get_review_performance(
    exam_id: Optional[int] = 5,
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
        
        performance_data = get_latest_student_review_performance_data(db, exam_id, studentid)
        if not performance_data:
            raise HTTPException(
                status_code=404,
                detail="No Performance Data Info Found"
            )
        
        return performance_data
            
    except HTTPException:
        raise
    
    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your request"
        )