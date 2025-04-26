export interface RecurrenceRule {
  frequency: string; 
  interval?: number;
  days_of_week?: number[]; 
  end_date?: string; 
  count?: number;
}

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

export interface StudySession extends CalendarEvent {
  topicName: string;
  completed: boolean;
  plan_id?: string;
}

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

export interface EventUpdatePayload extends Partial<EventCreatePayload> {}

export interface WeaknessStrength {
  subject: string;
  performance: number; 
  is_weakness?: boolean; 
  unit_type?: string; 
  performance_score?: number; 
}

export interface MLPrediction {
  prediction: number; 
  probability: number;
  prediction_text: string;
  confidence_score: number;
}

export interface RiskAssessment {
  risk_score: number;
  risk_level: 'Low' | 'Medium' | 'High';
  strengths: WeaknessStrength[];
  weaknesses: WeaknessStrength[];
  ml_prediction: MLPrediction;
  details?: {
    student_name?: string;
    total_exams?: number;
    passed_exams?: number;
    total_grades?: number;
    ml_model_accuracy?: number;
  };
}

export interface StudyPlanRequestPayload {
  exam_date: string; 
  weaknesses: WeaknessStrength[];
  strengths: WeaknessStrength[];
  events: CalendarEvent[];
  study_hours_per_day?: number;
  focus_areas?: string[];
  additional_notes?: string; 
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

// StudyPlanAnalytics displays progress over time
export interface StudyPlanProgress {
  total_sessions: number;
  completed_sessions: number;
  completion_percentage: number;
  hours_studied: number;
  hours_remaining: number;
  progress_by_topic: { [key: string]: number }; // percentage completed by topic
}

// Type for API interaction functions
export interface CalendarApi {
  getEvents: () => Promise<CalendarEvent[]>;
  createEvent: (payload: EventCreatePayload) => Promise<CalendarEvent>;
  updateEvent: (eventId: string, payload: EventUpdatePayload) => Promise<CalendarEvent>;
  deleteEvent: (eventId: string) => Promise<{ message: string }>;
  getRiskAssessment: () => Promise<RiskAssessment>; 
  generateStudyPlan: (payload: StudyPlanRequestPayload) => Promise<StudyPlanGenerationResponse>;
  markEventCompleted: (eventId: string, completed: boolean) => Promise<CalendarEvent>;
  exportPlanAsPdf: (planId: string) => Promise<Blob>;
  getStudyPlanProgress: (planId: string) => Promise<StudyPlanProgress>;
}

// Type for FullCalendar event mapping
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