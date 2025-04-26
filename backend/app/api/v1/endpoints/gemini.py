from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.services.gemini_service import (
    start_and_store_conversation,
    append_and_store_message,
    chat_flash,
    get_entire_chat,
    get_chat_history,
    create_message,
    create_conversation
)
from app.core.security import (
    get_current_active_user
)
from app.schemas.chat_schemas import (
    ChatSessionRequest, ChatSessionResponse,
    ChatFlashRequest,   ChatMessageResponse,
    ChatHistoryResponse,
    ChatConversationDetail,
    ChatConversationSummary,
    AddMessageResponse,
    SendMessageRequest,
    AddConversationResponse,
    CreateConversationRequest
)

from app.models import LoginInfo as User
from datetime import datetime

router = APIRouter(prefix="/gemini", tags=["gemini"])

@router.post(
    "/chat/flash",
    response_model=ChatMessageResponse,
    status_code=status.HTTP_200_OK
)
async def flash_chat(
    req: ChatFlashRequest,
    db: Session = Depends(get_db)
):
    reply = chat_flash(req.messages)
    msg = append_and_store_message(req.conversation_id, "assistant", reply, db)
    return ChatMessageResponse(
        message_id=msg.messageid,
        sender=msg.sendertype,
        content=msg.content,
        timestamp=msg.timestamp
    )

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
    
    
