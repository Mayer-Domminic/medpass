from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import Optional
from datetime import date

class ClassRoster(BaseModel):
    ClassRoserID: int
    RosterYear: date
    IntialRosterAmount: Optional[int]
    CurrentEnrollment: Optional[int]
    
    model_config = ConfigDict(from_attributes=True)
    
#This class will most likely not exist in future developments
class LoginInfo(BaseModel):
    LoginInfoID: int
    Username: str = Field(..., max_length=255)
    Password: str = Field(..., max_length=255)
    Email: Optional[EmailStr] = None
    
    model_config = ConfigDict(from_attributes=True)

class Student(BaseModel):
    ExtracurricularID: int
    StudentID: Optional[int]
    ActivityName: Optional[int] = Field(None, max_length=255) 
    ActivityDescription: Optional[str] = Field(None, max_length=255)
    WeeklyHourCommitment: Optional[int]
    
    model_config = ConfigDict(from_attributes=True)
    
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
    ExamResultsID: int
    StudentID: Optional[int]
    ExamID: Optional[int]
    ClerkshipID: Optional[int]
    Score: int
    PassOrFail: bool
    
    model_config = ConfigDict(from_attributes=True)
    
class StudentQuestPerformance(BaseModel):
    StudentQuestPerformanceID: int
    ExamResultsID: Optional[int]
    QuestionID: Optional[int]
    Result: bool
    
    model_config = ConfigDict(from_attributes=True)
    
class GraduationStatus(BaseModel):
    GraduationStatusID: int
    StudentID: Optional[int]
    ClassRosterID: Optional[int]
    GraduationYear: Optional[date]
    Graduated: Optional[bool]
    GraduationLength: Optional[int]
    Status: Optional[str] = Field(None, max_length=255)
    
    model_config = ConfigDict(from_attributes=True)    
    
    