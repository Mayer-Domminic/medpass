from pydantic import BaseModel
from typing import List
import datetime

class ChatSessionRequest(BaseModel):
    user_id: int
    initial_message: str

class ChatSessionResponse(BaseModel):
    conversation_id: int

class ChatFlashRequest(BaseModel):
    conversation_id: int
    messages: List[dict]  # [{"role": "...", "content": "..."}]

class ChatMessageResponse(BaseModel):
    message_id: int
    sender: str
    content: str
    timestamp: datetime.datetime

class ChatHistoryResponse(BaseModel):
    messages: List[dict]  # match get_chat_history output
