from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
import uuid

class RecurrenceRule(BaseModel):
    frequency: str
    interval: Optional[int] = None
    days_of_week: Optional[List[int]] = None
    end_date: Optional[datetime] = None
    count: Optional[int] = None

class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    all_day: Optional[bool] = False
    event_type: str
    recurrence: Optional[RecurrenceRule] = None
    location: Optional[str] = None
    color: Optional[str] = None
    priority: Optional[int] = None

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    all_day: Optional[bool] = None
    event_type: Optional[str] = None
    recurrence: Optional[RecurrenceRule] = None
    location: Optional[str] = None
    color: Optional[str] = None
    priority: Optional[int] = None

class Event(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    start: str
    end: str
    all_day: bool
    type: str
    recurrence: Optional[Dict[str, Any]] = None
    location: Optional[str] = None
    color: Optional[str] = None
    priority: Optional[int] = None

    class Config:
        from_attributes = True

class StudyPlanEventBase(BaseModel):
    """Schema for study plan event fields"""
    topic_id: Optional[str] = None
    topic_name: Optional[str] = None
    difficulty: Optional[int] = None
    importance: Optional[int] = None
    completed: Optional[bool] = False

class StudyPlanEventCreate(StudyPlanEventBase, EventCreate):
    pass

class StudyPlanEventUpdate(StudyPlanEventBase, EventUpdate):
    pass

class StudyPlanEventResponse(BaseModel):
    """Schema for study plan event response"""
    id: str
    title: str
    description: Optional[str] = None
    start: str 
    end: str 
    allDay: bool
    type: str 
    topicName: Optional[str] = None
    completed: Optional[bool] = False

class StudyPlanBase(BaseModel):
    """Base schema for study plan"""
    title: str
    description: Optional[str] = None
    start_date: datetime
    end_date: datetime
    exam_date: datetime

class StudyPlanCreate(StudyPlanBase):
    """Schema for creating study plan"""
    events: List[StudyPlanEventCreate]

class StudyPlanUpdate(BaseModel):
    """Schema for updating study plan"""
    title: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    exam_date: Optional[datetime] = None

class StudyPlanInDB(StudyPlanBase):
    """Schema for study plan in database"""
    plan_id: str
    student_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class StudyPlanResponseData(BaseModel):
    """Schema for study plan response data"""
    id: str
    title: str
    description: Optional[str] = None
    startDate: str
    endDate: str
    examDate: str 
    events: List[StudyPlanEventResponse]
    createdAt: str

class WeaknessStrength(BaseModel):
    """Schema for student strength/weakness"""
    subject: str
    performance: float
    is_weakness: Optional[bool] = None
    unit_type: Optional[str] = None
    performance_score: Optional[float] = None

class StudyPlanRequest(BaseModel):
    """Schema for study plan generation request"""
    exam_date: datetime
    weaknesses: List[WeaknessStrength]
    strengths: List[WeaknessStrength]
    events: List[Dict[str, Any]]
    study_hours_per_day: Optional[int] = 4
    focus_areas: Optional[List[str]] = None
    additional_notes: Optional[str] = None

class StudyPlanSummary(BaseModel):
    """Schema for study plan summary"""
    total_study_hours: int
    topics_count: int
    focus_areas: Dict[str, int]
    weekly_breakdown: Dict[str, int]

class StudyPlanResponse(BaseModel):
    """Schema for complete study plan response"""
    plan: StudyPlanResponseData
    summary: StudyPlanSummary

def generate_uuid() -> str:
    """Generate a UUID string"""
    return str(uuid.uuid4())