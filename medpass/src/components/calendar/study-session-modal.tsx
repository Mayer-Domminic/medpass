import React, { useState, useEffect } from 'react';
import { StudySession, EventUpdatePayload } from '@/types/calendar';
import { updateEvent } from '@/lib/calendarUtils';
import { format, parseISO } from 'date-fns';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  BookOpen, 
  Clock, 
  Calendar, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  Edit,
  Save,
  Trash2 
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface StudySessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: StudySession) => void;
  onDelete: (eventId: string) => void;
  event: StudySession;
}

const StudySessionModal: React.FC<StudySessionModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete, 
  event 
}) => {
  const [activeTab, setActiveTab] = useState<string>("details");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Editable form state
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description || '');
  const [completed, setCompleted] = useState(event.completed || false);
  const [notes, setNotes] = useState('');
  
  const { toast } = useToast();
  
  // Reset form when event changes
  useEffect(() => {
    setError(null);
    setTitle(event.title);
    setDescription(event.description || '');
    setCompleted(event.completed || false);
    setNotes('');
    setIsEditing(false);
  }, [event, isOpen]);
  
  // Handle marking as complete/incomplete
  const handleToggleComplete = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const updatedStatus = !completed;
      setCompleted(updatedStatus);
      
      const payload: EventUpdatePayload = {
        completed: updatedStatus
      };
      
      const updated = await updateEvent(event.id, payload);
      
      if (updated) {
        const updatedEvent = {
          ...event,
          completed: updatedStatus,
          extendedProps: {
            ...event.extendedProps,
            completed: updatedStatus
          }
        };
        onSave(updatedEvent as StudySession);
        
        toast({
          title: updatedStatus ? "Study Session Completed" : "Marked as Incomplete",
          description: updatedStatus ? "Great job! This session has been marked as completed." : "This session has been marked as incomplete.",
        });
      } else {
        throw new Error("Failed to update study session status");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update session status");
      toast({
        title: "Error",
        description: err.message || "Could not update the study session status.",
        variant: "destructive",
      });
      setCompleted(!completed); // Revert UI state
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle saving edits
  const handleSaveEdits = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      if (!title.trim()) {
        throw new Error("Title is required");
      }
      
      const payload: EventUpdatePayload = {
        title,
        description,
        completed
      };
      
      const updated = await updateEvent(event.id, payload);
      
      if (updated) {
        const updatedEvent = {
          ...event,
          title,
          description,
          completed,
          extendedProps: {
            ...event.extendedProps,
            description,
            completed
          }
        };
        onSave(updatedEvent as StudySession);
        setIsEditing(false);
        
        toast({
          title: "Session Updated",
          description: "Your study session has been updated successfully.",
        });
      } else {
        throw new Error("Failed to update study session");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update session");
      toast({
        title: "Error",
        description: err.message || "Could not update the study session.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle deleting the event
  const handleDelete = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    setError(null);
    
    try {
      onDelete(event.id);
      toast({
        title: "Session Deleted",
        description: "The study session has been removed from your calendar.",
      });
    } catch (err: any) {
      setError(err.message || "Failed to delete session");
      toast({
        title: "Error",
        description: err.message || "Could not delete the study session.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Format the date and time for display
  const formatDateTime = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      return format(date, 'EEEE, MMMM d, yyyy h:mm a');
    } catch {
      return dateStr;
    }
  };
  
  // Calculate duration in hours and minutes
  const calculateDuration = () => {
    try {
      const start = parseISO(event.start);
      const end = parseISO(event.end);
      const durationMs = end.getTime() - start.getTime();
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
      }
      return `${minutes}m`;
    } catch {
      return 'Unknown duration';
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className={cn(
            "flex items-center text-xl",
            completed ? "text-green-600 dark:text-green-400" : ""
          )}>
            {completed && <CheckCircle className="mr-2 h-5 w-5" />}
            {!isEditing ? title : "Edit Study Session"}
          </DialogTitle>
        </DialogHeader>
        
        {error && <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded text-red-600 dark:text-red-400 text-sm">{error}</div>}
        
        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="notes">Notes & Progress</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="mt-4">
            {!isEditing ? (
              // View mode
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium">Topic</h3>
                    <p className="text-sm">{event.topicName || "General Study"}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium">Date & Time</h3>
                    <p className="text-sm">{formatDateTime(event.start)}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium">Duration</h3>
                    <p className="text-sm">{calculateDuration()}</p>
                  </div>
                </div>
                
                {event.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium">Location</h3>
                      <p className="text-sm">{event.location}</p>
                    </div>
                  </div>
                )}
                
                {description && (
                  <div className="border-t pt-3 mt-4">
                    <h3 className="font-medium mb-2">Session Objectives</h3>
                    <p className="text-sm whitespace-pre-line">{description}</p>
                  </div>
                )}
                
                <div className="flex items-center gap-2 pt-3">
                  <Badge className={completed ? "bg-green-600" : "bg-amber-600"}>
                    {completed ? "Completed" : "Not Completed"}
                  </Badge>
                </div>
              </div>
            ) : (
              // Edit mode
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input 
                    id="title" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="Study Session Title" 
                    className="w-full" 
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="Study session objectives and details" 
                    className="min-h-[100px]" 
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="completed" 
                    checked={completed} 
                    onCheckedChange={(checked) => setCompleted(!!checked)} 
                  />
                  <Label htmlFor="completed" className="font-medium">
                    Mark as completed
                  </Label>
                </div>
                
                <div className="text-sm text-muted-foreground italic">
                  Note: Date, time, and topic cannot be edited here. For significant changes, delete this session and create a new one.
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="notes" className="mt-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Progress Tracking</h3>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Completion Status</span>
                    <span>{completed ? "Completed" : "Not Started"}</span>
                  </div>
                  <Progress value={completed ? 100 : 0} className="h-2" />
                </div>
              </div>
              
              <div className="border-t pt-3 mt-4">
                <h3 className="font-medium mb-2">Study Notes</h3>
                <Textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add your notes for this study session here..."
                  className="min-h-[150px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  These notes are temporary and won't be saved with the session.
                </p>
              </div>
              
              <div className="border-t pt-3 mt-4">
                <h3 className="font-medium mb-2">Recommended Resources</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-1 mt-0.5">
                      <BookOpen className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span>First Aid for USMLE Step 1 - {event.topicName} chapter</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-1 mt-0.5">
                      <BookOpen className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span>USMLE World Question Bank - {event.topicName} section</span>
                  </li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-4">
          {!isEditing ? (
            <>
              <div>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  size="sm"
                  className="h-9"
                >
                  {isDeleting ? (
                    "Deleting..."
                  ) : (
                    <>
                      <Trash2 className="mr-1 h-4 w-4" /> Delete
                    </>
                  )}
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  size="sm"
                  className="h-9"
                >
                  <Edit className="mr-1 h-4 w-4" /> Edit
                </Button>
                
                <Button
                  variant={completed ? "outline" : "default"}
                  onClick={handleToggleComplete}
                  disabled={isSaving}
                  size="sm"
                  className={cn(
                    "h-9",
                    completed ? "border-red-600 text-red-600 hover:bg-red-50" : "bg-green-600 hover:bg-green-700"
                  )}
                >
                  {isSaving ? (
                    "Saving..."
                  ) : completed ? (
                    <>
                      <XCircle className="mr-1 h-4 w-4" /> Mark Incomplete
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-1 h-4 w-4" /> Mark Complete
                    </>
                  )}
                </Button>
                
                <DialogClose asChild>
                  <Button variant="ghost" size="sm" className="h-9">
                    Close
                  </Button>
                </DialogClose>
              </div>
            </>
          ) : (
            <>
              <div></div>
              
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setIsEditing(false)}
                  size="sm"
                  className="h-9"
                >
                  Cancel
                </Button>
                
                <Button
                  variant="default"
                  onClick={handleSaveEdits}
                  disabled={isSaving}
                  size="sm"
                  className="h-9 bg-blue-600 hover:bg-blue-700"
                >
                  {isSaving ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save className="mr-1 h-4 w-4" /> Save Changes
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StudySessionModal;