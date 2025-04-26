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
from app.scripts.machine_learning.study_plan_generator import generate_study_plan
from app.scripts.machine_learning.pdf_generator import generate_study_plan_pdf

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

# Generate a study plan
@router.post("/generate-plan", response_model=StudyPlanResponse)
async def generate_study_plan_endpoint(
    plan_request: dict = Body(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Generates a personalized study plan based on student data and preferences.
    Replaces any existing study plans for the student.
    """
    try:
        # Get student ID from user
        student_id = await get_student_id(current_user, db)
        
        # First, check for and delete any existing study plans for this student
        existing_plans = db.query(StudyPlan).filter(StudyPlan.student_id == student_id).all()
        if existing_plans:
            # Get all event IDs associated with existing plans
            plan_ids = [plan.plan_id for plan in existing_plans]
            study_plan_events = db.query(StudyPlanEvent).filter(
                StudyPlanEvent.plan_id.in_(plan_ids)
            ).all()
            
            # Get the event IDs that need to be deleted
            event_ids = [event.event_id for event in study_plan_events]
            
            # Delete the study plan events first (due to foreign key constraints)
            for event in study_plan_events:
                db.delete(event)
            
            # Then delete the calendar events
            for event_id in event_ids:
                calendar_event = db.query(CalendarEvent).filter(
                    CalendarEvent.event_id == event_id
                ).first()
                if calendar_event:
                    db.delete(calendar_event)
            
            # Finally delete the study plans
            for plan in existing_plans:
                db.delete(plan)
            
            # Commit the deletions
            db.commit()
            print(f"Deleted {len(existing_plans)} existing study plans for student {student_id}")
        
        # Extract required fields from plan_request
        try:
            exam_date_str = plan_request.get("exam_date", "")
            exam_date = datetime.fromisoformat(exam_date_str.replace("Z", "+00:00"))
            # Convert to naive datetime to avoid timezone comparison issues
            exam_date = exam_date.replace(tzinfo=None)
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid exam date format: {str(e)}"
            )
        
        weaknesses = plan_request.get("weaknesses", [])
        strengths = plan_request.get("strengths", [])
        events = plan_request.get("events", [])
        study_hours_per_day = plan_request.get("study_hours_per_day", 4)
        focus_areas = plan_request.get("focus_areas")
        additional_notes = plan_request.get("additional_notes")
        
        # Generate the study plan using our AI-powered generator
        plan_data = generate_study_plan(
            student_id=student_id,
            exam_date=exam_date,
            weaknesses=weaknesses,
            strengths=strengths,
            existing_events=events,
            study_hours_per_day=study_hours_per_day,
            focus_areas=focus_areas,
            additional_notes=additional_notes
        )
        
        # Fix float to int conversion for validation
        if "summary" in plan_data:
            if "focus_areas" in plan_data["summary"]:
                plan_data["summary"]["focus_areas"] = {
                    k: int(round(float(v))) for k, v in plan_data["summary"]["focus_areas"].items()
                }
            if "weekly_breakdown" in plan_data["summary"]:
                plan_data["summary"]["weekly_breakdown"] = {
                    k: int(round(float(v))) for k, v in plan_data["summary"]["weekly_breakdown"].items()
                }
        
        # Generate plan ID
        plan_id = generate_uuid()
        
        # Create study plan record in database
        db_plan = StudyPlan(
            plan_id=plan_id,
            student_id=student_id,
            title=plan_data["plan"]["title"],
            description=plan_data["plan"]["description"],
            start_date=datetime.fromisoformat(plan_data["plan"]["startDate"].replace("Z", "+00:00")),
            end_date=datetime.fromisoformat(plan_data["plan"]["endDate"].replace("Z", "+00:00")),
            exam_date=exam_date,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(db_plan)
        
        # Create calendar events and study plan event links
        for event_data in plan_data["plan"]["events"]:
            # Create calendar event
            event_id = event_data.get("id") or generate_uuid()
            
            # Parse start and end time
            start_time = datetime.fromisoformat(event_data["start"].replace("Z", "+00:00"))
            end_time = datetime.fromisoformat(event_data["end"].replace("Z", "+00:00"))
            
            # Create calendar event
            db_event = CalendarEvent(
                event_id=event_id,
                student_id=student_id,
                title=event_data["title"],
                description=event_data.get("description", ""),
                start_time=start_time,
                end_time=end_time,
                all_day=event_data.get("allDay", False),
                event_type="study",
                location=event_data.get("location"),
                color="#10B981",  # Green for study events
                priority=event_data.get("priority", 3),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            db.add(db_event)
            
            # Create study plan event link
            db_plan_event = StudyPlanEvent(
                plan_id=plan_id,
                event_id=event_id,
                topic_id=generate_uuid(),
                topic_name=event_data.get("topicName", ""),
                difficulty=3,  # Default medium difficulty
                importance=3,  # Default medium importance
                completed=False
            )
            
            db.add(db_plan_event)
        
        db.commit()
        
        # Update the plan ID in the response
        plan_data["plan"]["id"] = plan_id
        
        # Return the plan data directly without validation
        return plan_data
        
    except Exception as e:
        db.rollback()
        print(f"Error generating study plan: {str(e)}")
        
        if isinstance(e, HTTPException):
            raise e
            
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate study plan: {str(e)}"
        )
                
# Export study plan as PDF
@router.get("/export-plan/{plan_id}")
async def export_study_plan(
    plan_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Exports a study plan as a PDF for printing or saving
    """
    try:
        # Get student ID from user
        student_id = await get_student_id(current_user, db)
        
        # Get the study plan
        study_plan = db.query(StudyPlan).filter(
            StudyPlan.plan_id == plan_id,
            StudyPlan.student_id == student_id
        ).first()
        
        if not study_plan:
            raise HTTPException(
                status_code=404,
                detail="Study plan not found"
            )
        
        # Get student information
        student = db.query(Student).filter(Student.studentid == student_id).first()
        student_name = f"{student.firstname} {student.lastname}" if student else "Medical Student"
        
        # Get all events for this plan
        plan_events = db.query(StudyPlanEvent).filter(StudyPlanEvent.plan_id == plan_id).all()
        
        if not plan_events:
            raise HTTPException(
                status_code=404,
                detail="No events found for this study plan"
            )
        
        # Get the calendar events linked to this plan
        event_ids = [pe.event_id for pe in plan_events]
        events = db.query(CalendarEvent).filter(CalendarEvent.event_id.in_(event_ids)).all()
        
        # Convert events to the format expected by the PDF generator
        formatted_events = []
        for event in events:
            plan_event = next((pe for pe in plan_events if pe.event_id == event.event_id), None)
            
            formatted_events.append({
                "id": event.event_id,
                "title": event.title,
                "description": event.description,
                "start": event.start_time.isoformat(),
                "end": event.end_time.isoformat(),
                "allDay": event.all_day,
                "type": event.event_type,
                "topicName": plan_event.topic_name if plan_event else "",
                "completed": plan_event.completed if plan_event else False
            })
        
        # Organize data for the PDF generator
        study_plan_data = {
            "plan": {
                "id": study_plan.plan_id,
                "title": study_plan.title,
                "description": study_plan.description,
                "startDate": study_plan.start_date.isoformat(),
                "endDate": study_plan.end_date.isoformat(),
                "examDate": study_plan.exam_date.isoformat(),
                "events": formatted_events,
                "createdAt": study_plan.created_at.isoformat()
            },
            "summary": calculate_study_plan_summary(formatted_events)
        }
        
        # Generate the PDF
        return generate_study_plan_pdf(
            student_id=student_id,
            student_name=student_name,
            study_plan_data=study_plan_data
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error exporting study plan: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export study plan: {str(e)}"
        )

def calculate_study_plan_summary(events):
    """Helper function to calculate summary statistics for a study plan"""
    from datetime import datetime, timedelta
    from collections import defaultdict
    
    # Initialize summary
    summary = {
        "total_study_hours": 0,
        "topics_count": 0,
        "focus_areas": {},
        "weekly_breakdown": {}
    }
    
    if not events:
        return summary
    
    # Track unique topics and hours by topic
    topics = set()
    focus_areas = defaultdict(float)
    weekly_hours = defaultdict(float)
    
    # Calculate start of the first week
    min_date = min(datetime.fromisoformat(event["start"].replace("Z", "+00:00")) for event in events)
    week_start = min_date - timedelta(days=min_date.weekday())  # Start of the week (Monday)
    
    # Process each event
    for event in events:
        start_time = datetime.fromisoformat(event["start"].replace("Z", "+00:00"))
        end_time = datetime.fromisoformat(event["end"].replace("Z", "+00:00"))
        
        # Calculate duration in hours
        duration_hours = (end_time - start_time).total_seconds() / 3600
        
        # Add to total hours
        summary["total_study_hours"] += duration_hours
        
        # Add to topic stats
        topic = event.get("topicName", "General Study")
        if topic:
            topics.add(topic)
            focus_areas[topic] += duration_hours
        
        # Calculate week number
        days_since_start = (start_time.date() - week_start.date()).days
        week_num = (days_since_start // 7) + 1
        week_key = f"Week {week_num}"
        
        # Add to weekly breakdown
        weekly_hours[week_key] += duration_hours
    
    # Update summary
    summary["topics_count"] = len(topics)
    summary["focus_areas"] = dict(focus_areas)
    summary["weekly_breakdown"] = dict(weekly_hours)
    summary["total_study_hours"] = round(summary["total_study_hours"])
    
    return summary


@router.patch("/events/{event_id}/complete")
async def update_event_completion(
    event_id: str,
    completed: bool = Body(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Mark a study session as completed or incomplete
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
        
        # Check if event is study type
        if db_event.event_type != "study":
            raise HTTPException(
                status_code=400,
                detail="Only study sessions can be marked as completed"
            )
        
        # Get related study plan event if it exists
        study_plan_event = db.query(StudyPlanEvent).filter(
            StudyPlanEvent.event_id == event_id
        ).first()
        
        # Update completion status
        db_event.updated_at = datetime.utcnow()
        
        # Update completion status in study plan event if it exists
        if study_plan_event:
            study_plan_event.completed = completed
            
        # Convert to response model
        response = Event(
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
        
        db.commit()
        
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error updating event completion status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while updating the event completion status"
        )

@router.get("/study-plan-progress/{plan_id}")
async def get_study_plan_progress(
    plan_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get progress statistics for a specific study plan
    """
    try:
        # Get student ID from user
        student_id = await get_student_id(current_user, db)
        
        # Check if study plan exists and belongs to this student
        study_plan = db.query(StudyPlan).filter(
            StudyPlan.plan_id == plan_id,
            StudyPlan.student_id == student_id
        ).first()
        
        if not study_plan:
            raise HTTPException(
                status_code=404,
                detail="Study plan not found"
            )
        
        # Get all events for this plan
        plan_events = db.query(StudyPlanEvent).filter(
            StudyPlanEvent.plan_id == plan_id
        ).all()
        
        if not plan_events:
            return {
                "total_sessions": 0,
                "completed_sessions": 0,
                "completion_percentage": 0,
                "hours_studied": 0,
                "hours_remaining": 0,
                "progress_by_topic": {}
            }
        
        # Get the calendar events linked to this plan
        event_ids = [pe.event_id for pe in plan_events]
        events = db.query(CalendarEvent).filter(
            CalendarEvent.event_id.in_(event_ids)
        ).all()
        
        # Calculate statistics
        total_sessions = len(events)
        completed_sessions = sum(1 for pe in plan_events if pe.completed)
        completion_percentage = (completed_sessions / total_sessions * 100) if total_sessions > 0 else 0
        
        # Calculate hours studied and remaining
        hours_studied = 0
        hours_remaining = 0
        progress_by_topic = {}
        
        for event, plan_event in zip(events, plan_events):
            # Calculate duration in hours
            start_time = event.start_time
            end_time = event.end_time
            duration_hours = (end_time - start_time).total_seconds() / 3600
            
            # Add to totals
            if plan_event.completed:
                hours_studied += duration_hours
            else:
                hours_remaining += duration_hours
            
            # Track progress by topic
            topic = plan_event.topic_name or "General"
            if topic not in progress_by_topic:
                progress_by_topic[topic] = {
                    "total_sessions": 0,
                    "completed_sessions": 0,
                    "percentage": 0
                }
            
            progress_by_topic[topic]["total_sessions"] += 1
            if plan_event.completed:
                progress_by_topic[topic]["completed_sessions"] += 1
        
        # Calculate percentage complete for each topic
        for topic in progress_by_topic:
            total = progress_by_topic[topic]["total_sessions"]
            completed = progress_by_topic[topic]["completed_sessions"]
            progress_by_topic[topic]["percentage"] = (completed / total * 100) if total > 0 else 0
        
        return {
            "total_sessions": total_sessions,
            "completed_sessions": completed_sessions,
            "completion_percentage": round(completion_percentage, 1),
            "hours_studied": round(hours_studied, 1),
            "hours_remaining": round(hours_remaining, 1),
            "progress_by_topic": progress_by_topic
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting study plan progress: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get study plan progress: {str(e)}"
        )