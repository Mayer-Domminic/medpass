from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

class ClassRoster(BaseModel):
    RosterYear: int
    InitialRosterAmount: Optional[int]
    CurrentEnrollment: Optional[int]
    
    model_config = ConfigDict(from_attributes=True)
    
class Extracurriculars(BaseModel):
    ExtracurricularID: int
    StudentID: Optional[int]
    ActivityName: Optional[int] = Field(None, max_length=255) 
    ActivityDescription: Optional[str] = Field(None, max_length=255)
    WeeklyHourCommitment: Optional[int]
    
    model_config = ConfigDict(from_attributes=True)