from pydantic import BaseModel, Field
from typing import Optional, List

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
    
class ExamReport(BaseModel):
    ExamName: str
    Score: int
    PassScore: int
    PassOrFail: bool
    
class GradeReport(BaseModel):
    ClassificationName: str
    PointsEarned: float
    PointsAvailable: float
    ClassID: int
    DateTaught: int
    
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
