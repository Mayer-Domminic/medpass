import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import { EventClickArg } from '@fullcalendar/core';

import EventModal from './event-form-modal';
import StudyPlanModal from './study-plan-modal';
import StudySessionModal from './study-session-modal';

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertCircle, 
  PlusCircle, 
  BrainCircuit, 
  RefreshCw,
  BookOpen,
  BarChart,
  FileDown,
  Loader2 
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// RecurrenceRule type
interface RecurrenceRule {
  frequency: string; 
  interval?: number;
  days_of_week?: number[]; 
  end_date?: string; 
  count?: number;
}

// Main CalendarEvent type
export interface CalendarEvent {
  id: string;
  student_id?: number; 
  title: string;
  description?: string;
  start: string;
  end: string;
  allDay: boolean; 
  type: string; 
  recurrence?: RecurrenceRule | null; 
  location?: string;
  color?: string;
  priority?: number;
  topicName?: string;
  completed?: boolean;
  createdAt?: string; 
  updatedAt?: string; 

  extendedProps?: {
    [key: string]: any;
    type: string;
    description?: string;
    location?: string;
    priority?: number;
    topicName?: string;
    completed?: boolean;
  };
}

// Study Session specialized type
export interface StudySession extends CalendarEvent {
  topicName: string;
  completed: boolean;
  plan_id?: string;
}

// EventCreatePayload for API
export interface EventCreatePayload {
  title: string;
  description?: string;
  start_time: string; 
  end_time: string; 
  all_day?: boolean;
  event_type: string;
  recurrence?: RecurrenceRule | null;
  location?: string;
  color?: string;
  priority?: number;
  topic_name?: string; 
  completed?: boolean;
}

// EventUpdatePayload for API
export interface EventUpdatePayload extends Partial<EventCreatePayload> {}

// WeaknessStrength for StudyPlan
export interface WeaknessStrength {
  subject: string;
  performance: number; 
  is_weakness?: boolean; 
  unit_type?: string; 
  performance_score?: number; 
}

// FullCalendarEvent for FullCalendar library
export interface FullCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  color?: string;
  extendedProps: {
    [key: string]: any;
    type: string;
    description?: string;
    location?: string;
    priority?: number;
    topicName?: string;
    completed?: boolean;
  };
}

// StudyPlan related types
export interface StudyPlanRequestPayload {
  exam_date: string; 
  weaknesses: WeaknessStrength[];
  strengths: WeaknessStrength[];
  events: CalendarEvent[];
  study_hours_per_day?: number;
  focus_areas?: string[];
  additional_notes?: string; 
}

export interface StudyPlanSummary {
  total_study_hours: number;
  topics_count: number;
  focus_areas: { [key: string]: number };
  weekly_breakdown: { [key: string]: number };
}

export interface StudyPlanGenerationResponse {
  plan: StudyPlanResponseData;
  summary: StudyPlanSummary;
}

export interface StudyPlanResponseData {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  examDate: string; 
  events: StudyPlanEventResponse[];
  createdAt: string;
}

export interface StudyPlanEventResponse {
  id: string;
  title: string;
  description?: string;
  start: string; 
  end: string; 
  allDay: boolean;
  type: string; 
  topicName?: string;
  completed?: boolean;
}

export interface StudyPlanProgress {
  total_sessions: number;
  completed_sessions: number;
  completion_percentage: number;
  hours_studied: number;
  hours_remaining: number;
  progress_by_topic: { [key: string]: number };
}

export interface RiskAssessment {
  risk_score: number;
  risk_level: 'Low' | 'Medium' | 'High';
  strengths: WeaknessStrength[];
  weaknesses: WeaknessStrength[];
  ml_prediction: {
    prediction: number;
    probability: number;
    prediction_text: string;
    confidence_score: number;
  };
  details?: {
    student_name?: string;
    total_exams?: number;
    passed_exams?: number;
    total_grades?: number;
  };
}

// ====== Integrated Calendar Utilities ======

// Helper function to generate a UUID
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Get color based on event type
export function getEventColor(eventType: string, completed?: boolean): string {
  if (eventType === 'study') {
    return completed ? '#059669' : '#10B981'; // Dark green for completed, light green for pending
  }
  
  switch (eventType.toLowerCase()) {
    case 'school': return '#3B82F6'; // Blue
    case 'work': return '#F59E0B';   // Yellow
    case 'extracurricular': return '#8B5CF6'; // Purple
    case 'personal': return '#EC4899'; // Pink
    default: return '#6B7280';      // Gray
  }
}

// Map backend event to frontend format
export const mapToFullCalendarEvent = (event: CalendarEvent): FullCalendarEvent => ({
  id: event.id,
  title: event.title,
  start: event.start,
  end: event.end,
  allDay: event.allDay,
  color: event.color || getEventColor(event.type, event.completed),
  extendedProps: {
    type: event.type,
    description: event.description,
    location: event.location,
    priority: event.priority,
    topicName: event.topicName,
    completed: event.completed,
  },
});

// Helper functions to track study progress
export function calculateStudyProgress(events: FullCalendarEvent[]) {
  const studyEvents = events.filter(e => e.extendedProps.type === 'study');
  const completedEvents = studyEvents.filter(e => e.extendedProps.completed);
  
  return {
    total: studyEvents.length,
    completed: completedEvents.length,
    percentage: studyEvents.length ? Math.round((completedEvents.length / studyEvents.length) * 100) : 0
  };
}

// Find latest study plan ID from events
export const findLatestStudyPlanId = (events: CalendarEvent[]): string | null => {
  try {
    // Filter for study events
    const studyEvents = events.filter(event => 
      event.type === 'study' || 
      (event.extendedProps && event.extendedProps.type === 'study')
    );
    
    if (studyEvents.length === 0) {
      return null;
    }
    
    // Extract plan IDs
    const planIds = studyEvents
      .map(event => {
        // Check different possible locations where plan_id might be stored
        if (event.extendedProps && event.extendedProps.plan_id) {
          return event.extendedProps.plan_id;
        }
        
        // Try other common locations
        return (event as any).plan_id || null;
      })
      .filter(Boolean); // Remove nulls
    
    if (planIds.length === 0) {
      return null;
    }
    
    // Remove duplicates and get the latest one (assuming they might be sorted by date)
    const uniquePlanIds = [...new Set(planIds)];
    return uniquePlanIds[0];
  } catch (error) {
    console.error("Error finding latest study plan ID:", error);
    return null;
  }
};

// Fetch events from API
export const fetchEvents = async (): Promise<CalendarEvent[]> => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/api/v1/calendar/events`;
    
    const token = await getAuthToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    
    const response = await fetch(url, { 
      headers,
      credentials: 'include'
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication required. Please log in again.");
      }
      
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
    }
    
    const events = await response.json();
    
    if (!Array.isArray(events)) {
      console.error("API Error: events endpoint did not return an array", events);
      return [];
    }
    
    return events.map(event => ({
      id: event.id || event.event_id,
      title: event.title || 'Untitled Event',
      start: event.start || event.start_time,
      end: event.end || event.end_time,
      allDay: event.all_day || event.allDay || false,
      type: event.event_type || event.type || 'other',
      description: event.description,
      location: event.location,
      color: event.color || getEventColor(event.event_type || event.type || 'other', event.completed),
      priority: event.priority,
      topicName: event.topic_name || event.topicName,
      completed: event.completed,
      extendedProps: {
        type: event.event_type || event.type || 'other',
        description: event.description,
        location: event.location,
        priority: event.priority,
        topicName: event.topic_name || event.topicName,
        completed: event.completed,
      }
    }));
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
};

// Create a new event
export const createEvent = async (payload: EventCreatePayload): Promise<CalendarEvent> => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/api/v1/calendar/events`;
    
    const token = await getAuthToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    
    // Map frontend format to backend expected format
    const backendPayload = {
      title: payload.title,
      description: payload.description,
      start_time: payload.start_time,
      end_time: payload.end_time,
      all_day: payload.all_day,
      event_type: payload.event_type,
      recurrence: payload.recurrence,
      location: payload.location,
      color: payload.color,
      priority: payload.priority,
      topic_name: payload.topic_name,
      completed: payload.completed
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(backendPayload),
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
    }
    
    const event = await response.json();
    
    // Map the response back to the frontend format
    return {
      id: event.id || event.event_id,
      title: event.title,
      start: event.start || event.start_time,
      end: event.end || event.end_time,
      allDay: event.all_day || false,
      type: event.event_type,
      description: event.description,
      location: event.location,
      color: event.color,
      priority: event.priority,
      topicName: event.topic_name,
      completed: event.completed,
      extendedProps: {
        type: event.event_type,
        description: event.description,
        location: event.location,
        priority: event.priority,
        topicName: event.topic_name,
        completed: event.completed
      }
    };
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
};

// Update an existing event
export const updateEvent = async (eventId: string, payload: EventUpdatePayload): Promise<CalendarEvent> => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/api/v1/calendar/events/${eventId}`;
    
    const token = await getAuthToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    
    // Only include defined fields to avoid setting null values
    const backendPayload: any = {};
    
    if (payload.title !== undefined) backendPayload.title = payload.title;
    if (payload.description !== undefined) backendPayload.description = payload.description;
    if (payload.start_time !== undefined) backendPayload.start_time = payload.start_time;
    if (payload.end_time !== undefined) backendPayload.end_time = payload.end_time;
    if (payload.all_day !== undefined) backendPayload.all_day = payload.all_day;
    if (payload.event_type !== undefined) backendPayload.event_type = payload.event_type;
    if (payload.recurrence !== undefined) backendPayload.recurrence = payload.recurrence;
    if (payload.location !== undefined) backendPayload.location = payload.location;
    if (payload.color !== undefined) backendPayload.color = payload.color;
    if (payload.priority !== undefined) backendPayload.priority = payload.priority;
    if (payload.topic_name !== undefined) backendPayload.topic_name = payload.topic_name;
    if (payload.completed !== undefined) backendPayload.completed = payload.completed;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(backendPayload),
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
    }
    
    const event = await response.json();
    
    // Map the response back to the frontend format
    return {
      id: event.id || event.event_id,
      title: event.title,
      start: event.start || event.start_time,
      end: event.end || event.end_time,
      allDay: event.all_day || false,
      type: event.event_type,
      description: event.description,
      location: event.location,
      color: event.color,
      priority: event.priority,
      topicName: event.topic_name,
      completed: event.completed,
      extendedProps: {
        type: event.event_type,
        description: event.description,
        location: event.location,
        priority: event.priority,
        topicName: event.topic_name,
        completed: event.completed
      }
    };
  } catch (error) {
    console.error("Error updating event:", error);
    throw error;
  }
};

// Delete an event
export const deleteEvent = async (eventId: string): Promise<boolean> => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/api/v1/calendar/events/${eventId}`;
    
    const token = await getAuthToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
};

// Export study plan as PDF
export const exportStudyPlanPdf = async (planId: string): Promise<Blob> => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/api/v1/calendar/export-plan/${planId}`;
    
    const token = await getAuthToken();
    
    const headers = {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Error exporting study plan: ${response.statusText}`);
    }
    
    return await response.blob();
  } catch (error) {
    console.error("Error exporting study plan:", error);
    throw error;
  }
};

// Get auth token from NextAuth session
export const getAuthToken = async () => {
  try {
    const session = await fetch('/api/auth/session');
    const data = await session.json();
    return data?.accessToken;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
};

// ====== Main Component ======

const CalendarView: React.FC = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const calendarRef = useRef<FullCalendar>(null);
  const [events, setEvents] = useState<FullCalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<boolean>(false);
  
  // Modal states
  const [isEventModalOpen, setIsEventModalOpen] = useState<boolean>(false);
  const [isStudyPlanModalOpen, setIsStudyPlanModalOpen] = useState<boolean>(false);
  const [isStudySessionModalOpen, setIsStudySessionModalOpen] = useState<boolean>(false);
  
  // Selected event states
  const [selectedEvent, setSelectedEvent] = useState<FullCalendarEvent | null>(null);
  const [selectedStudySession, setSelectedStudySession] = useState<StudySession | null>(null);
  const [selectedDateInfo, setSelectedDateInfo] = useState<DateClickArg | null>(null);
  
  // Calendar view state
  const [currentView, setCurrentView] = useState<string>('dayGridMonth');
  const [studyProgress, setStudyProgress] = useState<{total: number, completed: number, percentage: number}>({
    total: 0,
    completed: 0,
    percentage: 0
  });

  // Study plan ID for PDF download
  const [latestStudyPlanId, setLatestStudyPlanId] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  const { toast } = useToast();
  
  // Define custom styles for the calendar
  const calendarStyles = {
    calendarContainer: 'overflow-auto border border-gray-700 rounded-lg mt-4 bg-gray-800 shadow-xl calendar-container',
    headerToolbar: {
      start: 'prev,next today',
      center: 'title',
      end: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    buttonText: {
      today: 'Today',
      month: 'Month',
      week: 'Week',
      day: 'Day'
    },
  };

  // Fetch events from API
  const loadEvents = async () => {
    if (!session) {
      console.warn("No session available for API request");
      setAuthError(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setAuthError(false);
    
    try {
      const calendarEvents = await fetchEvents();
      console.log("Fetched events:", calendarEvents);
      const mappedEvents = calendarEvents.map(mapToFullCalendarEvent);
      setEvents(mappedEvents);
      
      // Calculate study progress
      setStudyProgress(calculateStudyProgress(mappedEvents));
      
      // Find the latest study plan ID (if any)
      const planId = findLatestStudyPlanId(calendarEvents);
      if (planId) {
        setLatestStudyPlanId(planId);
        console.log("Found study plan ID:", planId);
      }
    } catch (err: any) {
      console.error("Error fetching events:", err);
      
      if (err.message && err.message.includes("Authentication")) {
        setAuthError(true);
      } else {
        setError(err.message || 'Failed to fetch events');
      }
      
      toast({
        title: "Error Loading Events",
        description: err.message || 'Could not fetch calendar events from the server.',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session) {
      loadEvents();
    }
  }, [status, session]);

  // Handle clicking on a date cell
  const handleDateClick = (arg: DateClickArg) => {
    if (authError) {
      toast({
        title: "Authentication Required",
        description: "Please log in again to add events to your calendar.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedDateInfo(arg);
    setSelectedEvent(null);
    setIsEventModalOpen(true);
  };

  // Handle clicking on an existing event
  const handleEventClick = (arg: EventClickArg) => {
    if (authError) {
      toast({
        title: "Authentication Required",
        description: "Please log in again to edit calendar events.",
        variant: "destructive",
      });
      return;
    }
    
    const clickedEvent = events.find(e => e.id === arg.event.id);
    if (!clickedEvent) {
      console.error("Clicked event not found in state:", arg.event.id);
      toast({ 
        title: "Error", 
        description: "Could not find event details.", 
        variant: "destructive" 
      });
      return;
    }
    
    // Handle study sessions differently
    if (clickedEvent.extendedProps.type === 'study') {
      setSelectedStudySession({
        id: clickedEvent.id,
        title: clickedEvent.title,
        start: clickedEvent.start,
        end: clickedEvent.end,
        allDay: clickedEvent.allDay,
        type: clickedEvent.extendedProps.type,
        color: clickedEvent.color,
        description: clickedEvent.extendedProps.description,
        location: clickedEvent.extendedProps.location,
        priority: clickedEvent.extendedProps.priority,
        topicName: clickedEvent.extendedProps.topicName || 'General Study',
        completed: clickedEvent.extendedProps.completed || false,
        extendedProps: clickedEvent.extendedProps
      });
      setIsStudySessionModalOpen(true);
    } else {
      setSelectedEvent(clickedEvent);
      setSelectedDateInfo(null);
      setIsEventModalOpen(true);
    }
  };

  // Handle closing modals
  const handleModalClose = () => {
    setIsEventModalOpen(false);
    setIsStudyPlanModalOpen(false);
    setIsStudySessionModalOpen(false);
    setSelectedEvent(null);
    setSelectedStudySession(null);
    setSelectedDateInfo(null);
  };

  // Handle saving event (create/update)
  const handleEventSave = async (savedEvent: CalendarEvent) => {
    handleModalClose();
    await loadEvents();
    toast({
      title: "Success",
      description: `Event "${savedEvent.title}" saved successfully.`,
    });
  };

  // Handle deleting an event
  const handleEventDelete = async (eventId: string) => {
    handleModalClose();
    await loadEvents();
    toast({
      title: "Success",
      description: "Event deleted successfully.",
    });
  };

  // Handle successful study plan generation
  const handleStudyPlanGenerated = async (planId?: string) => {
    handleModalClose();
    await loadEvents();
    
    if (planId) {
      setLatestStudyPlanId(planId);
    }
    
    toast({
      title: "Study Plan Generated!",
      description: "Your new study schedule has been added to the calendar.",
      variant: "default",
    });
  };
  
  // Handle study session update
  const handleStudySessionSave = async (updatedSession: StudySession) => {
    handleModalClose();
    await loadEvents();
    toast({
      title: updatedSession.completed ? "Session Completed!" : "Session Updated",
      description: updatedSession.completed ? 
        "Great job! Your progress has been updated." : 
        "Your study session has been updated.",
    });
  };

  // Handle login redirect
  const handleRelogin = () => {
    router.push('/auth/login');
  };
  
  // Handle calendar view change
  const handleViewChange = (view: string) => {
    setCurrentView(view);
  };

  // Handle PDF export
  const handleExportPdf = async () => {
    if (!latestStudyPlanId) {
      toast({
        title: "No Study Plan Found",
        description: "Generate a study plan first to export a PDF.",
        variant: "destructive",
      });
      return;
    }
    
    setIsExportingPdf(true);
    
    try {
      // Fetch the PDF blob
      const pdfBlob = await exportStudyPlanPdf(latestStudyPlanId);
      
      // Create a URL for the blob
      const url = URL.createObjectURL(pdfBlob);
      
      // Create a download link
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `USMLE_Study_Plan_${latestStudyPlanId}.pdf`;
      document.body.appendChild(downloadLink);
      
      // Trigger download
      downloadLink.click();
      
      // Clean up
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
      
      toast({
        title: "PDF Downloaded",
        description: "Your study plan PDF has been downloaded successfully.",
      });
    } catch (err: any) {
      console.error("Error exporting PDF:", err);
      toast({
        title: "Export Failed",
        description: err.message || "Could not download the study plan PDF.",
        variant: "destructive",
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Inject custom CSS
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .fc {
        --fc-border-color: rgba(107, 114, 128, 0.3);
        --fc-page-bg-color: rgba(17, 24, 39, 0.8);
        --fc-neutral-bg-color: rgba(31, 41, 55, 0.5);
        --fc-neutral-text-color: rgb(229, 231, 235);
        --fc-event-bg-color: rgb(59, 130, 246);
        --fc-event-border-color: rgb(29, 78, 216);
        --fc-event-text-color: white;
        --fc-today-bg-color: rgba(59, 130, 246, 0.1);
        --fc-event-selected-overlay-color: rgba(255, 255, 255, 0.1);
        --fc-non-business-color: rgba(31, 41, 55, 0.1);
        --fc-highlight-color: rgba(59, 130, 246, 0.1);
      }
      .fc .fc-button {
        background-color: rgb(55, 65, 81);
        border-color: rgb(75, 85, 99);
        color: white;
      }
      .fc .fc-button:hover {
        background-color: rgb(75, 85, 99);
      }
      .fc .fc-button-primary:not(:disabled).fc-button-active,
      .fc .fc-button-primary:not(:disabled):active {
        background-color: rgb(37, 99, 235);
        border-color: rgb(29, 78, 216);
      }
      .fc-daygrid-day {
        min-height: 100px;
      }
      .fc-day-today {
        background-color: var(--fc-today-bg-color) !important;
      }
      .fc-theme-standard td, .fc-theme-standard th {
        border-color: var(--fc-border-color);
      }
      .fc-theme-standard .fc-scrollgrid {
        border-color: var(--fc-border-color);
      }
      .fc-col-header-cell {
        background-color: rgba(31, 41, 55, 0.8);
        padding: 8px 0;
      }
      .fc-event {
        cursor: pointer;
        padding: 2px 4px;
        border-radius: 4px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }
      .fc-event:hover {
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }
      .fc-event.fc-event-completed {
        opacity: 0.8;
        text-decoration: line-through;
      }
      .fc-h-event .fc-event-main {
        padding: 2px 4px;
      }
      .fc-toolbar-title {
        font-size: 1.5rem;
        font-weight: 600;
      }
      .fc-daygrid-day-number {
        padding: 6px;
        color: rgb(229, 231, 235);
      }
      .fc-daygrid-day-top {
        display: flex;
        justify-content: flex-end;
      }
      .fc-day-other .fc-daygrid-day-top {
        opacity: 0.6;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // Display loading indicator while fetching events
  if (loading && events.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Function to customize the event rendering
  const renderEventContent = (eventInfo: any) => {
    const { event } = eventInfo;
    const { extendedProps } = event;
    const isStudy = extendedProps.type === 'study';
    const isCompleted = extendedProps.completed;
    
    return (
      <div className={`fc-event-content overflow-hidden ${isCompleted ? 'opacity-80' : ''}`}>
        {isStudy && (
          <div className="flex items-center">
            <BookOpen className="h-3 w-3 mr-1 flex-shrink-0" />
            <div className={`truncate ${isCompleted ? 'line-through' : ''}`}>
              {event.title}
            </div>
          </div>
        )}
        {!isStudy && (
          <div className="truncate">
            {event.title}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-background text-foreground rounded-lg shadow-md h-screen overflow-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <h2 className="text-xl md:text-2xl font-semibold text-primary">My Calendar</h2>
        <div className="flex gap-2">
          {authError && (
            <Button 
              onClick={handleRelogin} 
              variant="outline" 
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh Login
            </Button>
          )}
          
          {/* Study Plan PDF Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleExportPdf}
                  variant="outline"
                  className={`bg-purple-600 hover:bg-purple-700 text-white ${!latestStudyPlanId ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!latestStudyPlanId || isExportingPdf || authError}
                >
                  {isExportingPdf ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="mr-2 h-4 w-4" />
                  )}
                  Export Study Plan
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {latestStudyPlanId ? 'Download your study plan as PDF' : 'Generate a study plan first'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button 
            onClick={() => setIsStudyPlanModalOpen(true)} 
            variant="outline" 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={authError}
          >
            <BrainCircuit className="mr-2 h-4 w-4" /> Generate Study Plan
          </Button>
          <Button 
            onClick={() => handleDateClick({ date: new Date(), allDay: true } as DateClickArg)} 
            className="bg-primary hover:bg-primary/90"
            disabled={authError}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Event
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}. Try refreshing the page or check your API configuration.
          </AlertDescription>
        </Alert>
      )}

      {authError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>
            Your session has expired or is invalid. Please log in again to continue.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Study Progress Card */}
      {studyProgress.total > 0 && (
        <Card className="mb-4 bg-gray-900 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-blue-500" />
              USMLE Step 1 Study Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>Completed Sessions: {studyProgress.completed} of {studyProgress.total}</span>
                  <span className="font-medium">{studyProgress.percentage}%</span>
                </div>
                <Progress value={studyProgress.percentage} className="h-2" />
              </div>
              
              <div className="flex flex-wrap gap-1">
                <Badge variant={studyProgress.percentage < 25 ? "destructive" : (studyProgress.percentage < 75 ? "outline" : "default")}>
                  {studyProgress.percentage < 25 
                    ? "Just Starting" 
                    : (studyProgress.percentage < 50 
                      ? "In Progress" 
                      : (studyProgress.percentage < 75 
                        ? "Well Underway" 
                        : (studyProgress.percentage < 100 
                          ? "Almost Done" 
                          : "Complete")))}
                </Badge>
                {studyProgress.percentage >= 100 && (
                  <Badge className="bg-green-600">All Sessions Complete!</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FullCalendar Component */}
      <div className={calendarStyles.calendarContainer}>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={calendarStyles.headerToolbar}
        buttonText={calendarStyles.buttonText}
        events={events}
        editable={!authError}
        selectable={!authError}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        height="auto"
        eventTimeFormat={{
          hour: 'numeric',
          minute: '2-digit',
          meridiem: 'short'
        }}
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        slotDuration="00:30:00"
        allDaySlot={true}
        nowIndicator={true}
        eventDisplay="block"
        stickyHeaderDates={true}
        
        dayHeaderFormat={{ 
          weekday: 'short', 
        }}
        
        views={{
          dayGridMonth: {
            columnHeaderFormat: { 
              weekday: 'short',
            }
          }
        }}
        
        eventContent={renderEventContent}
        viewDidMount={(info) => handleViewChange(info.view.type)}
        eventClassNames={(info) => {
          const { event } = info;
          const { extendedProps } = event;
          return extendedProps.completed ? 'fc-event-completed' : '';
        }}
      />
      </div>

      {/* Regular Event Modal */}
      {isEventModalOpen && (
        <EventModal
          isOpen={isEventModalOpen}
          onClose={handleModalClose}
          onSave={handleEventSave}
          onDelete={handleEventDelete}
          event={selectedEvent}
          dateInfo={selectedDateInfo}
        />
      )}

      {/* Study Plan Modal */}
      {isStudyPlanModalOpen && (
        <StudyPlanModal
          isOpen={isStudyPlanModalOpen}
          onClose={handleModalClose}
          onPlanGenerated={handleStudyPlanGenerated}
          existingEvents={events.filter(e => e.extendedProps?.type !== 'study')}
        />
      )}
      
      {/* Study Session Modal */}
      {isStudySessionModalOpen && selectedStudySession && (
        <StudySessionModal
          isOpen={isStudySessionModalOpen}
          onClose={handleModalClose}
          onSave={handleStudySessionSave}
          onDelete={handleEventDelete}
          event={selectedStudySession}
        />
      )}
    </div>
  );
};

export default CalendarView;