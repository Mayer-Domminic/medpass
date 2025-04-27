from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Intial Chat
class FirstMessageRequest(BaseModel):
    content: str
    sender_type: str = Field("user", description="Type of sender: 'user' or 'flash'")
    metadata: Optional[Dict[str, Any]] = Field(None, alias="messagemetadata")
    
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
    
    conversation_id: int 
    title: str
    created_at: datetime 
    

class SendMessageRequest(BaseModel):

    content: str
    sender_type: str = Field("user", description="Type of sender: 'user' or 'flash'")
    metadata: Optional[Dict[str, Any]] = Field(None, alias="messagemetadata")


class AddMessageResponse(BaseModel):
    message_id: int 
    conversation_id: int 
    content: str
    sender_type: str 
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = Field(None, alias="messagemetadata")
    
    class Config:
        from_attributes = True
        
class AddConversationAndModelResponse(BaseModel):
    model_response: AddMessageResponse
    conversation: AddConversationResponse    