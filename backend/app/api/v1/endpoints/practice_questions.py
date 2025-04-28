from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models import LoginInfo as User, Student
from app.services.gemini_service import generate_domain_questions
from app.models.class_models import GeneratedQuestion

router = APIRouter(prefix="/practice-questions", tags=["practice-questions"])

@router.get("/", status_code=status.HTTP_200_OK)
async def get_domain_questions(
    domain: str,
    subdomain: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        # Get student ID
        student_id = db.query(Student.studentid).filter(
            Student.logininfoid == current_user.logininfoid
        ).scalar()
        
        if not student_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        
        # Get all questions for this domain/subdomain
        questions = db.query(GeneratedQuestion).filter(
            GeneratedQuestion.student_id == student_id,
            GeneratedQuestion.domain == domain,
            GeneratedQuestion.subdomain == subdomain
        ).all()
        
        # Format response
        formatted_questions = []
        
        for q in questions:
            correct_pct = (q.times_correct / q.times_practiced * 100) if q.times_practiced > 0 else 0
            
            formatted_questions.append({
                "id": q.id,
                "text": q.question_text,
                "difficulty": q.difficulty,
                "category": subdomain,
                "correctPct": correct_pct,
                "timesPracticed": q.times_practiced
            })
        
        return {"questions": formatted_questions}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving questions: {str(e)}"
        )

@router.post("/generate", status_code=status.HTTP_201_CREATED)
async def generate_and_save_questions(
    domain: str,
    subdomain: str,
    count: int = 5,
    additional_context: str = "",
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        # Get student ID
        student_id = db.query(Student.studentid).filter(
            Student.logininfoid == current_user.logininfoid
        ).scalar()
        
        if not student_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        
        # Generate questions using the existing Gemini service
        generated_data = await generate_domain_questions(
            domain,
            subdomain,
            student_id,
            count,
            additional_context
        )
        
        if "error" in generated_data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=generated_data["error"]
            )
        
        # Save the generated questions
        questions = generated_data.get("questions", [])
        saved_questions = []
        
        for q in questions:
            # Check if question already exists
            existing = db.query(GeneratedQuestion).filter(
                GeneratedQuestion.student_id == student_id,
                GeneratedQuestion.domain == domain,
                GeneratedQuestion.subdomain == subdomain,
                GeneratedQuestion.question_text == q.get("text")
            ).first()
            
            if existing:
                saved_questions.append({
                    "id": existing.id,
                    "text": existing.question_text,
                    "difficulty": existing.difficulty,
                    "category": subdomain,
                    "correctPct": (existing.times_correct / existing.times_practiced * 100) if existing.times_practiced > 0 else 0,
                    "timesPracticed": existing.times_practiced
                })
                continue
            
            # Create new question
            options_data = []
            correct_option = ""
            
            for opt in q.get("options", []):
                if opt.get("isCorrect"):
                    correct_option = opt.get("id", "")
                options_data.append(opt)
            
            new_question = GeneratedQuestion(
                student_id=student_id,
                domain=domain,
                subdomain=subdomain,
                question_text=q.get("text", ""),
                options=options_data,
                correct_option=correct_option,
                explanation=q.get("explanation", ""),
                difficulty=q.get("difficulty", "medium")
            )
            
            db.add(new_question)
            db.flush()
            
            saved_questions.append({
                "id": new_question.id,
                "text": new_question.question_text,
                "difficulty": new_question.difficulty,
                "category": subdomain,
                "correctPct": 0,
                "timesPracticed": 0
            })
        
        db.commit()
        
        return {"questions": saved_questions}
    
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating and saving questions: {str(e)}"
        )

@router.post("/update-stats/{question_id}", status_code=status.HTTP_200_OK)
async def update_question_stats(
    question_id: int,
    correct: bool,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        # Get student ID
        student_id = db.query(Student.studentid).filter(
            Student.logininfoid == current_user.logininfoid
        ).scalar()
        
        if not student_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        
        # Get the question
        question = db.query(GeneratedQuestion).filter(
            GeneratedQuestion.id == question_id,
            GeneratedQuestion.student_id == student_id
        ).first()
        
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question not found"
            )
        
        # Update stats
        question.times_practiced += 1
        if correct:
            question.times_correct += 1
        
        db.commit()
        
        # get new percentage
        correct_pct = (question.times_correct / question.times_practiced * 100) if question.times_practiced > 0 else 0
        
        return {
            "id": question.id,
            "correctPct": correct_pct,
            "timesPracticed": question.times_practiced
        }
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating question stats: {str(e)}"
        )