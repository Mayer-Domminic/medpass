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
    ContentAreas: List[str]  # List of content area names
    
    class Config:
        from_attributes = True

# Interface Model that matches your QuestionData interface
class QuestionData(BaseModel):
    Question: str
    Answers: Dict[str, str]
    CorrectOption: str
    ImageDescription: Optional[str] = None
    ImageURL: Optional[str] = None
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
    
    class Config:
        from_attributes = True

class BulkQuestionResponse(BaseModel):
    Questions: List[QuestionResponse]
    TotalCreated: int

    # Request Models for ExamResults and StudentQuestionPerformance
class ExamResultCreate(BaseModel):
    student_id: int
    exam_id: int
    score: int
    clerkship_id: Optional[int] = None
    pass_or_fail: Optional[bool] = None
    timestamp: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class StudentQuestionPerformanceCreate(BaseModel):
    question_id: int
    result: bool
    confidence: Optional[int] = None
    
    class Config:
        from_attributes = True

class ExamResultWithPerformancesCreate(BaseModel):
    student_id: int
    exam_id: int
    score: int
    clerkship_id: Optional[int] = None
    pass_or_fail: Optional[bool] = None
    timestamp: Optional[datetime] = None
    performances: List[StudentQuestionPerformanceCreate]
    
    class Config:
        from_attributes = True

# Response Models for ExamResults and StudentQuestionPerformance
class ExamResultResponse(BaseModel):
    exam_result_id: int
    student_id: int
    exam_id: int
    score: int
    pass_or_fail: Optional[bool]
    timestamp: Optional[datetime]
    clerkship_id: Optional[int]
    
    class Config:
        from_attributes = True

class StudentQuestionPerformanceResponse(BaseModel):
    performance_id: int
    exam_result_id: int
    question_id: int
    result: bool
    confidence: Optional[int]
    
    class Config:
        from_attributes = True

class BulkExamResultResponse(BaseModel):
    total_created: int
    created_exam_results: List[ExamResultResponse]
    total_failed: int
    failed_exam_results: List[dict]
    
    class Config:
        from_attributes = True

class BulkStudentQuestionPerformanceResponse(BaseModel):
    exam_result_id: int
    total_created: int
    created_performances: List[StudentQuestionPerformanceResponse]
    total_failed: int
    failed_performances: List[dict]
    
    class Config:
        from_attributes = True

class ExamResultWithPerformancesResponse(BaseModel):
    exam_result: ExamResultResponse
    performance_records: BulkStudentQuestionPerformanceResponse
    
    class Config:
        from_attributes = True