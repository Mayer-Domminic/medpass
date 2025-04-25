from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.services.gemini_service import (
    start_and_store_conversation,
    chat_flash,
    append_and_store_message,
    get_chat_history
)

router = APIRouter(prefix="/gemini", tags=["gemini"])

class NewChatRequest(BaseModel):
    user_id: int
    title: str
    message: str

class ChatRequest(BaseModel):
    conversation_id: int
    message: str

@router.post("/chat/new", status_code=status.HTTP_201_CREATED)
def new_chat(req: NewChatRequest, db: Session = Depends(get_db)):
    convo = start_and_store_conversation(req.user_id, req.title, req.message, db)
    return {"conversation_id": convo.conversationid}

@router.post("/chat/{conversation_id}/flash")
def flash_chat(conversation_id: int, req: ChatRequest, db: Session = Depends(get_db)):
    # store user message
    append_and_store_message(conversation_id, "user", req.message, db)
    # send to Gemini
    messages = get_chat_history(conversation_id, db)
    # format for gen AI
    ga_messages = [{"author": m["sender"], "content": m["content"]} for m in messages]
    ga_messages.append({"author": "user", "content": req.message})
    resp = chat_flash(ga_messages)
    # store assistant reply
    append_and_store_message(conversation_id, "assistant", resp["content"], db)
    return {"reply": resp["content"], "usage": resp["usage"]}

@router.get("/chat/{conversation_id}/history")
def chat_history(conversation_id: int, db: Session = Depends(get_db)):
    history = get_chat_history(conversation_id, db)
    if not history:
        raise HTTPException(status_code=404, detail="Conversation not found or no messages")
    return {"history": history}
