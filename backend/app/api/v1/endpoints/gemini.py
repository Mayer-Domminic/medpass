from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.services.gemini_service import (
    get_entire_chat,
    get_chat_history,
    create_message,
    create_conversation,
    embed_and_create_context_messages,
    generate_model_response
)
from app.core.security import (
    get_current_active_user
)
from app.schemas.chat_schemas import (
    FirstMessageRequest,   
    ChatConversationDetail,
    ChatConversationSummary,
    AddMessageResponse,
    SendMessageRequest,
    AddConversationResponse,
    AddConversationAndModelResponse
)

from app.models import LoginInfo as User
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

@router.post('/chat', response_model=AddConversationAndModelResponse, status_code=status.HTTP_200_OK)
async def start_chat(
    request: FirstMessageRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    
    message, conversation = create_conversation(
        db,
        user_id = current_user.logininfoid,
        content = request.content,
        sender_type = request.sender_type,
        metadata = request.metadata,
        auto_process_context = True
    )
    
    model_response = generate_model_response(db=db, user_message_id=message.messageid)
    
    # Messy but ORM mode wasn't working properly so manually mapping it
    add_message_response = AddMessageResponse(
        message_id=model_response.messageid,
        conversation_id=model_response.conversationid,
        sender_type=model_response.sendertype,
        content=model_response.content,
        timestamp=model_response.timestamp,
        metadata=model_response.messagemetadata
    )

    add_conversation_response = AddConversationResponse(
        conversation_id=conversation.conversationid,
        title=conversation.title,
        created_at=conversation.createdat
    )
    
    return AddConversationAndModelResponse(
        model_response=add_message_response,
        conversation=add_conversation_response
    )

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
    
    model_response = generate_model_response(db=db, user_message_id=message.messageid)
    
    add_message_response = AddMessageResponse(
        message_id=model_response.messageid,
        conversation_id=model_response.conversationid,
        sender_type=model_response.sendertype,
        content=model_response.content,
        timestamp=model_response.timestamp,
        metadata=model_response.messagemetadata
    )
    
    return add_message_response
    
    
