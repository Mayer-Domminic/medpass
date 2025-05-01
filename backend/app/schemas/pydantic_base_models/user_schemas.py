from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import date

class LoginInfo(BaseModel):
    LoginInfoID: Optional[int] = None
    Username: str = Field(..., max_length=255)
    Password: str = Field(..., max_length=255)
    IsActive: bool
    IsSuperUser: bool
    CreatedAt: Optional[date] = None
    UpdatedAt: Optional[date] = None
    Email: Optional[EmailStr] = None
    Bio: Optional[str] = Field(None, max_length=255)
    
    class Config:
        from_attributes = True
    
class StudentSchema(BaseModel):
    StudentID: int = Field(..., alias="studentid")
    LoginInfoID: Optional[int] = Field(None, alias="logininfoid")
    LastName: Optional[str] = Field(None, alias="lastname", max_length=40)
    FirstName: Optional[str] = Field(None, alias="firstname", max_length=40)
    CumGPA: Optional[float] = Field(None, alias="cumgpa")
    BcpmGPA: Optional[float] = Field(None, alias="bcpmgpa")
    MMICalc: Optional[float] = Field(None, alias="mmicalc")
    
    class Config:
        from_attributes = True
        populate_by_name = True
    
class Faculty(BaseModel):
    FacultyID: int
    LoginInfoID: Optional[int]
    FirstName: Optional[str] = Field(None, max_length=255)
    LastName: Optional[str] = Field(None, max_length=255)
    Position: Optional[str] = Field(None, max_length=255)
    
    class Config:
        from_attributes = True
        
class FacultyAccess(BaseModel):
    FacultyAccessID: Optional[int] = None
    FacultyID:int
    StudentID:Optional[int] = None
    RosterYear: Optional[int] = None
    
    class Config:
        from_attributes = True
    
class EnrollmentRecord(BaseModel):
    EnrollmentRecord: int
    StudentID: Optional[int]
    ClassOfferingID: Optional[int]
    GradePercentage: Optional[float]
    PassFailStatus: Optional[bool]
    AttendancePercentage: Optional[float]
    
    class Config:
        from_attributes = True