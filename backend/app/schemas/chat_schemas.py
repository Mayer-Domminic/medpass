from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class ChatFlashRequest(BaseModel):
    conversation_id: int
    messages: List[dict]  # [{"role": "...", "content": "..."}]

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
    
# Adding Chat & Message

class CreateConversationRequest(BaseModel):
    
    title: str

class AddConversationResponse(BaseModel):
    
    conversation_id: int = Field(..., alias="conversationid")
    title: str
    created_at: datetime = Field(..., alias="createdat")

class SendMessageRequest(BaseModel):

    content: str
    sender_type: str = Field("user", description="Type of sender: 'user' or 'flash'")
    metadata: Optional[Dict[str, Any]] = Field(None, alias="messagemetadata")


class AddMessageResponse(BaseModel):
    message_id: int = Field(..., alias="messageid")
    conversation_id: int = Field(..., alias="conversationid")
    sender_type: str = Field(..., alias="sendertype")
    content: str
    timestamp: datetime
    tokens_input: int = Field(0, alias="tokensinput")
    tokens_output: int = Field(0, alias="tokensoutput")
    message_cost: float = Field(0.0, alias="messagecost")
    metadata: Optional[Dict[str, Any]] = Field(None, alias="messagemetadata")
    
    class Config:
        from_attributes = True