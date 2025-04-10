export type EventType = 'class' | 'study' | 'work' | 'extracurricular' | 'exam' | 'other';

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval?: number;
  daysOfWeek?: number[];
  endDate?: string;
  count?: number;
}

export interface Event {
  id?: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  allDay?: boolean;
  type: EventType;
  recurrence?: RecurrenceRule;
  location?: string;
  color?: string;
  priority?: number;
  topicName?: string;
  completed?: boolean;
}

export interface StudyPlan {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  examDate: string;
  events: Event[];
  createdAt: string;
}

export interface WeaknessStrength {
  subject: string;
  performance: number;
  isWeakness: boolean;
}

export interface StudyPlanRequest {
  examDate: string;
  weaknesses: WeaknessStrength[];
  strengths: WeaknessStrength[];
  events: Event[];
  studyHoursPerDay?: number;
  focusAreas?: string[];
}