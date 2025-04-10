from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Identity, DateTime, JSON, Text
from sqlalchemy.orm import relationship
from app.core.base import Base
from datetime import datetime

class CalendarEvent(Base):
    __tablename__ = 'calendar_events'

    event_id = Column('event_id', String(36), primary_key=True)
    student_id = Column('student_id', Integer, ForeignKey('student.studentid'), nullable=False)
    title = Column('title', String(255), nullable=False)
    description = Column('description', Text)
    start_time = Column('start_time', DateTime, nullable=False)
    end_time = Column('end_time', DateTime, nullable=False)
    all_day = Column('all_day', Boolean, default=False)
    event_type = Column('event_type', String(50), nullable=False)
    recurrence = Column('recurrence', JSON, nullable=True)
    location = Column('location', String(255))
    color = Column('color', String(50))
    priority = Column('priority', Integer)
    created_at = Column('created_at', DateTime, default=datetime.utcnow)
    updated_at = Column('updated_at', DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    student = relationship('Student', back_populates='calendar_events')
    study_plan_events = relationship('StudyPlanEvent', back_populates='event')

class StudyPlan(Base):
    __tablename__ = 'study_plans'

    plan_id = Column('plan_id', String(36), primary_key=True)
    student_id = Column('student_id', Integer, ForeignKey('student.studentid'), nullable=False)
    title = Column('title', String(255), nullable=False)
    description = Column('description', Text)
    start_date = Column('start_date', DateTime, nullable=False)
    end_date = Column('end_date', DateTime, nullable=False)
    exam_date = Column('exam_date', DateTime, nullable=False)
    created_at = Column('created_at', DateTime, default=datetime.utcnow)
    updated_at = Column('updated_at', DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    student = relationship('Student', back_populates='study_plans')
    events = relationship('StudyPlanEvent', back_populates='plan')

class StudyPlanEvent(Base):
    __tablename__ = 'study_plan_events'

    id = Column('id', Integer, Identity(start=1, increment=1), primary_key=True)
    plan_id = Column('plan_id', String(36), ForeignKey('study_plans.plan_id'), nullable=False)
    event_id = Column('event_id', String(36), ForeignKey('calendar_events.event_id'), nullable=False)
    topic_id = Column('topic_id', String(36), nullable=True)
    topic_name = Column('topic_name', String(255), nullable=True)
    difficulty = Column('difficulty', Integer, nullable=True)
    importance = Column('importance', Integer, nullable=True)
    completed = Column('completed', Boolean, default=False)
    
    plan = relationship('StudyPlan', back_populates='events')
    event = relationship('CalendarEvent', back_populates='study_plan_events')