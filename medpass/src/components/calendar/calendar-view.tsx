import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import { EventClickArg } from '@fullcalendar/core';

import { CalendarEvent, FullCalendarEvent, StudySession } from '@/types/calendar';
import { fetchEvents, createEvent, updateEvent, deleteEvent, exportStudyPlanPdf } from '@/lib/calendarUtils';
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

// Helper to map backend event to FullCalendar event
const mapToFullCalendarEvent = (event: CalendarEvent): FullCalendarEvent => ({
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

// Get event color based on type and completion status
function getEventColor(eventType: string, completed?: boolean): string {
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

// Helper functions to track study progress
function calculateStudyProgress(events: FullCalendarEvent[]) {
  const studyEvents = events.filter(e => e.extendedProps.type === 'study');
  const completedEvents = studyEvents.filter(e => e.extendedProps.completed);
  
  return {
    total: studyEvents.length,
    completed: completedEvents.length,
    percentage: studyEvents.length ? Math.round((completedEvents.length / studyEvents.length) * 100) : 0
  };
}

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
      findLatestStudyPlanId(calendarEvents);
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

  // Find the latest study plan ID by looking at study events
  const findLatestStudyPlanId = (events: CalendarEvent[]) => {
    try {
      // Filter study events that might be part of a plan
      const studyEvents = events.filter(e => e.type === 'study');
      
      if (studyEvents.length === 0) {
        return;
      }
      
      // Extract plan IDs if available
      const planIds = studyEvents
        .map(e => {
          // Check for plan_id in extendedProps or other locations
          if (e.extendedProps && typeof e.extendedProps === 'object') {
            return (e.extendedProps as any).plan_id;
          }
          
          // Check other possible locations
          return (e as any).plan_id || (e as any).planId || null;
        })
        .filter(Boolean); // Remove nulls and undefined
      
      // If we found plan IDs, set the latest one
      if (planIds.length > 0) {
        // Use Set to remove duplicates and get the most recent one
        const uniquePlanIds = [...new Set(planIds)];
        setLatestStudyPlanId(uniquePlanIds[0]); // Most recent is usually first
        console.log("Found study plan ID:", uniquePlanIds[0]);
      } else {
        console.log("No study plan IDs found in events");
      }
    } catch (error) {
      console.error("Error finding latest study plan ID:", error);
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
        type: clickedEvent.extendedProps.type, // Add the type property
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
          
          {/* New Study Plan PDF Button */}
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