from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

class CalendarCredentials(BaseModel):
    StudentID: int
    TokenData: str
    
    model_config = ConfigDict(from_attributes=True)

class CalendarEvent(BaseModel):
    EventID: str
    StudentID: int
    Title: str
    Description: Optional[str] = None
    StartTime: datetime
    EndTime: datetime
    Location: Optional[str] = None
    IsRecurring: bool = False
    RecurrenceRule: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class CalendarEventResponse(BaseModel):
    events: List[CalendarEvent]
    
class GoogleCalendarAuthResponse(BaseModel):
    auth_url: str

class GoogleCalendarTokenExchange(BaseModel):
    code: str
    student_id: int