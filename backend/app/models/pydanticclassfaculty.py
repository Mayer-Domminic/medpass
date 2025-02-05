from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import date

#!!! CHANGE CLASS TABLE TO SOMETHING OTHER THAN "CLASS" will cause issues for development later on
class ClassModel(BaseModel):
    ClassID: int
    ClassName: str = Field(..., max_length=255)
    ClassDescription: Optional[str] = Field(None, max_length=255)
    Block: Optional[int]
    
    model_config = ConfigDict(from_attributes=True)
    
class Faculty(BaseModel):
    FacultyID: int
    LoginInfoID: Optional[int]
    FirstName: Optional[str] = Field(None, max_length=255)
    LastName: Optional[str] = Field(None, max_length=255)
    Position: Optional[str] = Field(None, max_length=255)
    
    model_config = ConfigDict(from_attributes=True)
    
class ClassOffering(BaseModel):
    ClassOfferingID: int
    FacultyID: Optional[int]
    ClassID: Optional[int]
    DateTaught: Optional[date]
    Semester: Optional[str] = Field(None, max_length =40)
    
    model_config = ConfigDict(from_attributes=True)
    
class GradeClassification(BaseModel):
    GradeClassificationID: int
    ClassOfferingID: Optional[int]
    ClassificationName: str = Field(..., max_length=255)
    UnitType: str = Field(...,max_length=50)
    
    model_config = ConfigDict(from_attributes=True)
    
class EnrollmentRecord(BaseModel):
    EnrollmentRecord: int
    StudentID: Optional[int]
    ClassOfferingID: Optional[int]
    GradePercentage: Optional[float]
    PassFailStatus: Optional[bool]
    AttendancePercentage: Optional[float]
    
    model_config = ConfigDict(from_attributes=True)
    
class StudentGrade(BaseModel):
    StudentGradeID: int
    StudentID: Optional[int]
    GradeClassificationID: Optional[int]
    PointsEarned: Optional[float]
    PointsAvailable: Optional[float]
    DateRecorded: Optional[date]
    
    model_config = ConfigDict(from_attributes=True)