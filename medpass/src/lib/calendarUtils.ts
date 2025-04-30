import { CalendarEvent, EventCreatePayload, EventUpdatePayload, StudyPlanProgress } from '@/types/calendar';
import { getSession } from 'next-auth/react';

// Set to false to use the real API
const USE_MOCK_API = false;

// Get auth token from NextAuth session
export const getAuthToken = async () => {
  try {
    const session = await getSession();
    return session?.accessToken;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
};

// Format request headers with auth token
export const getHeaders = async () => {
  const token = await getAuthToken();
  
  if (!token) {
    console.warn("No auth token available for API request");
  }
  
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

// Helper function to safely extract error details from various error formats
const extractErrorMessage = (errorData: any): string => {
  if (!errorData) {
    return "Unknown error occurred";
  }
  
  // If it's a string, return it directly
  if (typeof errorData === 'string') {
    return errorData;
  }
  
  // If it has a detail property, use that
  if (errorData.detail) {
    return errorData.detail;
  }
  
  // If it's an array, try to extract messages from it
  if (Array.isArray(errorData)) {
    const messages = errorData
      .map(item => {
        if (typeof item === 'string') return item;
        if (item.detail) return item.detail;
        if (item.message) return item.message;
        return null;
      })
      .filter(Boolean);
    
    if (messages.length > 0) {
      return messages.join(", ");
    }
  }
  
  // If it's an object with a message property
  if (errorData.message) {
    return errorData.message;
  }
  
  // If nothing works, stringify it
  try {
    return JSON.stringify(errorData);
  } catch (e) {
    return "Error occurred but details could not be parsed";
  }
};

// Helper function to fetch data from API with improved error handling
export const fetchFromApi = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  // Use mock API if enabled
  if (USE_MOCK_API) {
    console.log(`MOCK API: ${endpoint}`, options);
    // Return mock data...
    return mockResponse(endpoint, options) as T;
  }
  
  // Real API implementation
  const baseUrl = `http://medpass.unr.dev`;
  const url = `${baseUrl}/api/v1${endpoint}`;
  
  // Get fresh headers with auth token for each request
  const headers = {
    ...await getHeaders(),
    ...options.headers
  };
  
  try {
    console.log(`Fetching from: ${url}`, { method: options.method || 'GET' });
    const response = await fetch(url, { 
      ...options, 
      headers,
      credentials: 'include' // Include cookies in the request
    });

    // First handle authentication errors
    if (response.status === 401) {
      throw new Error("Authentication required. Please log in again.");
    }

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        // If the response is not JSON, use the status text
        errorData = { detail: response.statusText };
      }
      console.error('API Error Response:', errorData);
      
      // Extract a meaningful error message from potentially complex error data
      const errorMessage = extractErrorMessage(errorData);
      throw new Error(errorMessage || `HTTP error! status: ${response.status}`);
    }

    // Handle No Content responses
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return { message: 'Operation successful' } as T;
    }

    // For successful responses, try to parse JSON
    try {
      return await response.json() as T;
    } catch (jsonError) {
      console.error('Error parsing JSON:', jsonError);
      throw new Error('Response received but could not parse JSON');
    }
  } catch (error) {
    console.error('API Fetch Error:', error);
    throw error;
  }
};

// Mock response function (only used if USE_MOCK_API is true)
function mockResponse(endpoint: string, options: RequestInit): any {
  // Mock implementation (same as before)
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  
  // Return default mock responses based on endpoint and method
  // ...
  
  // Default mock response
  return {};
}

// Helper function to get color based on event type
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
export const mapEventToFrontend = (event: any): CalendarEvent => {
  return {
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
  };
};

// Map frontend event format to backend format
export const mapEventToBackend = (event: EventCreatePayload | EventUpdatePayload): any => {
  const backendPayload: any = {};
  
  // Only include defined fields
  if ('title' in event && event.title !== undefined) backendPayload.title = event.title;
  if ('description' in event && event.description !== undefined) backendPayload.description = event.description;
  if ('start_time' in event && event.start_time !== undefined) backendPayload.start_time = event.start_time;
  if ('end_time' in event && event.end_time !== undefined) backendPayload.end_time = event.end_time;
  if ('all_day' in event && event.all_day !== undefined) backendPayload.all_day = event.all_day;
  if ('event_type' in event && event.event_type !== undefined) backendPayload.event_type = event.event_type;
  if ('recurrence' in event && event.recurrence !== undefined) backendPayload.recurrence = event.recurrence;
  if ('location' in event && event.location !== undefined) backendPayload.location = event.location;
  if ('color' in event && event.color !== undefined) backendPayload.color = event.color;
  if ('priority' in event && event.priority !== undefined) backendPayload.priority = event.priority;
  if ('topic_name' in event && event.topic_name !== undefined) backendPayload.topic_name = event.topic_name;
  if ('completed' in event && event.completed !== undefined) backendPayload.completed = event.completed;
  
  return backendPayload;
};

// Calendar API functions
export const fetchEvents = async (): Promise<CalendarEvent[]> => {
  try {
    const events = await fetchFromApi<any[]>('/calendar/events');
    
    if (!Array.isArray(events)) {
      console.error("API Error: events endpoint did not return an array", events);
      return [];
    }
    
    return events.map(mapEventToFrontend);
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
};

export const createEvent = async (payload: EventCreatePayload): Promise<CalendarEvent | null> => {
  try {
    const backendPayload = mapEventToBackend(payload);
    
    const event = await fetchFromApi<any>('/calendar/events', {
      method: 'POST',
      body: JSON.stringify(backendPayload),
    });
    
    if (!event) {
      console.error("Create event returned null or undefined");
      return null;
    }
    
    return mapEventToFrontend(event);
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
};

export const updateEvent = async (eventId: string, payload: EventUpdatePayload): Promise<CalendarEvent | null> => {
  try {
    const backendPayload = mapEventToBackend(payload);
    
    const event = await fetchFromApi<any>(`/calendar/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(backendPayload),
    });
    
    return mapEventToFrontend(event);
  } catch (error) {
    console.error("Error updating event:", error);
    throw error;
  }
};

export const deleteEvent = async (eventId: string): Promise<boolean> => {
  try {
    await fetchFromApi<{ message: string }>(`/calendar/events/${eventId}`, {
      method: 'DELETE',
    });
    return true;
  } catch (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
};

export const markEventComplete = async (eventId: string, completed: boolean): Promise<CalendarEvent | null> => {
  try {
    const event = await fetchFromApi<any>(`/calendar/events/${eventId}/complete`, {
      method: 'PATCH',
      body: JSON.stringify({ completed }),
    });
    
    return mapEventToFrontend(event);
  } catch (error) {
    console.error("Error marking event complete:", error);
    throw error;
  }
};

export const exportStudyPlanPdf = async (planId: string): Promise<Blob> => {
  try {
    const response = await fetch(`http://medpass.unr.dev/api/v1/calendar/export-plan/${planId}`, {
      method: 'GET',
      headers: await getHeaders(),
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

export const getStudyPlanProgress = async (planId: string): Promise<StudyPlanProgress> => {
  try {
    return await fetchFromApi<StudyPlanProgress>(`/calendar/study-plan-progress/${planId}`);
  } catch (error) {
    console.error("Error getting study plan progress:", error);
    throw error;
  }
};

// Debug function to test API connection
export const testApiConnection = async () => {
  try {
    console.log('Testing API connection...');
    console.log('API_BASE_URL:', process.env.NEXT_PUBLIC_API_URL);
    
    const headers = await getHeaders();
    console.log('Auth headers:', headers);
    
    const baseUrl = `http://medpass.unr.dev`;
    const url = `${baseUrl}/api/v1/calendar/events`;
    
    console.log('Fetching from URL:', url);
    
    const response = await fetch(url, {
      headers,
      credentials: 'include'
    });
    
    console.log('API Response Status:', response.status);
    console.log('Response OK?', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Events data:', data);
      return { success: true, data };
    } else {
      let errorText;
      try {
        const errorData = await response.json();
        errorText = JSON.stringify(errorData);
      } catch (e) {
        errorText = await response.text();
      }
      console.log('Error response:', errorText);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.error('Test API connection error:', error);
    return { success: false, error: String(error) };
  }
};

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