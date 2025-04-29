from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models import LoginInfo as User, Student
from app.services.gemini_service import generate_domain_questions
from app.models.class_models import GeneratedQuestion
import json

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
            
            options = q.options
            if isinstance(options, str):
                try:
                    options = json.loads(options)
                except:
                    options = []
            
            formatted_questions.append({
                "id": q.id,
                "text": q.question_text,
                "difficulty": q.difficulty,
                "category": subdomain,
                "correctPct": correct_pct,
                "timesPracticed": q.times_practiced,
                "options": options,
                "explanation": q.explanation
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
    rag: bool = True,
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
        
        if rag:
            from app.services.rag_service import search_documents
            
            search_query = f"{domain} {subdomain}"
            relevant_docs = search_documents(search_query, limit=3)
            
            doc_context = ""
            if relevant_docs:
                doc_context = "Use the following document excerpts as reference:\n\n"
                for i, doc in enumerate(relevant_docs, 1):
                    doc_context += f"Document {i}: {doc['title']}\n{doc['content']}\n\n"
                
                additional_context = doc_context + additional_context
        
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

@router.get("/stats", status_code=status.HTTP_200_OK)
async def get_domain_stats(
    domain: str,
    subdomain: Optional[str] = None,
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
        
        query = db.query(GeneratedQuestion).filter(
            GeneratedQuestion.student_id == student_id,
            GeneratedQuestion.domain == domain
        )
        
        if subdomain:
            query = query.filter(GeneratedQuestion.subdomain == subdomain)
        
        questions = query.all()
        
        total_questions = len(questions)
        total_practiced = sum(q.times_practiced for q in questions)
        total_correct = sum(q.times_correct for q in questions)
        
        #default values
        confidence = 0
        proficiency = 0
        
        if total_questions > 0:
            confidence = min(100, (sum(1 for q in questions if q.times_practiced > 0) / total_questions) * 100)
            
            if total_practiced > 0:
                proficiency = (total_correct / total_practiced) * 100
        
        if not subdomain:
            # group by subdomain
            subdomain_stats = {}
            for q in questions:
                if q.subdomain not in subdomain_stats:
                    subdomain_stats[q.subdomain] = {
                        "total": 0,
                        "practiced": 0,
                        "correct": 0
                    }
                
                subdomain_stats[q.subdomain]["total"] += 1
                subdomain_stats[q.subdomain]["practiced"] += q.times_practiced
                subdomain_stats[q.subdomain]["correct"] += q.times_correct
            
            result = {}
            for sub, stats in subdomain_stats.items():
                sub_confidence = 0
                sub_proficiency = 0
                
                if stats["total"] > 0:
                    practiced_questions = sum(1 for q in questions if q.subdomain == sub and q.times_practiced > 0)
                    sub_confidence = min(100, (practiced_questions / stats["total"]) * 100)
                    
                    if stats["practiced"] > 0:
                        sub_proficiency = (stats["correct"] / stats["practiced"]) * 100
                
                result[sub] = {
                    "confidence": sub_confidence,
                    "proficiency": sub_proficiency
                }
            
            return {
                "overall": {
                    "confidence": confidence,
                    "proficiency": proficiency
                },
                "subdomains": result
            }
        
        return {
            "confidence": confidence,
            "proficiency": proficiency,
            "total_questions": total_questions,
            "questions_practiced": sum(1 for q in questions if q.times_practiced > 0),
            "total_attempts": total_practiced,
            "correct_answers": total_correct
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving stats: {str(e)}"
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