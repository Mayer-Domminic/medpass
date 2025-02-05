from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

class Exam(BaseModel):
    ExamID: int
    ExamName: str = Field(..., max_length=255)
    ExamDescription: Optional[str] = Field(None, max_length=255)

    #Model_config represents "ORM Mode" so we can easily interact with SQLAlchemy
    #https://docs.pydantic.dev/latest/concepts/models/#arbitrary-class-instances
    model_config = ConfigDict(from_attributes=True)
    
class ContentArea(BaseModel):
    ContentAreaID: int
    ContentName: str = Field(..., max_length=255)
    Description: Optional[str] = Field(None, max_length=255)
    Discipline: Optional[str] = Field(None, max_length=40)
    
    model_config = ConfigDict(from_attributes=True)
    
class Option(BaseModel):
    OptionID: int
    OptionDescription: str = Field(..., max_length=255)
    
    model_config = ConfigDict(from_attributes=True)
    
class Question(BaseModel):
    QuestionID: int
    ExamID: Optional[int] # Note a question can be not related to an exam (manual teacher input)
    Prompt: str = Field(..., max_length=255)
    QuestionDifficulty: Optional[str] = Field(None, max_length=40)
    
    model_config = ConfigDict(from_attributes=True)
    
class QuestionClassification(BaseModel):
    QuestionClassID: int
    QuestionID: int
    ContentAreaID: int
    
    model_config = ConfigDict(from_attributes=True)
    
class QuestionOptions(BaseModel):
    QuestionOptionID: int
    QuestionID: int
    OptionID: int
    CorrectAnswer: bool
    
    model_config = ConfigDict(from_attributes=True)
    
    
