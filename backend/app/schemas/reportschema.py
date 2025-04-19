from pydantic import BaseModel, Field
from typing import Optional, List, Dict
import math

#optional statements are present as dataset is incomplete or students are in progress
class StudentReport(BaseModel):
    StudentID: int
    LastName: Optional[str] = Field(None, max_length=40)
    FirstName: Optional[str] = Field(None, max_length=40)
    CumGPA: Optional[float] = None
    BcpmGPA: Optional[float] = None
    MMICalc: Optional[float] = None
    RosterYear: int
    GraduationYear: Optional[int] = None
    Graduated: bool
    GraduationLength: Optional[float] = None
    Status: Optional[str] = Field(None, max_length=255)
    
    class Config:
        from_attributes = True
        json_encoders = {
        float: lambda x: None if math.isnan(x) else x
    }
        
    
class ExamReport(BaseModel):
    ExamName: str
    Score: int
    PassScore: int
    PassOrFail: bool
    
    class Config:
        json_encoders = {
        float: lambda x: None if math.isnan(x) else x
    }
    
class GradeReport(BaseModel):
    ClassificationName: str
    PointsEarned: float
    PointsAvailable: float
    ClassID: int
    DateTaught: int
    
    class Config:
        json_encoders = {
        float: lambda x: None if math.isnan(x) else x
    }
    
class StudentCompleteReport(BaseModel):
    StudentInfo: StudentReport
    Exams: List[ExamReport] = []
    Grades: List[GradeReport] = []
    
class DomainReport(BaseModel):
    DomainName: str
    ClassificationName: str
    PointsEarned: float
    PointsAvailable: float
    ClassID: int
    DateTaught: int
    
class DomainGrouping(BaseModel):
    Domains: Dict[str, List[DomainReport]]
    
class AccessibleStudentInfo(BaseModel):
    studentid: int
    name: str
    rosteryear: int
    
    class Config:
        from_attributes = True
