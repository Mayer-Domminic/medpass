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

class EventUpdate(EventBase):
    title: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    event_type: Optional[str] = None

class EventInDB(EventBase):
    event_id: str
    student_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Event(EventInDB):
    pass

class StudyPlanEventBase(BaseModel):
    topic_id: Optional[str] = None
    topic_name: Optional[str] = None
    difficulty: Optional[int] = None
    importance: Optional[int] = None
    completed: Optional[bool] = False

class StudyPlanEventCreate(StudyPlanEventBase, EventCreate):
    pass

class StudyPlanEventUpdate(StudyPlanEventBase, EventUpdate):
    pass

class StudyPlanEventInDB(StudyPlanEventBase):
    id: int
    plan_id: str
    event_id: str

    class Config:
        from_attributes = True

class StudyPlanEvent(StudyPlanEventInDB, Event):
    pass

class StudyPlanBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_date: datetime
    end_date: datetime
    exam_date: datetime

class StudyPlanCreate(StudyPlanBase):
    events: List[StudyPlanEventCreate]

class StudyPlanUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    exam_date: Optional[datetime] = None

class StudyPlanInDB(StudyPlanBase):
    plan_id: str
    student_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class StudyPlan(StudyPlanInDB):
    events: List[StudyPlanEvent]

class WeaknessStrength(BaseModel):
    subject: str
    performance: float
    is_weakness: bool

class StudyPlanRequest(BaseModel):
    exam_date: datetime
    weaknesses: List[WeaknessStrength]
    strengths: List[WeaknessStrength]
    events: List[Event]
    study_hours_per_day: Optional[int] = 4
    focus_areas: Optional[List[str]] = None

class StudyPlanSummary(BaseModel):
    total_study_hours: int
    topics_count: int
    focus_areas: Dict[str, int]
    weekly_breakdown: Dict[str, int]

class StudyPlanResponse(BaseModel):
    plan: StudyPlan
    summary: StudyPlanSummary

def generate_uuid():
    return str(uuid.uuid4())