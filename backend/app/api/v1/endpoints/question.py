from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db, get_question, get_question_with_details
from app.schemas.question import (
    QuestionCreate,
    QuestionOptionCreate,
    QuestionResponse, 
    BulkQuestionResponse,
    QuestionData,
    ExamResultCreate,
    StudentQuestionPerformanceCreate,
    ExamResultWithPerformancesCreate,
    ExamResultResponse,
    StudentQuestionPerformanceResponse,
    BulkExamResultResponse,
    BulkStudentQuestionPerformanceResponse,
    ExamResultWithPerformancesResponse
)
from app.models.exam_models import Question, ContentArea, Option, QuestionOption, QuestionClassification
from app.models.result_models import ExamResults, StudentQuestionPerformance
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

async def create_content_areas(db: Session, content_area_names: List[str]):
    """Create content areas from names if they don't exist"""
    content_area_ids = []
    
    for name in content_area_names:
        # Check if content area exists
        content_area = db.query(ContentArea).filter(ContentArea.contentname == name).first()
        
        if not content_area:
            # Create new content area with minimal info
            content_area = ContentArea(contentname=name)
            db.add(content_area)
            db.flush()  # Flush to get the ID without committing
        
        content_area_ids.append(content_area.contentareaid)
    
    return content_area_ids

async def create_question_options(db: Session, question_id: int, options_data):
    """Create options and question-option relationships"""
    for option_data in options_data:
        # Create option
        option = Option(optiondescription=option_data.OptionDescription)
        db.add(option)
        db.flush()  # Get the option ID
        
        # Create question-option relationship
        question_option = QuestionOption(
            questionid=question_id,
            optionid=option.optionid,
            correctanswer=option_data.CorrectAnswer
        )
        db.add(question_option)

async def create_question_classifications(db: Session, question_id: int, content_area_ids: List[int]):
    """Create question-content area classifications"""
    for content_area_id in content_area_ids:
        classification = QuestionClassification(
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
    result = get_question_with_details(db, question_id)
    
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
    """Create a new question with options and content area classifications"""
    try:
        # Create the question
        db_question = Question(
            examid=question_data.ExamID,
            prompt=question_data.Prompt,
            questionDifficulty=question_data.QuestionDifficulty,
            image_url=question_data.ImageUrl,
            image_dependent=question_data.ImageDependent,
            image_description=question_data.ImageDescription
        )
        db.add(db_question)
        db.flush()  # Get the question ID without committing
        
        # Create content areas if needed
        content_area_ids = await create_content_areas(db, question_data.ContentAreas)
        
        # Create question-content area classifications
        await create_question_classifications(db, db_question.questionid, content_area_ids)
        
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
            ImageUrl=db_question.image_url,
            ImageDependent=db_question.image_dependent,
            ImageDescription=db_question.image_description
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
            # Create the question
            db_question = Question(
                examid=question_data.ExamID,
                prompt=question_data.Prompt,
                questionDifficulty=question_data.QuestionDifficulty,
                image_url=question_data.ImageUrl,
                image_dependent=question_data.ImageDependent,
                image_description=question_data.ImageDescription
            )
            db.add(db_question)
            db.flush()  # Get the question ID without committing
            
            # Create content areas if needed
            content_area_ids = await create_content_areas(db, question_data.ContentAreas)
            
            # Create question-content area classifications
            await create_question_classifications(db, db_question.questionid, content_area_ids)
            
            # Create options and question-option relationships
            await create_question_options(db, db_question.questionid, question_data.Options)
            
            # Map SQLAlchemy model to Pydantic response model
            created_questions.append(QuestionResponse(
                QuestionID=db_question.questionid,
                ExamID=db_question.examid,
                Prompt=db_question.prompt,
                QuestionDifficulty=db_question.questionDifficulty,
                ImageUrl=db_question.image_url,
                ImageDependent=db_question.image_dependent,
                ImageDescription=db_question.image_description
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
    db: Session = Depends(get_db)
):
    """
    Create a question from the QuestionData format (which matches your interface)
    This allows converting from your front-end format to the database format
    """
    try:
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
        
        # Create a QuestionCreate object
        db_question_data = QuestionCreate(
            ExamID=exam_id,
            Prompt=question_data.Question,
            ImageUrl=question_data.ImageURL,
            ImageDependent=question_data.ImageDependent,
            ImageDescription=question_data.ImageDescription,
            Options=[QuestionOptionCreate(**opt) for opt in options_data],
            ContentAreas=[question_data.Domain] if question_data.Domain else []
        )
        
        # Create the question
        db_question = Question(
            examid=db_question_data.ExamID,
            prompt=db_question_data.Prompt,
            image_url=db_question_data.ImageUrl,
            image_dependent=db_question_data.ImageDependent,
            image_description=db_question_data.ImageDescription
        )
        db.add(db_question)
        db.flush()  # Get the question ID without committing
        
        # Create content areas if needed
        content_area_ids = await create_content_areas(db, db_question_data.ContentAreas)
        
        # Create question-content area classifications
        await create_question_classifications(db, db_question.questionid, content_area_ids)
        
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
            ImageUrl=db_question.image_url,
            ImageDependent=db_question.image_dependent,
            ImageDescription=db_question.image_description
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

@router.post("/exam-results/", response_model=ExamResultResponse, status_code=status.HTTP_201_CREATED)
async def create_exam_result_endpoint(
    exam_data: ExamResultCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new exam result record for a student
    """
    try:
        # Verify student exists
        student = db.query(Student).filter(Student.studentid == exam_data.student_id).first()
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student with ID {exam_data.student_id} not found"
            )
        
        # Verify exam exists
        exam = db.query(Exam).filter(Exam.examid == exam_data.exam_id).first()
        if not exam:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Exam with ID {exam_data.exam_id} not found"
            )
        
        # Only verify clerkship if provided and not None
        if exam_data.clerkship_id is not None:
            clerkship = db.query(Clerkship).filter(Clerkship.clerkshipid == exam_data.clerkship_id).first()
            if not clerkship:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Clerkship with ID {exam_data.clerkship_id} not found"
                )
        
        # If pass_or_fail is not provided, determine based on exam pass score
        pass_or_fail = exam_data.pass_or_fail
        if pass_or_fail is None and exam.passscore is not None:
            pass_or_fail = exam_data.score >= exam.passscore
        
        # Use current time if timestamp not provided
        timestamp = exam_data.timestamp or datetime.now()
        
        exam_result = ExamResults(
            studentid=exam_data.student_id,
            examid=exam_data.exam_id,
            clerkshipid=exam_data.clerkship_id,  # This can be None
            score=exam_data.score,
            passorfail=pass_or_fail,
            timestamp=timestamp
        )
        
        db.add(exam_result)
        db.commit()
        db.refresh(exam_result)
        
        return ExamResultResponse(
            exam_result_id=exam_result.examresultsid,
            student_id=exam_result.studentid,
            exam_id=exam_result.examid,
            score=exam_result.score,
            pass_or_fail=exam_result.passorfail,
            timestamp=exam_result.timestamp,
            clerkship_id=exam_result.clerkshipid  # This can be None in the response
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

@router.post("/exam-results/bulk/", response_model=BulkExamResultResponse, status_code=status.HTTP_201_CREATED)
async def create_exam_results_bulk(
    exam_results_data: List[ExamResultCreate],
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
                student = db.query(Student).filter(Student.studentid == data.student_id).first()
                if not student:
                    failed_exam_results.append({
                        "data": data.dict(),
                        "error": f"Student with ID {data.student_id} not found"
                    })
                    continue
                
                # Verify exam exists
                exam = db.query(Exam).filter(Exam.examid == data.exam_id).first()
                if not exam:
                    failed_exam_results.append({
                        "data": data.dict(),
                        "error": f"Exam with ID {data.exam_id} not found"
                    })
                    continue
                
                # Only verify clerkship if provided and not None
                if data.clerkship_id is not None:
                    clerkship = db.query(Clerkship).filter(Clerkship.clerkshipid == data.clerkship_id).first()
                    if not clerkship:
                        failed_exam_results.append({
                            "data": data.dict(),
                            "error": f"Clerkship with ID {data.clerkship_id} not found"
                        })
                        continue
                
                # If pass_or_fail is not provided, determine based on exam pass score
                pass_or_fail = data.pass_or_fail
                if pass_or_fail is None and exam.passscore is not None:
                    pass_or_fail = data.score >= exam.passscore
                
                # Use current time if timestamp not provided
                timestamp = data.timestamp or datetime.now()
                
                # Create and add exam result
                exam_result = ExamResults(
                    studentid=data.student_id,
                    examid=data.exam_id,
                    clerkshipid=data.clerkship_id,  
                    score=data.score,
                    passorfail=pass_or_fail,
                    timestamp=timestamp
                )
                
                db.add(exam_result)
                db.flush()
                
                created_exam_results.append(ExamResultResponse(
                    exam_result_id=exam_result.examresultsid,
                    student_id=exam_result.studentid,
                    exam_id=exam_result.examid,
                    score=exam_result.score,
                    pass_or_fail=exam_result.passorfail,
                    timestamp=exam_result.timestamp,
                    clerkship_id=exam_result.clerkshipid  
                ))
            
            except Exception as e:
                failed_exam_results.append({
                    "data": data.dict(),
                    "error": str(e)
                })
        
        # Commit all successful changes
        if created_exam_results:
            db.commit()
            
        return BulkExamResultResponse(
            total_created=len(created_exam_results),
            created_exam_results=created_exam_results,
            total_failed=len(failed_exam_results),
            failed_exam_results=failed_exam_results
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
    exam_result_id: int,
    performance_data: StudentQuestionPerformanceCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new student question performance record
    """
    try:
        # Verify exam result exists
        exam_result = db.query(ExamResults).filter(ExamResults.examresultsid == exam_result_id).first()
        if not exam_result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Exam result with ID {exam_result_id} not found"
            )
        
        # Verify question exists
        question = db.query(Question).filter(Question.questionid == performance_data.question_id).first()
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Question with ID {performance_data.question_id} not found"
            )
        
        # Create performance record
        performance = StudentQuestionPerformance(
            examresultid=exam_result_id,
            questionid=performance_data.question_id,
            result=performance_data.result,
            confidence=performance_data.confidence
        )
        
        db.add(performance)
        db.commit()
        db.refresh(performance)
        
        return StudentQuestionPerformanceResponse(
            performance_id=performance.studentquestionperformanceid,
            exam_result_id=performance.examresultid,
            question_id=performance.questionid,
            result=performance.result,
            confidence=performance.confidence
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
    exam_result_id: int,
    performances_data: List[StudentQuestionPerformanceCreate],
    db: Session = Depends(get_db)
):
    """
    Create multiple question performance records for a single exam result
    """
    # First verify exam result exists
    exam_result = db.query(ExamResults).filter(ExamResults.examresultsid == exam_result_id).first()
    if not exam_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exam result with ID {exam_result_id} not found"
        )
    
    created_performances = []
    failed_performances = []
    
    try:
        for data in performances_data:
            try:
                # Verify question exists
                question = db.query(Question).filter(Question.questionid == data.question_id).first()
                if not question:
                    failed_performances.append({
                        "data": data.dict(),
                        "error": f"Question with ID {data.question_id} not found"
                    })
                    continue
                
                # Create performance record
                performance = StudentQuestionPerformance(
                    examresultid=exam_result_id,
                    questionid=data.question_id,
                    result=data.result,
                    confidence=data.confidence
                )
                
                db.add(performance)
                db.flush()
                
                created_performances.append(StudentQuestionPerformanceResponse(
                    performance_id=performance.studentquestionperformanceid,
                    exam_result_id=performance.examresultid,
                    question_id=performance.questionid,
                    result=performance.result,
                    confidence=performance.confidence
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
            exam_result_id=exam_result_id,
            total_created=len(created_performances),
            created_performances=created_performances,
            total_failed=len(failed_performances),
            failed_performances=failed_performances
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )

@router.post("/exam-results-with-performance/", response_model=ExamResultWithPerformancesResponse, status_code=status.HTTP_201_CREATED)
async def create_exam_result_with_performances(
    data: ExamResultWithPerformancesCreate,
    db: Session = Depends(get_db)
):
    """
    Create an exam result and its related question performance records in one transaction
    """
    try:
        # Verify student exists
        student = db.query(Student).filter(Student.studentid == data.student_id).first()
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student with ID {data.student_id} not found"
            )
        
        # Verify exam exists
        exam = db.query(Exam).filter(Exam.examid == data.exam_id).first()
        if not exam:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Exam with ID {data.exam_id} not found"
            )
        
        # Verify clerkship if provided
        if data.clerkship_id:
            clerkship = db.query(Clerkship).filter(Clerkship.clerkshipid == data.clerkship_id).first()
            if not clerkship:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Clerkship with ID {data.clerkship_id} not found"
                )
        
        # If pass_or_fail is not provided, determine based on exam pass score
        pass_or_fail = data.pass_or_fail
        if pass_or_fail is None and exam.passscore is not None:
            pass_or_fail = data.score >= exam.passscore
        
        # Use current time if timestamp not provided
        timestamp = data.timestamp or datetime.now()
        
        # Create exam result
        exam_result = ExamResults(
            studentid=data.student_id,
            examid=data.exam_id,
            clerkshipid=data.clerkship_id,
            score=data.score,
            passorfail=pass_or_fail,
            timestamp=timestamp
        )
        
        db.add(exam_result)
        db.flush()  # Get the exam result ID
        
        # Create performance records
        created_performances = []
        failed_performances = []
        
        for performance_data in data.performances:
            try:
                # Verify question exists
                question = db.query(Question).filter(Question.questionid == performance_data.question_id).first()
                if not question:
                    failed_performances.append({
                        "data": performance_data.dict(),
                        "error": f"Question with ID {performance_data.question_id} not found"
                    })
                    continue
                
                # Create performance record
                performance = StudentQuestionPerformance(
                    examresultid=exam_result.examresultsid,
                    questionid=performance_data.question_id,
                    result=performance_data.result,
                    confidence=performance_data.confidence
                )
                
                db.add(performance)
                db.flush()
                
                created_performances.append(StudentQuestionPerformanceResponse(
                    performance_id=performance.studentquestionperformanceid,
                    exam_result_id=performance.examresultid,
                    question_id=performance.questionid,
                    result=performance.result,
                    confidence=performance.confidence
                ))
            
            except Exception as e:
                failed_performances.append({
                    "data": performance_data.dict(),
                    "error": str(e)
                })
        
        # Commit all changes
        db.commit()
        
        return ExamResultWithPerformancesResponse(
            exam_result=ExamResultResponse(
                exam_result_id=exam_result.examresultsid,
                student_id=exam_result.studentid,
                exam_id=exam_result.examid,
                score=exam_result.score,
                pass_or_fail=exam_result.passorfail,
                timestamp=exam_result.timestamp,
                clerkship_id=exam_result.clerkshipid
            ),
            performance_records=BulkStudentQuestionPerformanceResponse(
                exam_result_id=exam_result.examresultsid,
                total_created=len(created_performances),
                created_performances=created_performances,
                total_failed=len(failed_performances),
                failed_performances=failed_performances
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