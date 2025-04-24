from pydantic import BaseModel, Field
from typing import Optional, List, Dict

# Request Models for creating new resources
class OptionCreate(BaseModel):
    OptionDescription: str = Field(..., max_length=255)

class QuestionOptionCreate(BaseModel):
    OptionDescription: str = Field(..., max_length=255)
    CorrectAnswer: bool = False
    Explanation: Optional[str] = Field(None, max_length=255)

class ContentAreaCreate(BaseModel):
    ContentName: str = Field(..., max_length=255)
    Description: Optional[str] = Field(None, max_length=255)
    Discipline: Optional[str] = Field(None, max_length=40)

class QuestionCreate(BaseModel):
    ExamID: Optional[int] = None
    Prompt: str = Field(..., max_length=255)
    QuestionDifficulty: Optional[str] = Field(None, max_length=40)
    ImageUrl: Optional[str] = Field(None, max_length=255)
    ImageDependent: Optional[bool] = Field(False)
    ImageDescription: Optional[str] = Field(None, max_length=255)
    options: List[QuestionOptionCreate]
    content_areas: List[str]  # List of content area names
    
    class Config:
        from_attributes = True

# Interface Model that matches your QuestionData interface
class QuestionData(BaseModel):
    Question: str
    Answers: Dict[str, str]
    correct_option: str
    Image_Description: Optional[str] = None
    Image_URL: Optional[str] = None
    Explanation: Optional[str] = None
    Image_Dependent: bool = False
    domain: str

# Response Models (using your existing models)
class QuestionResponse(BaseModel):
    QuestionID: int
    ExamID: Optional[int]
    Prompt: str
    QuestionDifficulty: Optional[str]
    ImageUrl: Optional[str]
    ImageDependent: Optional[bool]
    ImageDescription: Optional[str]
    
    class Config:
        from_attributes = True

class BulkQuestionResponse(BaseModel):
    questions: List[QuestionResponse]
    total_created: int