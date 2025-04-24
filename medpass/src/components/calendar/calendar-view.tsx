import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import { EventClickArg } from '@fullcalendar/core';

import { CalendarEvent, FullCalendarEvent } from '@/types/calendar';
import { fetchEvents, createEvent, updateEvent, deleteEvent, testApiConnection } from '@/lib/calendarUtils';
import EventModal from './event-form-modal';
import StudyPlanModal from './study-plan-modal';

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, PlusCircle, BrainCircuit, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Helper to map backend event to FullCalendar event
const mapToFullCalendarEvent = (event: CalendarEvent): FullCalendarEvent => ({
  id: event.id,
  title: event.title,
  start: event.start,
  end: event.end,
  allDay: event.allDay,
  color: event.color || (event.type === 'study' ? '#10B981' : '#3B82F6'),
  extendedProps: {
    type: event.type,
    description: event.description,
    location: event.location,
    priority: event.priority,
    topicName: event.topicName,
    completed: event.completed,
  },
});

const CalendarView: React.FC = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const calendarRef = useRef<FullCalendar>(null);
  const [events, setEvents] = useState<FullCalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<boolean>(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState<boolean>(false);
  const [isStudyPlanModalOpen, setIsStudyPlanModalOpen] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<FullCalendarEvent | null>(null);
  const [selectedDateInfo, setSelectedDateInfo] = useState<DateClickArg | null>(null);

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
      setEvents(calendarEvents.map(mapToFullCalendarEvent));
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
    if (clickedEvent) {
      setSelectedEvent(clickedEvent);
      setSelectedDateInfo(null);
      setIsEventModalOpen(true);
    } else {
      console.error("Clicked event not found in state:", arg.event.id);
      toast({ 
        title: "Error", 
        description: "Could not find event details.", 
        variant: "destructive" 
      });
    }
  };

  // Handle closing modals
  const handleModalClose = () => {
    setIsEventModalOpen(false);
    setIsStudyPlanModalOpen(false);
    setSelectedEvent(null);
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
  const handleStudyPlanGenerated = async () => {
    handleModalClose();
    await loadEvents();
    toast({
      title: "Study Plan Generated!",
      description: "Your new study schedule has been added to the calendar.",
      variant: "default",
    });
  };

  // Handle login redirect
  const handleRelogin = () => {
    router.push('/auth/login');
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

  if (loading && events.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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
          dayHeaderFormat={{ weekday: 'short', month: 'numeric', day: 'numeric', omitCommas: true }}
        />
      </div>

      {/* Event Modal */}
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
    </div>
  );
};

export default CalendarView;