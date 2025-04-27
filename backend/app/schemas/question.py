from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime

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
    Options: List[QuestionOptionCreate]
    ClassificationName: Optional[str] = None
    GradeClassificationID: Optional[int] = None
    
    class Config:
        from_attributes = True

# Interface Model that matches your QuestionData interface
class QuestionData(BaseModel):
    Question: str
    Answers: Dict[str, str]
    CorrectOption: str
    ImageDescription: Optional[str] = None
    ImageUrl: Optional[str] = None
    Explanation: Optional[str] = None
    ImageDependent: bool = False
    Domain: str

# Response Models (using your existing models)
class QuestionResponse(BaseModel):
    QuestionID: int
    Prompt: str
    QuestionDifficulty: Optional[str]
    ImageUrl: Optional[str]
    ImageDependent: Optional[bool]
    ImageDescription: Optional[str]
    ExamID: Optional[int]
    ExamName: Optional[str]
    GradeClassificationID: Optional[int] = None
    
    class Config:
        from_attributes = True

class BulkQuestionResponse(BaseModel):
    Questions: List[QuestionResponse]
    TotalCreated: int

# Request Models for ExamResults and StudentQuestionPerformance
class ExamResultsCreate(BaseModel):
    StudentID: int
    ExamID: int
    Score: int
    ClerkshipID: Optional[int] = None
    PassOrFail: Optional[bool] = None
    Timestamp: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class StudentQuestionPerformanceCreate(BaseModel):
    QuestionID: int
    Result: bool
    Confidence: Optional[int] = None
    
    class Config:
        from_attributes = True

class ExamResultsWithPerformancesCreate(BaseModel):
    StudentID: int
    ExamID: int
    Score: int
    ClerkshipID: Optional[int] = None
    PassOrFail: Optional[bool] = None
    Timestamp: Optional[datetime] = None
    Performances: List[StudentQuestionPerformanceCreate]
    
    class Config:
        from_attributes = True

# Response Models for ExamResults and StudentQuestionPerformance
class ExamResultsResponse(BaseModel):
    ExamResultsID: int  
    StudentID: int
    ExamID: int
    Score: int
    PassOrFail: Optional[bool]
    Timestamp: Optional[datetime]
    ClerkshipID: Optional[int]
    
    class Config:
        from_attributes = True

class StudentQuestionPerformanceResponse(BaseModel):
    StudentQuestionPerformanceID: int  
    ExamResultsID: int  
    QuestionID: int
    Result: bool
    Confidence: Optional[int]
    
    class Config:
        from_attributes = True

class BulkExamResultsResponse(BaseModel):
    TotalCreated: int
    CreatedExamResults: List[ExamResultsResponse]
    TotalFailed: int
    FailedExamResults: List[dict]
    
    class Config:
        from_attributes = True

class BulkStudentQuestionPerformanceResponse(BaseModel):
    ExamResultsID: int  
    TotalCreated: int
    CreatedPerformances: List[StudentQuestionPerformanceResponse]
    TotalFailed: int
    FailedPerformances: List[dict]
    
    class Config:
        from_attributes = True

class ExamResultsWithPerformancesResponse(BaseModel):
    ExamResults: ExamResultsResponse
    PerformanceRecords: BulkStudentQuestionPerformanceResponse
    
    class Config:
        from_attributes = True