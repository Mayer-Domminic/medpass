from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

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
    
    model_config = ConfigDict(from_attributes=True)
    
    
    

