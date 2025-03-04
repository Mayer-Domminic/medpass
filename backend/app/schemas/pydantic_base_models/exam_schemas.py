from pydantic import BaseModel, Field
from typing import Optional

class Exam(BaseModel):
    ExamID: Optional[int] = None
    ExamName: str = Field(..., max_length=255)
    ExamDescription: Optional[str] = Field(None, max_length=255)
    PassScore: Optional[int] = None

    #Model_config represents "ORM Mode" so we can easily interact with SQLAlchemy
    #https://docs.pydantic.dev/latest/concepts/models/#arbitrary-class-instances
    class Config:
        from_attributes = True
    
class ContentArea(BaseModel):
    ContentAreaID: int
    ContentName: str = Field(..., max_length=255)
    Description: Optional[str] = Field(None, max_length=255)
    Discipline: Optional[str] = Field(None, max_length=40)
    
    class Config:
        from_attributes = True
    
class Option(BaseModel):
    OptionID: int
    OptionDescription: str = Field(..., max_length=255)
    
    class Config:
        from_attributes = True
    
class Question(BaseModel):
    QuestionID: int
    ExamID: Optional[int] # Note a question can be not related to an exam (manual teacher input)
    Prompt: str = Field(..., max_length=255)
    QuestionDifficulty: Optional[str] = Field(None, max_length=40)
    
    class Config:
        from_attributes = True
    
class QuestionClassification(BaseModel):
    QuestionClassID: int
    QuestionID: int
    ContentAreaID: int
    
    class Config:
        from_attributes = True
    
class QuestionOptions(BaseModel):
    QuestionOptionID: int
    QuestionID: int
    OptionID: int
    CorrectAnswer: bool
    
    class Config:
        from_attributes = True