from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.services.gemini_service import (
    start_and_store_conversation,
    append_and_store_message,
    chat_flash,
    get_chat_history
)
from app.schemas.chat_schemas import (
    ChatSessionRequest, ChatSessionResponse,
    ChatFlashRequest,   ChatMessageResponse,
    ChatHistoryResponse
)

router = APIRouter(prefix="/gemini", tags=["gemini"])

@router.post(
    "/chat/new",
    response_model=ChatSessionResponse,
    status_code=status.HTTP_201_CREATED
)
async def new_chat(
    req: ChatSessionRequest,
    db: Session = Depends(get_db)
):
    convo_id = start_and_store_conversation(req.user_id, req.initial_message, db)
    return ChatSessionResponse(conversation_id=convo_id)

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

@router.get(
    "/chat/{conversation_id}/history",
    response_model=ChatHistoryResponse,
    status_code=status.HTTP_200_OK
)
async def chat_history(
    conversation_id: int,
    db: Session = Depends(get_db)
):
    history = get_chat_history(conversation_id, db)
    return ChatHistoryResponse(messages=history)
