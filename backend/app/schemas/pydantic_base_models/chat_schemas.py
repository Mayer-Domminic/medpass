from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
import datetime
from decimal import Decimal

class ChatContext(BaseModel):
    ContextID: Optional[int] = None
    ConversationID: Optional[int] = None
    Title: str = Field(..., max_length=255)
    Content: str
    Embedding: Optional[List[float]] = None
    CreatedAt: Optional[datetime.datetime] = None
    UpdatedAt: Optional[datetime.datetime] = None
    IsActive: Optional[bool] = Field(default=True)
    ImportanceScore: Optional[float] = None
    CreatedBy: Optional[int] = None
    Metadata: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime.datetime: lambda v: v.isoformat()
        }
        
class ChatConversation(BaseModel):
    ConversationID: Optional[int] = None
    UserID: int
    Title: Optional[str] = Field(None, max_length=255)
    CreatedAt: Optional[datetime.datetime] = None
    UpdatedAt: Optional[datetime.datetime] = None
    IsActive: Optional[bool] = Field(default=True)
    TotalTokensInput: Optional[int] = Field(default=0)
    TotalTokensOutput: Optional[int] = Field(default=0)
    TotalCost: Optional[Decimal] = Field(default=0.0)
    Metadata: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime.datetime: lambda v: v.isoformat(),
            Decimal: lambda v: float(v)
        }
        
class ChatMessage(BaseModel):
    MessageID: Optional[int] = None
    ConversationID: int
    SenderType: str = Field(..., max_length=20)
    Content: str
    Embedding: Optional[List[float]] = None
    Timestamp: Optional[datetime.datetime] = None
    TokensInput: Optional[int] = Field(default=0)
    TokensOutput: Optional[int] = Field(default=0)
    MessageCost: Optional[Decimal] = Field(default=0.0)
    Metadata: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime.datetime: lambda v: v.isoformat(),
            Decimal: lambda v: float(v)
        }
        
class ChatMessageContext(BaseModel):
    ID: Optional[int] = None
    MessageID: int
    ContextID: int
    RelevanceScore: Optional[float] = None
    WasUsed: Optional[bool] = Field(default=False)
    
    class Config:
        from_attributes = True