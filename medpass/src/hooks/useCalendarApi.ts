import { useCallback } from 'react';
import { useSession } from "next-auth/react";
import {
  CalendarEvent,
  EventCreatePayload,
  EventUpdatePayload,
  RiskAssessment,
  StudyPlanRequestPayload,
  StudyPlanGenerationResponse,
  CalendarApi,
} from '@/types/calendar';

export function useCalendarApi(): CalendarApi {
  const { data: session } = useSession();

  // Helper function to get the API base URL
  const getApiBaseUrl = () => {
    // Use the environment variable if available, otherwise infer from window location
    return process.env.NEXT_PUBLIC_API_URL || 
           (typeof window !== 'undefined' ? `${window.location.origin}` : '');
  };

  // Helper to handle fetch requests and errors
  const fetchApi = useCallback(async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    // Get token from NextAuth session
    const token = session?.accessToken;
    
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api/v1${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      console.log(`Fetching from: ${url}`, { method: options.method || 'GET' });
      const response = await fetch(url, { ...options, headers });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { detail: response.statusText };
        }
        console.error('API Error Response:', errorData);
        throw new Error(errorData?.detail || `HTTP error! status: ${response.status}`);
      }

      // Handle No Content responses
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return { message: 'Operation successful' } as T;
      }

      return await response.json() as T;
    } catch (error) {
      console.error('API Fetch Error:', error);
      throw error;
    }
  }, [session]);

  const getEvents = useCallback(async (): Promise<CalendarEvent[]> => {
    try {
      const events = await fetchApi<any[]>('/calendar/events');
      
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
        color: event.color,
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
      return [];
    }
  }, [fetchApi]);

  const createEvent = useCallback(async (payload: EventCreatePayload): Promise<CalendarEvent> => {
    // Transform the payload from frontend to backend format
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
    };

    const event = await fetchApi<any>('/calendar/events', {
      method: 'POST',
      body: JSON.stringify(backendPayload),
    });

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
      extendedProps: {
        type: event.event_type,
        description: event.description,
        location: event.location,
        priority: event.priority,
      }
    };
  }, [fetchApi]);

  const updateEvent = useCallback(async (eventId: string, payload: EventUpdatePayload): Promise<CalendarEvent> => {
    // Transform any frontend-specific fields to match backend expectations
    const backendPayload: any = {};
    
    // Only include defined fields to avoid setting null values
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

    const event = await fetchApi<any>(`/calendar/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(backendPayload),
    });

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
      extendedProps: {
        type: event.event_type,
        description: event.description,
        location: event.location,
        priority: event.priority,
      }
    };
  }, [fetchApi]);

  const deleteEvent = useCallback(async (eventId: string): Promise<{ message: string }> => {
    return await fetchApi<{ message: string }>(`/calendar/events/${eventId}`, {
      method: 'DELETE',
    });
  }, [fetchApi]);

  const getRiskAssessment = useCallback(async (): Promise<RiskAssessment> => {
    try {
      // using a placeholder ID for testing
      const studentId = 1;
      
      return await fetchApi<RiskAssessment>(`/info/risk?student_id=${studentId}`);
    } catch (error) {
      console.error("Error fetching risk assessment:", error);
      // Return a default/fallback risk assessment
      return {
        risk_score: 0,
        risk_level: 'Medium',
        strengths: [],
        weaknesses: [],
        ml_prediction: {
          prediction: -1,
          probability: 0,
          prediction_text: "Error loading prediction",
          confidence_score: 0
        },
        details: {}
      };
    }
  }, [fetchApi]);

  const generateStudyPlan = useCallback(async (payload: StudyPlanRequestPayload): Promise<StudyPlanGenerationResponse> => {
    // Transform frontend payload to match backend
    const backendPayload = {
      exam_date: payload.exam_date,
      weaknesses: payload.weaknesses.map(w => ({
        subject: w.subject,
        performance: w.performance,
        is_weakness: true
      })),
      strengths: payload.strengths.map(s => ({
        subject: s.subject,
        performance: s.performance,
        is_weakness: false
      })),
      events: payload.events.map(e => ({
        title: e.title,
        description: e.description,
        start: e.start,
        end: e.end,
        all_day: e.allDay,
        event_type: e.type,
        location: e.location,
        color: e.color,
        priority: e.priority
      })),
      study_hours_per_day: payload.study_hours_per_day,
      focus_areas: payload.focus_areas,
      additional_notes: payload.additional_notes
    };

    return await fetchApi<StudyPlanGenerationResponse>('/calendar/generate-plan', {
      method: 'POST',
      body: JSON.stringify(backendPayload),
    });
  }, [fetchApi]);

  return {
    getEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    getRiskAssessment,
    generateStudyPlan,
  };
}