from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

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
    timestamp: datetime

class ChatHistoryResponse(BaseModel):
    messages: List[dict]  # match get_chat_history output

# New models Remove the Above Ones Later
class ChatContextModel(BaseModel):

    contextid: int
    title: str
    content: str
    importancescore: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = Field(None, alias="chatmetadata")

    class Config:
        from_attributes = True

class ChatMessageModel(BaseModel):
    
    messageid: int
    sendertype: str
    content: str
    timestamp: datetime
    tokensinput: int
    tokensoutput: int
    messagecost: float
    metadata: Optional[Dict[str, Any]] = Field(None, alias="messagemetadata")

    class Config:
        from_attributes = True
        

class ChatMessageWithContextModel(ChatMessageModel):
    contexts: List[ChatContextModel] = []

class ChatConversationSummary(BaseModel):
    conversationid: int
    title: str
    createdat: datetime
    updatedat: datetime
    message_count: int
    total_tokens: int
    total_cost: float

class ChatConversationDetail(BaseModel):
    conversationid: int
    title: str
    createdat: datetime
    updatedat: datetime
    isactive: bool
    totaltokensinput: int
    totaltokensoutput: int
    totalcost: float
    messages: List[ChatMessageWithContextModel] = []

# Request schemas
class SearchConversationsRequest(BaseModel):
    """Schema for conversation search request"""
    search_term: str = Field(..., description="Text to search for in conversation titles and messages")