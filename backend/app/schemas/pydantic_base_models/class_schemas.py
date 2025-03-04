from pydantic import BaseModel, Field
from typing import Optional

class ClassModel(BaseModel):
    ClassID: int
    ClassName: str = Field(..., max_length=255)
    ClassDescription: Optional[str] = Field(None, max_length=255)
    Block: Optional[int]
    
    class Config:
        from_attributes = True
    
class ClassOffering(BaseModel):
    ClassOfferingID: Optional[int] = None
    FacultyID: Optional[int] = None
    ClassID: Optional[int]
    DateTaught: Optional[int] = None
    Semester: Optional[str] = Field(None, max_length =40)
    
    class Config:
        from_attributes = True