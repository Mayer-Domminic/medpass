from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import Optional
from datetime import date

class Clerkship(BaseModel):
    ClerkshipID: int
    StudentID: Optional[int]
    ClerkshipName: str = Field(..., max_lenght=255)
    ClerkshipDescription: Optional[str] = Field(None, max_length=255)
    StartDate: Optional[date]
    EndDate: Optional[date]
    Company: Optional[str] = Field(None, max_length=255)
    
    model_config = ConfigDict(from_attributes=True)
    
class ExamResults(BaseModel):
    ExamResultsID: Optional[int] = None
    StudentID: Optional[int]
    ExamID: Optional[int]
    ClerkshipID: Optional[int] = None
    Score: int
    PassOrFail: Optional[bool] = None
    
    model_config = ConfigDict(from_attributes=True)
    
class StudentQuestPerformance(BaseModel):
    StudentQuestPerformanceID: int
    ExamResultsID: Optional[int]
    QuestionID: Optional[int]
    Result: bool
    
    model_config = ConfigDict(from_attributes=True)
    
class GraduationStatus(BaseModel):
    GraduationStatusID: Optional[int] = None
    StudentID: Optional[int]
    RosterYear: Optional[int]
    GraduationYear: Optional[int]
    Graduated: Optional[bool]
    GraduationLength: Optional[float]
    Status: Optional[str] = Field(None, max_length=255)
    
    model_config = ConfigDict(from_attributes=True)    
    
class StudentGrade(BaseModel):
    StudentGradeID: Optional[int] = None
    StudentID: Optional[int]
    GradeClassificationID: Optional[int]
    PointsEarned: Optional[float]
    PointsAvailable: Optional[float]
    DateRecorded: Optional[date] = None
    
    model_config = ConfigDict(from_attributes=True)
    
class GradeClassification(BaseModel):
    GradeClassificationID: Optional[int] = None
    ClassOfferingID: Optional[int]
    ClassificationName: str = Field(..., max_length=255)
    UnitType: str = Field(...,max_length=50)
    
    model_config = ConfigDict(from_attributes=True)