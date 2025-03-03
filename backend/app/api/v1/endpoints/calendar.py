from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
import os
import json
from datetime import datetime, timedelta
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from cryptography.fernet import Fernet

from ....core.database import get_db
from ....core.security import get_current_active_user
from app.models import LoginInfo as User
from app.models import Student, CalendarCredential, CalendarEvent
from ....schemas.pydantic_base_models.calendar_schemas import (
    CalendarEvent as CalendarEventSchema,
    CalendarEventResponse,
    GoogleCalendarAuthResponse,
    GoogleCalendarTokenExchange
)

router = APIRouter()

# Configure Google OAuth
SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']
CLIENT_SECRET_FILE = os.path.join(os.getcwd(), 'app', 'api', 'v1', 'endpoints', 'client_secret.json')

# Encryption key for tokens (should be stored securely in production)
# In production, this should be stored in environment variables or a secure vault
ENCRYPTION_KEY = os.environ.get("CALENDAR_ENCRYPTION_KEY")
if not ENCRYPTION_KEY:
    ENCRYPTION_KEY = Fernet.generate_key()
    print(f"Generated encryption key: {ENCRYPTION_KEY.decode()}")
cipher_suite = Fernet(ENCRYPTION_KEY)

def encrypt_token(token_data):
    """Encrypt token data before storing in database"""
    return cipher_suite.encrypt(json.dumps(token_data).encode())

def decrypt_token(encrypted_token):
    """Decrypt token data retrieved from database"""
    return json.loads(cipher_suite.decrypt(encrypted_token).decode())

def get_google_calendar_service(token_data):
    """Build and return a Google Calendar API service object"""
    credentials = Credentials.from_authorized_user_info(token_data, SCOPES)
    return build('calendar', 'v3', credentials=credentials)

@router.get("/auth", response_model=GoogleCalendarAuthResponse)
async def authorize_google_calendar(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Start the Google Calendar OAuth flow"""
    try:
        # Check if user is an admin
        if current_user.issuperuser:
            raise HTTPException(
                status_code=403,
                detail="Admin accounts cannot access calendar features"
            )
        
        # Get the student ID
        student = db.query(Student).filter(Student.logininfoid == current_user.logininfoid).first()
        if not student:
            raise HTTPException(
                status_code=404,
                detail="No student account found for this login"
            )
        
        # Create the OAuth flow
        flow = Flow.from_client_secrets_file(
            CLIENT_SECRET_FILE,
            scopes=SCOPES,
            redirect_uri=f"{request.base_url.scheme}://{request.base_url.netloc}/api/v1/calendar/callback"
        )
        
        # Generate the authorization URL
        auth_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent'  # Force to show consent screen to get refresh_token
        )
        
        # Store the flow state in a session or temporary storage
        # not implementing this yet, will in prod
        
        return {"auth_url": auth_url}
    
    except Exception as e:
        print(f"Authorization error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing your request: {str(e)}"
        )

@router.post("/token")
async def exchange_token(
    token_data: GoogleCalendarTokenExchange,
    db: Session = Depends(get_db)
):
    """Exchange authorization code for tokens and store them"""
    try:
        # Create the OAuth flow
        flow = Flow.from_client_secrets_file(
            CLIENT_SECRET_FILE,
            scopes=SCOPES,
            redirect_uri=f"{os.environ.get('NEXT_PUBLIC_API_URL')}/api/v1/calendar/callback"
        )
        
        # Exchange code for tokens
        flow.fetch_token(code=token_data.code)
        credentials = flow.credentials
        
        # Convert credentials to a dict for storage
        token_info = {
            'token': credentials.token,
            'refresh_token': credentials.refresh_token,
            'token_uri': credentials.token_uri,
            'client_id': credentials.client_id,
            'client_secret': credentials.client_secret,
            'scopes': credentials.scopes
        }
        
        # Encrypt the token data
        encrypted_token = encrypt_token(token_info)
        
        # Store or update the credentials in the database
        calendar_cred = db.query(CalendarCredential).filter(
            CalendarCredential.studentid == token_data.student_id
        ).first()
        
        if calendar_cred:
            calendar_cred.tokendata = encrypted_token
        else:
            calendar_cred = CalendarCredential(
                studentid=token_data.student_id,
                tokendata=encrypted_token
            )
            db.add(calendar_cred)
        
        db.commit()
        
        return {"message": "Calendar successfully connected"}
    
    except Exception as e:
        print(f"Token exchange error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing your request: {str(e)}"
        )

@router.get("/events", response_model=CalendarEventResponse)
async def get_calendar_events(
    start_date: str = None,
    end_date: str = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get calendar events for the current student"""
    try:
        # Check if user is an admin
        if current_user.issuperuser:
            raise HTTPException(
                status_code=403,
                detail="Admin accounts cannot access calendar features"
            )
        
        # Get the student ID
        student = db.query(Student).filter(Student.logininfoid == current_user.logininfoid).first()
        if not student:
            raise HTTPException(
                status_code=404,
                detail="No student account found for this login"
            )
        
        # Get the calendar credentials
        calendar_cred = db.query(CalendarCredential).filter(
            CalendarCredential.studentid == student.studentid
        ).first()
        
        if not calendar_cred:
            raise HTTPException(
                status_code=404,
                detail="Calendar not connected. Please connect your Google Calendar first."
            )
        
        # Decrypt the token data
        token_data = decrypt_token(calendar_cred.tokendata)
        
        # Build the Google Calendar service
        service = get_google_calendar_service(token_data)
        
        # Set time boundaries for the events query
        now = datetime.utcnow()
        time_min = start_date if start_date else now.isoformat() + 'Z'
        time_max = end_date if end_date else (now + timedelta(days=30)).isoformat() + 'Z'
        
        # Get events from Google Calendar
        events_result = service.events().list(
            calendarId='primary',
            timeMin=time_min,
            timeMax=time_max,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        events = events_result.get('items', [])
        
        # Convert Google Calendar events to our schema
        calendar_events = []
        for event in events:
            start = event.get('start', {})
            end = event.get('end', {})
            
            # Handle all-day events vs. timed events
            start_time = None
            if 'dateTime' in start:
                start_time = datetime.fromisoformat(start['dateTime'].replace('Z', '+00:00'))
            elif 'date' in start:
                start_time = datetime.fromisoformat(start['date'] + 'T00:00:00')
            
            end_time = None
            if 'dateTime' in end:
                end_time = datetime.fromisoformat(end['dateTime'].replace('Z', '+00:00'))
            elif 'date' in end:
                end_time = datetime.fromisoformat(end['date'] + 'T23:59:59')
            
            if start_time and end_time:
                calendar_event = CalendarEventSchema(
                    EventID=event['id'],
                    StudentID=student.studentid,
                    Title=event.get('summary', 'No Title'),
                    Description=event.get('description', ''),
                    StartTime=start_time,
                    EndTime=end_time,
                    Location=event.get('location', ''),
                    IsRecurring=bool(event.get('recurrence')),
                    RecurrenceRule=str(event.get('recurrence', [''])[0]) if event.get('recurrence') else None
                )
                calendar_events.append(calendar_event)
        
        return {"events": calendar_events}
    
    except Exception as e:
        print(f"Calendar events error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while retrieving calendar events: {str(e)}"
        )

@router.delete("/disconnect")
async def disconnect_calendar(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Disconnect Google Calendar integration"""
    try:
        # Check if user is an admin
        if current_user.issuperuser:
            raise HTTPException(
                status_code=403,
                detail="Admin accounts cannot access calendar features"
            )
        
        # Get the student ID
        student = db.query(Student).filter(Student.logininfoid == current_user.logininfoid).first()
        if not student:
            raise HTTPException(
                status_code=404,
                detail="No student account found for this login"
            )
        
        # Remove calendar credentials
        db.query(CalendarCredential).filter(
            CalendarCredential.studentid == student.studentid
        ).delete()
        
        db.commit()
        
        return {"message": "Calendar successfully disconnected"}
    
    except Exception as e:
        print(f"Calendar disconnect error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while disconnecting calendar: {str(e)}"
        )