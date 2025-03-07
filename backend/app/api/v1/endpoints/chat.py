from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from app.services.llm_service import LLMService

router = APIRouter()
llm_service = LLMService()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    context: Optional[List[ChatMessage]] = None

class ChatResponse(BaseModel):
    response: str

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Process a chat request and return an LLM response"""
    context = [msg.dict() for msg in request.context] if request.context else []
    
    response = await llm_service.generate_response(
        prompt=request.message,
        context=context
    )
    
    return ChatResponse(response=response)

@router.get("/llm/status")
async def llm_status():
    """Get the current LLM configuration status"""
    return {
        "provider": llm_service.provider,
        "model": llm_service.config.get(llm_service.provider, {}).get("model", "unknown"),
        "status": "active"
    }