import { CalendarEvent, EventCreatePayload, EventUpdatePayload } from '@/types/calendar';
import { getSession } from 'next-auth/react';

// Set to false to use the real API
const USE_MOCK_API = false;

// API utility functions without hooks
export const getApiBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || 
         (typeof window !== 'undefined' ? `${window.location.origin}` : '');
};

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

// Helper function to fetch data from API
export const fetchFromApi = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  // Use mock API if enabled
  if (USE_MOCK_API) {
    console.log(`MOCK API: ${endpoint}`, options);
    // Return mock data...
    return mockResponse(endpoint, options) as T;
  }
  
  // Real API implementation
  const baseUrl = getApiBaseUrl();
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

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { detail: response.statusText };
      }
      console.error('API Error Response:', errorData);
      
      // Handle authentication errors specifically
      if (response.status === 401) {
        throw new Error("Authentication required. Please log in again.");
      }
      
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
function getEventColor(eventType: string): string {
  switch (eventType.toLowerCase()) {
    case 'school': return '#3B82F6'; // Blue
    case 'study': return '#10B981';  // Green
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
    color: event.color || getEventColor(event.event_type || event.type || 'other'),
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

// Debug function to test API connection
export const testApiConnection = async () => {
  try {
    console.log('Testing API connection...');
    console.log('API_BASE_URL:', process.env.NEXT_PUBLIC_API_URL);
    
    const headers = await getHeaders();
    console.log('Auth headers:', headers);
    
    const baseUrl = getApiBaseUrl();
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