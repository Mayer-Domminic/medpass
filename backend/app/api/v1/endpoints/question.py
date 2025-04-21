from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

from app.core.database import get_db, get_question, get_question_with_details
from app.schemas.question import (
    QuestionCreate,
    QuestionOptionCreate,
    QuestionResponse, 
    BulkQuestionResponse,
    QuestionData
)
from app.models.exam_models import Question, ContentArea, Option, QuestionOption, QuestionClassification

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
        content_area_ids = await create_content_areas(db, question_data.content_areas)
        
        # Create question-content area classifications
        await create_question_classifications(db, db_question.questionid, content_area_ids)
        
        # Create options and question-option relationships
        await create_question_options(db, db_question.questionid, question_data.options)
        
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
            content_area_ids = await create_content_areas(db, question_data.content_areas)
            
            # Create question-content area classifications
            await create_question_classifications(db, db_question.questionid, content_area_ids)
            
            # Create options and question-option relationships
            await create_question_options(db, db_question.questionid, question_data.options)
            
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
            "questions": created_questions,
            "total_created": len(created_questions)
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
            is_correct = option_key == question_data.correct_option
            
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
            ImageUrl=question_data.Image_URL,
            ImageDependent=question_data.Image_Dependent,
            ImageDescription=question_data.Image_Description,
            options=[QuestionOptionCreate(**opt) for opt in options_data],
            content_areas=[question_data.domain] if question_data.domain else []
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
        content_area_ids = await create_content_areas(db, db_question_data.content_areas)
        
        # Create question-content area classifications
        await create_question_classifications(db, db_question.questionid, content_area_ids)
        
        # Create options and question-option relationships
        await create_question_options(db, db_question.questionid, db_question_data.options)
        
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