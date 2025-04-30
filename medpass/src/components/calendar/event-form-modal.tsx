import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { DateClickArg } from '@fullcalendar/interaction';
import { CalendarEvent, EventCreatePayload, EventUpdatePayload, FullCalendarEvent, createEvent, updateEvent, deleteEvent } from './calendar-view';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
  event: FullCalendarEvent | null;
  dateInfo: DateClickArg | null;
}

const EventModal: React.FC<EventModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete, 
  event, 
  dateInfo 
}) => {
  const { toast } = useToast();

  // form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [allDay, setAllDay] = useState(false);
  const [eventType, setEventType] = useState('school');
  const [location, setLocation] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [priority, setPriority] = useState<number | undefined>(undefined);

  // recurrence state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<{
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    daysOfWeek: number[];
    endDate: Date | null;
  }>({
    frequency: 'weekly',
    interval: 1,
    daysOfWeek: [],
    endDate: null
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // pre-fill form when editing or creating
  useEffect(() => {
    setError(null);

    if (event) {
      // existing event → populate
      setTitle(event.title);
      setDescription(event.extendedProps?.description || '');
      setAllDay(event.allDay);
      setEventType(event.extendedProps?.type || 'school');
      setLocation(event.extendedProps?.location || '');
      setColor(event.color || '#3B82F6');
      setPriority(event.extendedProps?.priority);

      // parse start/end
      const s = typeof event.start === 'string' ? parseISO(event.start) : new Date(event.start);
      const e = typeof event.end === 'string' ? parseISO(event.end) : new Date(event.end);
      setStartTime(isNaN(s.getTime()) ? new Date() : s);
      setEndTime(isNaN(e.getTime()) ? new Date(s.getTime() + 3600000) : e);

      // load existing recurrence if present
      const rec = (event.extendedProps as any)?.recurrence;
      if (rec) {
        setIsRecurring(true);
        setRecurrenceRule({
          frequency: rec.frequency || 'weekly',
          interval: rec.interval || 1,
          daysOfWeek: rec.days_of_week || [],
          endDate: rec.end_date ? parseISO(rec.end_date) : null
        });
      } else {
        setIsRecurring(false);
        setRecurrenceRule(r => ({ ...r, daysOfWeek: [], endDate: null }));
      }

    } else if (dateInfo) {
      // new event from date click
      setTitle('');
      setDescription('');
      setAllDay(dateInfo.allDay);
      setEventType('school');
      setLocation('');
      setColor('#3B82F6');
      setPriority(undefined);
      setStartTime(dateInfo.date);
      setEndTime(dateInfo.allDay ? dateInfo.date : new Date(dateInfo.date.getTime() + 3600000));

      // reset recurrence
      setIsRecurring(false);
      setRecurrenceRule(r => ({ ...r, daysOfWeek: [], endDate: null }));

    } else {
      // default new event
      setTitle('');
      setDescription('');
      setAllDay(false);
      setEventType('school');
      setLocation('');
      setColor('#3B82F6');
      setPriority(undefined);
      setStartTime(new Date());
      setEndTime(new Date(Date.now() + 3600000));

      // reset recurrence
      setIsRecurring(false);
      setRecurrenceRule(r => ({ ...r, daysOfWeek: [], endDate: null }));
    }
  }, [event, dateInfo, isOpen]);

  // save handler
  const handleSave = async () => {
    setError(null);
    if (!title) { setError("Title is required."); return; }
    if (!startTime || !endTime) { setError("Start and end times required."); return; }
    if (!allDay && startTime >= endTime) { setError("End time must be after start time."); return; }

    setIsSaving(true);
    try {
      const payload: EventCreatePayload | EventUpdatePayload = {
        title,
        description: description || undefined,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        all_day: allDay,
        event_type: eventType,
        location: location || undefined,
        color: color || undefined,
        priority,
        ...(isRecurring && {
          recurrence: {
            frequency: recurrenceRule.frequency,
            interval: recurrenceRule.interval,
            days_of_week: recurrenceRule.daysOfWeek,
            end_date: recurrenceRule.endDate?.toISOString()
          }
        })
      };

      let saved: CalendarEvent | null = null;
      if (event?.id) {
        saved = await updateEvent(event.id, payload as EventUpdatePayload);
      } else {
        saved = await createEvent(payload as EventCreatePayload);
      }

      if (saved) {
        onSave(saved);
      } else {
        throw new Error("No response from server");
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save event.');
      toast({
        title: "Error Saving Event",
        description: err.message || 'Could not save the event.',
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // delete handler
  const handleDelete = async () => {
    if (!event?.id) return;
    setIsDeleting(true);
    try {
      const ok = await deleteEvent(event.id);
      if (ok) onDelete(event.id);
      else throw new Error("Delete failed");
    } catch (err: any) {
      setError(err.message || 'Failed to delete event.');
      toast({
        title: "Error Deleting Event",
        description: err.message || 'Could not delete the event.',
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // date formatting
  const formatDateForPicker = (date: Date | null) => date ? format(date, 'PPP') : 'Pick a date';

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent
        className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto bg-card text-card-foreground"
      >
        <DialogHeader>
          <DialogTitle>{event ? 'Edit Event' : 'Create New Event'}</DialogTitle>
          <DialogDescription>
            {event ? 'Update your event details.' : 'Add a new event to your calendar.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          {/* Title */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">Title</Label>
            <Input id="title" value={title ?? ''} onChange={e => setTitle(e.target.value)} className="col-span-3" required />
          </div>

          {/* Description */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Description</Label>
            <Textarea id="description" value={description ?? ''} onChange={e => setDescription(e.target.value)} className="col-span-3" />
          </div>

          {/* All Day */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="allDay" className="text-right">All Day</Label>
            <div className="col-span-3 flex items-center">
              <Checkbox id="allDay" checked={allDay} onCheckedChange={val => setAllDay(Boolean(val))} />
            </div>
          </div>

          {/* Start Time */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startTime" className="text-right">Start Time</Label>
            <div className="col-span-3 flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[180px] justify-start text-left", !startTime && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateForPicker(startTime)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={startTime ?? undefined} onSelect={date => setStartTime(date ?? null)} initialFocus />
                </PopoverContent>
              </Popover>
              {!allDay && (
                <Input
                  type="time"
                  value={startTime ? format(startTime, 'HH:mm') : ''}
                  onChange={e => {
                    if (startTime && e.target.value) {
                      const [h, m] = e.target.value.split(':').map(x => parseInt(x,10));
                      const d = new Date(startTime);
                      d.setHours(h, m);
                      setStartTime(d);
                    }
                  }}
                  className="w-[100px]"
                />
              )}
            </div>
          </div>

          {/* End Time */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endTime" className="text-right">End Time</Label>
            <div className="col-span-3 flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[180px] justify-start text-left", !endTime && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateForPicker(endTime)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={endTime ?? undefined} onSelect={date => setEndTime(date ?? null)} initialFocus />
                </PopoverContent>
              </Popover>
              {!allDay && (
                <Input
                  type="time"
                  value={endTime ? format(endTime, 'HH:mm') : ''}
                  onChange={e => {
                    if (endTime && e.target.value) {
                      const [h, m] = e.target.value.split(':').map(x => parseInt(x,10));
                      const d = new Date(endTime);
                      d.setHours(h, m);
                      setEndTime(d);
                    }
                  }}
                  className="w-[100px]"
                />
              )}
            </div>
          </div>

          {/* Event Type */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="eventType" className="text-right">Type</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="school">School</SelectItem>
                <SelectItem value="work">Work</SelectItem>
                <SelectItem value="extracurricular">Extracurricular</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="study">Study Session</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recurring Toggle */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="isRecurring" className="text-right">Recurring</Label>
            <div className="col-span-3 flex items-center">
              <Checkbox id="isRecurring" checked={isRecurring} onCheckedChange={val => setIsRecurring(Boolean(val))} />
            </div>
          </div>

          {isRecurring && (
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right">Recurrence</Label>
              <div className="col-span-3 space-y-2">
                {/* Frequency */}
                <Select value={recurrenceRule.frequency} onValueChange={val => setRecurrenceRule(r => ({ ...r, frequency: val as any }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>

                {/* Interval */}
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={recurrenceRule.interval}
                    onChange={e => setRecurrenceRule(r => ({ ...r, interval: parseInt(e.target.value,10) || 1 }))}
                    className="w-20"
                  />
                  <span>Every {recurrenceRule.frequency === 'weekly' ? 'week' : recurrenceRule.frequency}</span>
                </div>

                {/* Days of week */}
                {recurrenceRule.frequency === 'weekly' && (
                  <div className="flex flex-wrap gap-2">
                    {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d,i) => (
                      <button
                        key={i}
                        type="button"
                        className={cn(
                          'px-2 py-1 rounded',
                          recurrenceRule.daysOfWeek.includes(i)
                            ? 'bg-black text-white'
                            : 'bg-white text-black hover:bg-gray-100'
                        )}
                        onClick={() => {
                          const days = recurrenceRule.daysOfWeek.includes(i)
                            ? recurrenceRule.daysOfWeek.filter(x => x !== i)
                            : [...recurrenceRule.daysOfWeek, i];
                          setRecurrenceRule(r => ({ ...r, daysOfWeek: days }));
                        }}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                )}

                {/* End date */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">
                      {recurrenceRule.endDate
                        ? format(recurrenceRule.endDate, 'PPP')
                        : 'End date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={recurrenceRule.endDate ?? undefined}
                      onSelect={date => setRecurrenceRule(r => ({ ...r, endDate: date ?? null }))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* Location */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="location" className="text-right">Location</Label>
            <Input id="location" value={location ?? ''} onChange={e => setLocation(e.target.value)} className="col-span-3" />
          </div>

          {/* Color */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="color" className="text-right">Color</Label>
            <div className="col-span-3 flex items-center gap-2">
              <Input id="color" type="color" value={color} onChange={e => setColor(e.target.value)} className="w-10 h-10 p-1 border rounded" />
              <span className="text-sm text-muted-foreground">{color}</span>
            </div>
          </div>

          {/* Priority */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="priority" className="text-right">Priority</Label>
            <Input
              id="priority"
              type="number"
              min="1"
              max="5"
              value={priority ?? ''}
              onChange={e => setPriority(e.target.value === '' ? undefined : parseInt(e.target.value,10))}
              className="col-span-3"
              placeholder="Optional (1-5)"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row justify-between items-center">
          {event?.id && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || isSaving}
              className="w-full sm:w-auto order-last sm:order-first mt-2 sm:mt-0"
            >
              {isDeleting ? 'Deleting...' : <><Trash2 className="mr-2 h-4 w-4" /> Delete</>}
            </Button>
          )}
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <DialogClose asChild>
              <Button variant="secondary" onClick={onClose} disabled={isSaving || isDeleting}>Cancel</Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={isSaving || isDeleting} className="bg-blue-600 hover:bg-blue-700">
              {isSaving ? 'Saving...' : 'Save Event'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EventModal;