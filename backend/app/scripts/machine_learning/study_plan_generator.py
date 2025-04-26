import os
import json
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import google.generativeai as genai
from fastapi import HTTPException
from app.core.config import settings

try:
    api_key = settings.GEMINI_API_KEYS # USE GEMINI SERVICE PLEASE
    if not api_key:
        print("Warning: No API key found for Gemini. Using fallback generator.")
        GEMINI_AVAILABLE = False
    else:
        genai.configure(api_key=api_key)
        GEMINI_AVAILABLE = True
except Exception as e:
    print(f"Error configuring Gemini API: {str(e)}")
    GEMINI_AVAILABLE = False

# Model to use
MODEL = "gemini-1.5-pro"

# Study session durations (in hours)
SESSION_DURATIONS = [1, 1.5, 2, 2.5, 3]

def generate_study_plan(
    student_id: int,
    exam_date: datetime,
    weaknesses: List[Dict[str, Any]],
    strengths: List[Dict[str, Any]],
    existing_events: List[Dict[str, Any]],
    study_hours_per_day: int = 4,
    focus_areas: Optional[List[str]] = None,
    additional_notes: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generate a personalized USMLE Step 1 study plan using Gemini AI.
    
    Args:
        student_id: The student's ID
        exam_date: Date of the USMLE Step 1 exam
        weaknesses: List of the student's academic weaknesses
        strengths: List of the student's academic strengths
        existing_events: List of existing calendar events
        study_hours_per_day: Desired hours of study per day
        focus_areas: Optional specific topics to focus on
        additional_notes: Optional additional instructions
        
    Returns:
        A dictionary containing the study plan and summary
    """
    try:
        # Make both datetimes naive or aware to avoid comparison issues
        # Convert exam_date to naive if it has timezone info
        if hasattr(exam_date, 'tzinfo') and exam_date.tzinfo is not None:
            # Convert to UTC then remove timezone info
            exam_date = exam_date.astimezone(timezone.utc).replace(tzinfo=None)
            
        # Calculate days until exam
        current_date = datetime.now()
        # Ensure current_date is also naive
        current_date = current_date.replace(tzinfo=None)
        
        days_until_exam = (exam_date - current_date).days
        
        if days_until_exam <= 0:
            raise HTTPException(
                status_code=400,
                detail="Exam date must be in the future"
            )
        
        # Prepare the prompt for Gemini
        if GEMINI_AVAILABLE:
            plan_data = generate_with_gemini(
                student_id=student_id,
                exam_date=exam_date,
                weaknesses=weaknesses,
                strengths=strengths,
                existing_events=existing_events,
                study_hours_per_day=study_hours_per_day,
                focus_areas=focus_areas,
                additional_notes=additional_notes,
                days_until_exam=days_until_exam
            )
            return plan_data
        else:
            print("fallback used")
            # Fallback to basic algorithm if Gemini is not available
            return generate_fallback_plan(
                student_id=student_id,
                exam_date=exam_date,
                weaknesses=weaknesses,
                strengths=strengths,
                existing_events=existing_events,
                study_hours_per_day=study_hours_per_day,
                focus_areas=focus_areas,
                days_until_exam=days_until_exam
            )
    
    except Exception as e:
        print(f"Error generating study plan: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate study plan: {str(e)}"
        )

def generate_with_gemini(
    student_id: int,
    exam_date: datetime,
    weaknesses: List[Dict[str, Any]],
    strengths: List[Dict[str, Any]],
    existing_events: List[Dict[str, Any]],
    study_hours_per_day: int,
    focus_areas: Optional[List[str]],
    additional_notes: Optional[str],
    days_until_exam: int
) -> Dict[str, Any]:
    """
    Generate a study plan using the Gemini API.
    """
    # Format the data for the prompt
    weakness_texts = [f"{w.get('subject', 'Unknown')}: {w.get('performance_score', w.get('performance', 0))}%" for w in weaknesses]
    strength_texts = [f"{s.get('subject', 'Unknown')}: {s.get('performance_score', s.get('performance', 0))}%" for s in strengths]
    
    # Format existing events to analyze available time slots
    event_texts = []
    for event in existing_events:
        start_time = event.get('start', "")
        end_time = event.get('end', "")
        event_type = event.get('type', event.get('event_type', "Unknown"))
        title = event.get('title', "Untitled")
        event_texts.append(f"{title} ({event_type}): {start_time} to {end_time}")
    
    # Build the prompt for Gemini
    prompt = f"""
    You are an expert USMLE Step 1 tutor. Create a personalized study plan for a medical student with the following parameters:

    BASIC INFORMATION:
    - Days until exam: {days_until_exam} days
    - Desired study hours per day: {study_hours_per_day} hours
    - Current date: {datetime.now().strftime('%Y-%m-%d')}
    - Exam date: {exam_date.strftime('%Y-%m-%d')}

    ACADEMIC PROFILE:
    - Weaknesses: {', '.join(weakness_texts)}
    - Strengths: {', '.join(strength_texts)}
    {f"- Requested focus areas: {', '.join(focus_areas)}" if focus_areas else ""}
    {f"- Additional notes: {additional_notes}" if additional_notes else ""}

    EXISTING COMMITMENTS:
    The student has the following existing calendar events:
    {chr(10).join(event_texts[:20])}
    {f"...and {len(event_texts) - 20} more events" if len(event_texts) > 20 else ""}

    STUDY PLAN REQUIREMENTS:
    1. Create a detailed study plan from today until the exam date
    2. Each study session should be 1-3 hours in length
    3. Focus more time on weaknesses (60-70% of study time)
    4. Space out topics to optimize learning (spaced repetition)
    5. Include regular review sessions of previous material
    6. Include regular practice tests (at least one per week)
    7. Include at least 2 full-length practice exams in the final 2 weeks
    8. Allocate 1-2 rest days per week with minimal or no studying

    FORMAT YOUR RESPONSE AS A JSON OBJECT with the following structure:
    {{
      "events": [
        {{
          "title": "Topic or activity name",
          "description": "Detailed study objectives and resources",
          "start": "YYYY-MM-DDTHH:MM:SS",
          "end": "YYYY-MM-DDTHH:MM:SS",
          "topic_name": "Subject area",
          "type": "study"
        }}, 
        ...more events
      ],
      "summary": {{
        "total_study_hours": 123,
        "topics_count": 15,
        "focus_areas": {{"Immunology": 12, "Cardiology": 8}},
        "weekly_breakdown": {{"Week 1": 20, "Week 2": 22}}
      }}
    }}

    Make sure ALL property names and string values are in DOUBLE QUOTES. All JSON must be properly formatted. Avoid single quotes or unquoted property names.
    Make sure all dates and times are in ISO format (YYYY-MM-DDTHH:MM:SS). Avoid scheduling study sessions during existing commitments.
    """
    
    try:
        # Make the API request to Gemini
        model = genai.GenerativeModel('gemini-1.5-pro')
        response = model.generate_content(prompt)
        
        if not response or not response.text:
            raise Exception("Empty response from Gemini API")
        
        # Extract JSON from the response
        response_text = response.text
        
        # Sometimes the response comes with markdown code blocks
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        # Print the raw JSON for debugging
        print("Raw JSON response (first 100 chars):", response_text[:100])
        
        # Validate and fix JSON if needed
        try:
            # Parse the JSON response
            plan_data = json.loads(response_text)
        except json.JSONDecodeError as json_err:
            print(f"JSON parsing error: {str(json_err)}")
            
            # Attempt to fix common JSON issues (like single quotes instead of double quotes)
            fixed_text = response_text.replace("'", "\"")
            try:
                plan_data = json.loads(fixed_text)
                print("Successfully fixed and parsed JSON after replacing quotes")
            except:
                # If fixing didn't work, fall back to the default generator
                raise Exception(f"Could not parse JSON response: {str(json_err)}")
        
        # Validate the response format
        if "events" not in plan_data or "summary" not in plan_data:
            raise Exception("Invalid response format from Gemini API")
        
        # Process the events into the expected format for the API
        study_events = process_study_events(plan_data["events"], student_id)
        
        # Create the final response
        return {
            "plan": {
                "id": f"plan_{student_id}_{int(datetime.now().timestamp())}",
                "title": "USMLE Step 1 Study Plan",
                "description": f"Personalized study plan focusing on {', '.join([w.get('subject', '') for w in weaknesses[:3]])}",
                "startDate": datetime.now().isoformat(),
                "endDate": exam_date.isoformat(),
                "examDate": exam_date.isoformat(),
                "events": study_events,
                "createdAt": datetime.now().isoformat()
            },
            "summary": plan_data["summary"]
        }
    
    except Exception as e:
        print(f"Gemini API error: {str(e)}")
        # Fall back to the basic algorithm
        return generate_fallback_plan(
            student_id=student_id,
            exam_date=exam_date,
            weaknesses=weaknesses,
            strengths=strengths,
            existing_events=existing_events,
            study_hours_per_day=study_hours_per_day,
            focus_areas=focus_areas,
            days_until_exam=days_until_exam
        )
        
def process_study_events(events, student_id):
    processed_events = []
    event_id_base = f"study_{student_id}_{int(datetime.now().timestamp())}"
    
    for i, event in enumerate(events):
        # generate a unique id for each event
        event_id = f"{event_id_base}_{i}"
        
        # parse dates and times
        try:
            # make sure the dates are properly formatted
            start_time = event.get("start", "")
            end_time = event.get("end", "")
            
            # Add the event to the processed list
            processed_events.append({
                "id": event_id,
                "title": event.get("title", "Study Session"),
                "description": event.get("description", ""),
                "start": start_time,
                "end": end_time,
                "allDay": False,
                "type": "study",
                "topicName": event.get("topic_name", event.get("subject", "")),
                "completed": False
            })
        except Exception as e:
            print(f"Error processing event: {str(e)}")
            continue
    
    return processed_events

def generate_fallback_plan(
    student_id: int,
    exam_date: datetime,
    weaknesses: List[Dict[str, Any]],
    strengths: List[Dict[str, Any]],
    existing_events: List[Dict[str, Any]],
    study_hours_per_day: int,
    focus_areas: Optional[List[str]],
    days_until_exam: int
) -> Dict[str, Any]:
    
    # Extract subject names
    weakness_subjects = [w.get('subject', 'Unknown') for w in weaknesses]
    strength_subjects = [s.get('subject', 'Unknown') for s in strengths]
    
    if focus_areas:
        focus_subjects = focus_areas
    else:
        focus_subjects = weakness_subjects
    
    # All subjects to cover
    all_subjects = list(set(weakness_subjects + strength_subjects + (focus_subjects or [])))
    
    # Standard USMLE Step 1 subjects to add if not in the list
    standard_subjects = [
        "Anatomy", "Biochemistry", "Microbiology", "Immunology", 
        "Pathology", "Pharmacology", "Physiology", "Behavioral Sciences"
    ]
    
    for subject in standard_subjects:
        if subject not in all_subjects:
            all_subjects.append(subject)
    
    # Create events list
    events = []
    event_id_base = f"study_{student_id}_{int(datetime.now().timestamp())}"
    start_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Dictionary to track time spent on each subject
    subject_hours = {subject: 0 for subject in all_subjects}
    weekly_hours = {"Week 1": 0}
    
    # Calculate total study hours needed based on days until exam
    total_hours_needed = days_until_exam * study_hours_per_day * 0.7  # Accounting for rest days
    
    # Function to check if time slot conflicts with existing events
    def has_conflict(event_start, event_end):
        for existing in existing_events:
            try:
                # Parse existing event dates
                existing_start = datetime.fromisoformat(existing.get('start', "").replace('Z', '+00:00'))
                existing_end = datetime.fromisoformat(existing.get('end', "").replace('Z', '+00:00'))
                
                # Check for overlap
                if (event_start <= existing_end and event_end >= existing_start):
                    return True
            except:
                continue
        return False
    
    # Generate events
    current_date = start_date
    week_number = 1
    total_study_hours = 0
    
    while current_date < exam_date:
        # Skip to next day if it's a rest day (e.g., Sunday)
        if current_date.weekday() == 6:  # Sunday
            current_date += timedelta(days=1)
            continue
            
        # Check if we need to start a new week
        days_from_start = (current_date - start_date).days
        current_week = (days_from_start // 7) + 1
        week_key = f"Week {current_week}"
        
        if week_key not in weekly_hours:
            weekly_hours[week_key] = 0
            week_number = current_week
        
        # Determine daily study hours (slightly randomize)
        daily_hours = min(study_hours_per_day, random.randint(study_hours_per_day-1, study_hours_per_day+1))
        
        # Morning session
        morning_start = current_date.replace(hour=9, minute=0)
        morning_duration = random.choice([1.5, 2, 2.5])
        morning_end = morning_start + timedelta(hours=morning_duration)
        
        # Afternoon session
        afternoon_start = current_date.replace(hour=14, minute=0)
        afternoon_duration = random.choice([1.5, 2, 2.5])
        afternoon_end = afternoon_start + timedelta(hours=afternoon_duration)
        
        # Evening session
        evening_start = current_date.replace(hour=19, minute=0)
        evening_duration = random.choice([1, 1.5, 2])
        evening_end = evening_start + timedelta(hours=evening_duration)
        
        # Create sessions
        sessions = []
        
        # Check and add sessions if no conflicts
        if not has_conflict(morning_start, morning_end):
            sessions.append((morning_start, morning_end, morning_duration))
            
        if not has_conflict(afternoon_start, afternoon_end):
            sessions.append((afternoon_start, afternoon_end, afternoon_duration))
            
        if not has_conflict(evening_start, evening_end) and len(sessions) < 2:
            sessions.append((evening_start, evening_end, evening_duration))
        
        # Determine session topics
        for i, (session_start, session_end, duration) in enumerate(sessions):
            # Prioritize weaknesses
            if i == 0 or random.random() < 0.7:
                # Select a weakness subject
                if weakness_subjects:
                    subject = random.choice(weakness_subjects)
                else:
                    subject = random.choice(all_subjects)
            else:
                # Review a strength or random subject
                if strength_subjects:
                    subject = random.choice(strength_subjects)
                else:
                    subject = random.choice(all_subjects)
            
            # Update tracking
            subject_hours[subject] = subject_hours.get(subject, 0) + duration
            weekly_hours[week_key] = weekly_hours.get(week_key, 0) + duration
            total_study_hours += duration
            
            # Full practice test near the exam
            days_to_exam = (exam_date - session_start).days
            if days_to_exam <= 14 and days_to_exam % 7 == 0:
                title = "Full Length Practice Exam"
                description = "Complete a timed USMLE Step 1 practice exam under test-like conditions."
                subject = "Practice Exam"
            else:
                # Regular study session
                title = f"{subject} Study Session"
                description = f"Focus on key concepts in {subject}. Review notes, complete practice questions."
            
            # Add the event
            event_id = f"{event_id_base}_{len(events)}"
            events.append({
                "id": event_id,
                "title": title,
                "description": description,
                "start": session_start.isoformat(),
                "end": session_end.isoformat(),
                "allDay": False,
                "type": "study",
                "topicName": subject,
                "completed": False
            })
        
        # Move to next day
        current_date += timedelta(days=1)
    
    # Filter subject_hours to remove subjects with zero hours
    subject_hours = {k: v for k, v in subject_hours.items() if v > 0}
    
    # Create the final response
    return {
        "plan": {
            "id": f"plan_{student_id}_{int(datetime.now().timestamp())}",
            "title": "USMLE Step 1 Study Plan",
            "description": f"Personalized study plan focusing on {', '.join(weakness_subjects[:3])}",
            "startDate": start_date.isoformat(),
            "endDate": exam_date.isoformat(),
            "examDate": exam_date.isoformat(),
            "events": events,
            "createdAt": datetime.now().isoformat()
        },
        "summary": {
            "total_study_hours": round(total_study_hours),
            "topics_count": len(subject_hours),
            "focus_areas": subject_hours,
            "weekly_breakdown": weekly_hours
        }
    }