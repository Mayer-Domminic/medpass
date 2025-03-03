"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, parseISO, isSameDay } from "date-fns";

interface CalendarEvent {
  EventID: string;
  StudentID: number;
  Title: string;
  Description: string | null;
  StartTime: string;
  EndTime: string;
  Location: string | null;
  IsRecurring: boolean;
  RecurrenceRule: string | null;
}

interface EventsResponse {
  events: CalendarEvent[];
}

export function Calendar() {
  const { data: session } = useSession();
  const [date, setDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [eventDates, setEventDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        // Calculate time range for the month
        const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
        const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const startDateFormatted = startDate.toISOString();
        const endDateFormatted = endDate.toISOString();
        
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/calendar/events?start_date=${startDateFormatted}&end_date=${endDateFormatted}`,
          {
            headers: {
              Authorization: `Bearer ${session?.accessToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch events: ${response.statusText}`);
        }

        const data: EventsResponse = await response.json();
        setEvents(data.events);
        
        // Create a set of dates that have events for highlighting in the calendar
        const dates = new Set<string>();
        data.events.forEach(event => {
          const eventDate = parseISO(event.StartTime);
          dates.add(eventDate.toISOString().split('T')[0]);
        });
        setEventDates(dates);
        
      } catch (error) {
        console.error("Error fetching events:", error);
        setError(error instanceof Error ? error.message : "Failed to fetch calendar events");
      } finally {
        setLoading(false);
      }
    };

    if (session?.accessToken) {
      fetchEvents();
    }
  }, [date, session]);

  const handlePreviousMonth = () => {
    setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1));
  };

  const getDayEvents = (date: Date) => {
    return events.filter(event => {
      const eventStart = parseISO(event.StartTime);
      return isSameDay(eventStart, date);
    });
  };
  
  const selectedDayEvents = getDayEvents(selectedDate);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="md:col-span-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handlePreviousMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle>{format(date, 'MMMM yyyy')}</CardTitle>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-[350px] w-full" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
              modifiers={{
                hasEvent: (date) => 
                  eventDates.has(date.toISOString().split('T')[0])
              }}
              modifiersStyles={{
                hasEvent: { 
                  fontWeight: 'bold',
                  backgroundColor: "rgba(59, 130, 246, 0.1)",
                  borderRadius: "100%"
                }
              }}
            />
          )}
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          {events.length} events this month
        </CardFooter>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>
            Events for {format(selectedDate, 'MMMM d, yyyy')}
          </CardTitle>
          <CardDescription>
            {selectedDayEvents.length} events scheduled
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : selectedDayEvents.length > 0 ? (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {selectedDayEvents.map((event) => (
                  <div
                    key={event.EventID}
                    className="rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{event.Title}</h3>
                      {event.IsRecurring && (
                        <Badge variant="outline">Recurring</Badge>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="mr-2 h-3 w-3" />
                        {format(parseISO(event.StartTime), 'h:mm a')} - {format(parseISO(event.EndTime), 'h:mm a')}
                      </div>
                      {event.Location && (
                        <div className="mt-1">Location: {event.Location}</div>
                      )}
                      {event.Description && (
                        <div className="mt-2">{event.Description}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-center">
              <p className="text-muted-foreground">No events scheduled for this day.</p>
              <p className="text-muted-foreground mt-2">Free time could be perfect for studying!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}