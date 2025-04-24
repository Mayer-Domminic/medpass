import os
import json
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from pydantic import Field

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models import Student, LoginInfo as User
from app.models.calendar_models import CalendarEvent, StudyPlan, StudyPlanEvent
from app.schemas.calendar import (
    Event,
    EventCreate,
    EventUpdate,
    StudyPlanCreate,
    StudyPlanUpdate,
    StudyPlanRequest,
    StudyPlanResponse,
    StudyPlanSummary,
    WeaknessStrength,
    generate_uuid,
)
router = APIRouter()

# Helper function to get student_id from current user
async def get_student_id(current_user: User, db: Session) -> int:
    student = db.query(Student).filter(Student.logininfoid == current_user.logininfoid).first()
    if not student:
        # For testing, return a default student ID
        print("WARNING: No student found for user, using default ID")
        return 1
    return student.studentid

# Get all calendar events for the current user
@router.get("/events", response_model=List[Event])
async def get_calendar_events(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get all calendar events for the current user
    """
    try:
        # Get student ID from user
        student_id = await get_student_id(current_user, db)
        
        # Get all events for the student
        events = db.query(CalendarEvent).filter(CalendarEvent.student_id == student_id).all()
        
        # Convert to response model
        response = []
        for event in events:
            response.append(Event(
                id=event.event_id,
                title=event.title,
                description=event.description,
                start=event.start_time.isoformat(),
                end=event.end_time.isoformat(),
                all_day=event.all_day,
                type=event.event_type,
                recurrence=event.recurrence,
                location=event.location,
                color=event.color,
                priority=event.priority
            ))
        
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting calendar events: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while fetching calendar events: {str(e)}"
        )

# Get a single calendar event by ID
@router.get("/events/{event_id}", response_model=Event)
async def get_calendar_event(
    event_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get a single calendar event by ID
    """
    try:
        # Get student ID from user
        student_id = await get_student_id(current_user, db)
        
        # Get the event
        event = db.query(CalendarEvent).filter(
            CalendarEvent.event_id == event_id,
            CalendarEvent.student_id == student_id
        ).first()
        
        if not event:
            raise HTTPException(
                status_code=404,
                detail="Event not found"
            )
        
        # Convert to response model
        return Event(
            id=event.event_id,
            title=event.title,
            description=event.description,
            start=event.start_time.isoformat(),
            end=event.end_time.isoformat(),
            all_day=event.all_day,
            type=event.event_type,
            recurrence=event.recurrence,
            location=event.location,
            color=event.color,
            priority=event.priority
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting calendar event: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching the calendar event"
        )

# Create a new calendar event
@router.post("/events", response_model=Event)
async def create_calendar_event(
    event: EventCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new calendar event
    """
    try:
        # Get student ID from user
        student_id = await get_student_id(current_user, db)
        
        # Generate a new event ID
        event_id = generate_uuid()
        
        # Create the event in the database
        db_event = CalendarEvent(
            event_id=event_id,
            student_id=student_id,
            title=event.title,
            description=event.description,
            start_time=event.start_time,
            end_time=event.end_time,
            all_day=event.all_day,
            event_type=event.event_type,
            recurrence=event.recurrence.model_dump() if event.recurrence else None,
            location=event.location,
            color=event.color,
            priority=event.priority,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(db_event)
        db.commit()
        db.refresh(db_event)
        
        # Convert to response model
        return Event(
            id=db_event.event_id,
            title=db_event.title,
            description=db_event.description,
            start=db_event.start_time.isoformat(),
            end=db_event.end_time.isoformat(),
            all_day=db_event.all_day,
            type=db_event.event_type,
            recurrence=db_event.recurrence,
            location=db_event.location,
            color=db_event.color,
            priority=db_event.priority
        )
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error creating calendar event: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while creating the calendar event: {str(e)}"
        )

# Update a calendar event
@router.put("/events/{event_id}", response_model=Event)
async def update_calendar_event(
    event_id: str,
    event: EventUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update a calendar event
    """
    try:
        # Get student ID from user
        student_id = await get_student_id(current_user, db)
        
        # Get the event
        db_event = db.query(CalendarEvent).filter(
            CalendarEvent.event_id == event_id,
            CalendarEvent.student_id == student_id
        ).first()
        
        if not db_event:
            raise HTTPException(
                status_code=404,
                detail="Event not found"
            )
        
        # Update the event fields
        if event.title is not None:
            db_event.title = event.title
        if event.description is not None:
            db_event.description = event.description
        if event.start_time is not None:
            db_event.start_time = event.start_time
        if event.end_time is not None:
            db_event.end_time = event.end_time
        if event.all_day is not None:
            db_event.all_day = event.all_day
        if event.event_type is not None:
            db_event.event_type = event.event_type
        if event.recurrence is not None:
            db_event.recurrence = event.recurrence.model_dump()
        if event.location is not None:
            db_event.location = event.location
        if event.color is not None:
            db_event.color = event.color
        if event.priority is not None:
            db_event.priority = event.priority
        
        # Update the event in the database
        db_event.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_event)
        
        # Convert to response model
        return Event(
            id=db_event.event_id,
            title=db_event.title,
            description=db_event.description,
            start=db_event.start_time.isoformat(),
            end=db_event.end_time.isoformat(),
            all_day=db_event.all_day,
            type=db_event.event_type,
            recurrence=db_event.recurrence,
            location=db_event.location,
            color=db_event.color,
            priority=db_event.priority
        )
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error updating calendar event: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while updating the calendar event"
        )

# Delete a calendar event
@router.delete("/events/{event_id}")
async def delete_calendar_event(
    event_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete a calendar event
    """
    try:
        # Get student ID from user
        student_id = await get_student_id(current_user, db)
        
        # Get the event
        db_event = db.query(CalendarEvent).filter(
            CalendarEvent.event_id == event_id,
            CalendarEvent.student_id == student_id
        ).first()
        
        if not db_event:
            raise HTTPException(
                status_code=404,
                detail="Event not found"
            )
        
        # Check if the event is linked to a study plan
        study_plan_event = db.query(StudyPlanEvent).filter(
            StudyPlanEvent.event_id == event_id
        ).first()
        
        # If it's part of a study plan, just delete the event link
        if study_plan_event:
            db.delete(study_plan_event)
        
        # Delete the event
        db.delete(db_event)
        db.commit()
        
        return {"message": "Event deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error deleting calendar event: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while deleting the calendar event"
        )

# MOCK implementation of Risk API endpoint
@router.get("/risk")
async def get_risk_assessment(
    student_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Mock implementation of risk assessment for student
    """
    # Return mock risk assessment data for testing
    return {
        "risk_score": 65,
        "risk_level": "Medium",
        "strengths": [
            {"subject": "Cardiology", "unit_type": "Course", "performance": 92, "performance_score": 92},
            {"subject": "Biochemistry", "unit_type": "Course", "performance": 88, "performance_score": 88},
            {"subject": "Pharmacology", "unit_type": "Exam", "performance": 85, "performance_score": 85}
        ],
        "weaknesses": [
            {"subject": "Immunology", "unit_type": "Course", "performance": 68, "performance_score": 68},
            {"subject": "Neurology", "unit_type": "Exam", "performance": 72, "performance_score": 72},
            {"subject": "Microbiology", "unit_type": "Course", "performance": 65, "performance_score": 65}
        ],
        "ml_prediction": {
            "prediction": 1,
            "probability": 0.8,
            "prediction_text": "On-time graduation likely",
            "confidence_score": 80
        },
        "details": {
            "student_name": "Test Student",
            "total_exams": 5,
            "passed_exams": 4
        }
    }

# Generate a study plan
@router.post("/generate-plan", response_model=StudyPlanResponse)
async def generate_study_plan(
    plan_request: dict = Body(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Generates a study plan based on student data and preferences.
    """
    try:
        # Get student ID from user
        student_id = await get_student_id(current_user, db)
        
        # Parse examination date
        exam_date = datetime.fromisoformat(plan_request.get("exam_date").replace("Z", "+00:00"))
        
        # Generate plan ID
        plan_id = generate_uuid()
        
        # Create a simple mock study plan
        study_events = []
        start_date = datetime.now()
        
        # Get weak subjects from the request
        weak_subjects = [w.get("subject") for w in plan_request.get("weaknesses", [])]
        
        # Create study sessions for weak areas
        for i in range(14):
            session_date = datetime.now() + timedelta(days=i)
            
            if i % 2 == 0 and weak_subjects:
                # Focus on weak subjects
                subject = weak_subjects[i % len(weak_subjects)]
                event_title = f"{subject} Study"
                event_desc = f"Focus session on {subject} fundamentals"
                topic_name = subject
            else:
                # General study
                event_title = "General Study"
                event_desc = "Review session with practice questions"
                topic_name = "Multiple Topics"
            
            # Create event for this study session
            event_id = generate_uuid()
            
            # Create times for the event
            start_time = datetime(
                session_date.year, 
                session_date.month, 
                session_date.day, 
                14 if i % 2 == 0 else 18, 
                0, 
                0
            )
            end_time = datetime(
                session_date.year, 
                session_date.month, 
                session_date.day, 
                16 if i % 2 == 0 else 20, 
                0, 
                0
            )
            
            # Create calendar event in database
            db_event = CalendarEvent(
                event_id=event_id,
                student_id=student_id,
                title=event_title,
                description=event_desc,
                start_time=start_time,
                end_time=end_time,
                all_day=False,
                event_type="study",
                location="Library" if i % 3 == 0 else "Home",
                color="#10B981",  # Green for study events
                priority=4 if "Exam Review" in event_title else 3,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            db.add(db_event)
            
            # Create study plan event link
            db_plan_event = StudyPlanEvent(
                plan_id=plan_id,
                event_id=event_id,
                topic_id=generate_uuid(),
                topic_name=topic_name,
                difficulty=4 if topic_name in weak_subjects else 2,
                importance=4 if topic_name in weak_subjects else 3,
                completed=False
            )
            
            db.add(db_plan_event)
            
            # Add to response events list
            study_events.append({
                "id": event_id,
                "title": event_title,
                "description": event_desc,
                "start": start_time.isoformat(),
                "end": end_time.isoformat(),
                "allDay": False,
                "type": "study",
                "topicName": topic_name,
                "completed": False
            })
        
        # Create study plan record
        db_plan = StudyPlan(
            plan_id=plan_id,
            student_id=student_id,
            title="USMLE Step 1 Study Plan",
            description="Personalized study plan focusing on weak areas",
            start_date=start_date,
            end_date=exam_date,
            exam_date=exam_date,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(db_plan)
        db.commit()
        
        # Generate study plan summary 
        study_hours = len(study_events) * 2  # Each event is 2 hours
        topic_counts = {}
        for event in study_events:
            topic = event["topicName"]
            if topic not in topic_counts:
                topic_counts[topic] = 0
            topic_counts[topic] += 1
            
        # Create the response
        response = {
            "plan": {
                "id": plan_id,
                "title": "USMLE Step 1 Study Plan",
                "description": "Personalized study plan focusing on weak areas",
                "startDate": start_date.isoformat(),
                "endDate": exam_date.isoformat(),
                "examDate": exam_date.isoformat(),
                "events": study_events,
                "createdAt": datetime.utcnow().isoformat()
            },
            "summary": {
                "total_study_hours": study_hours,
                "topics_count": len(topic_counts),
                "focus_areas": {k: v for k, v in topic_counts.items()},
                "weekly_breakdown": {
                    "Week 1": 7 * 2,  # 7 days × 2 hours
                    "Week 2": 7 * 2   # 7 days × 2 hours
                }
            }
        }
        
        return response
    
    except Exception as e:
        db.rollback()
        print(f"Error generating study plan: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate study plan: {str(e)}"
        )