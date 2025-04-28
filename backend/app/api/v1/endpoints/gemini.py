from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Any, Dict
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.services.gemini_service import generate_domain_questions as generate_questions
from app.models import LoginInfo as User, Student
from typing import List, Optional
from app.services.gemini_service import (
    chat_flash,
    get_entire_chat,
    get_chat_history,
    create_message,
    create_conversation,
)
from app.schemas.chat_schemas import (
    ChatFlashRequest,   
    ChatConversationDetail,
    ChatConversationSummary,
    AddMessageResponse,
    SendMessageRequest,
    AddConversationResponse,
    CreateConversationRequest
)

from datetime import datetime

router = APIRouter(prefix="/gemini", tags=["gemini"])


# Above is an old endpoint for the flash chat, leaving as I don't know our process for that. 

@router.get("/chat/history", response_model=List[ChatConversationSummary], status_code=status.HTTP_200_OK)
async def get_all_chat_history(
    current_user: User = Depends(get_current_active_user),
    active_only: bool = Query(True, description="Only return active conversations"),
    db: Session = Depends(get_db)
    
):
    
    conversations = get_chat_history(db, current_user.logininfoid, active_only)
    
    return conversations

@router.get("/chat/{conversation_id}/history", response_model=ChatConversationDetail, status_code=status.HTTP_200_OK)
async def single_chat_history(
    conversation_id: int,
    since_timestamp: Optional[datetime] = Query(None, description="Filter messages since this timestamp"),
    db: Session = Depends(get_db)
):
    
    conversation = get_entire_chat(db, conversation_id, since_timestamp)
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    return conversation

# New Messages

@router.post('/chat', response_model=AddConversationResponse, status_code=status.HTTP_200_OK)
async def start_chat(
    title: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    
    conversation = create_conversation(db, current_user.logininfoid, title)
    
    return conversation

@router.post('/chat/{conversation_id}/messages', response_model=AddMessageResponse, status_code=status.HTTP_200_OK)
async def add_message(
    conversation_id: int,
    request: SendMessageRequest,
    db: Session = Depends(get_db)
):
    
    conversation = get_entire_chat(db, conversation_id)
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
        
    message = create_message(db, conversation_id, request.content, request.sender_type, request.metadata)
    
    # Add Embedding Here
    
    return message
    
@router.post("/generate-questions", status_code=status.HTTP_200_OK)
async def generate_domain_questions(
    request: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    domain = request.get("domain", "")
    subdomain = request.get("subdomain", "")
    count = request.get("count", 10)
    additional_context = request.get("additionalContext", "")

    if not domain or not subdomain:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Domain and subdomain are required"
        )

    student_id = (
        db.query(Student.studentid)
        .filter(Student.logininfoid == current_user.logininfoid)
        .scalar()
    )
    if not student_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )

    return await generate_questions(
        domain,
        subdomain,
        student_id,
        count,
        additional_context
    )