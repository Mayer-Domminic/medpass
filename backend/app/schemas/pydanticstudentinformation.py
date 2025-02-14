from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import Optional
from datetime import date

class ClassRoster(BaseModel):
    RosterYear: int
    InitialRosterAmount: Optional[int]
    CurrentEnrollment: Optional[int]
    
    model_config = ConfigDict(from_attributes=True)
    
#This class will most likely not exist in future developments
class LoginInfo(BaseModel):
    LoginInfoID: Optional[int] = None
    Username: str = Field(..., max_length=255)
    Password: str = Field(..., max_length=255)
    IsActive: bool
    IsSuperUser: bool
    CreatedAt: Optional[date] = None
    UpdatedAt: Optional[date] = None
    Email: Optional[EmailStr] = None
    
    model_config = ConfigDict(from_attributes=True)
    
class StudentSchema(BaseModel):
    StudentID: int
    LoginInfoID: Optional[int] = None
    LastName: Optional[str] = Field(None, max_length=40)
    FirstName: Optional[str] = Field(None, max_length=40)
    CumGPA: Optional[float]
    BcpmGPA: Optional[float]
    MMICalc: Optional[float]
    
    model_config = ConfigDict(from_attributes=True)

class Extracurriculars(BaseModel):
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
    GraduationYear: Optional[float]
    Graduated: Optional[bool]
    GraduationLength: Optional[float]
    Status: Optional[str] = Field(None, max_length=255)
    
    model_config = ConfigDict(from_attributes=True)    
    
    