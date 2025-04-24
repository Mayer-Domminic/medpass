import React, { useState, useEffect } from 'react';
import {
  RiskAssessment, 
  StudyPlanRequestPayload, 
  FullCalendarEvent, 
  CalendarEvent, 
  WeaknessStrength, 
  StudyPlanGenerationResponse
} from '@/types/calendar';
import { fetchFromApi } from '@/lib/calendarUtils';
import { format, parseISO, isValid } from 'date-fns';

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, BrainCircuit } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface StudyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanGenerated: () => void;
  existingEvents: FullCalendarEvent[];
}

// Create default risk assessment with sample data
const createDefaultRiskAssessment = (): RiskAssessment => {
  return {
    risk_score: 65,
    risk_level: 'Medium',
    strengths: [
      { subject: 'Cardiology', unit_type: 'Course', performance: 92, performance_score: 92 },
      { subject: 'Biochemistry', unit_type: 'Course', performance: 88, performance_score: 88 },
      { subject: 'Pharmacology', unit_type: 'Exam', performance: 85, performance_score: 85 }
    ],
    weaknesses: [
      { subject: 'Immunology', unit_type: 'Course', performance: 68, performance_score: 68 },
      { subject: 'Neurology', unit_type: 'Exam', performance: 72, performance_score: 72 },
      { subject: 'Microbiology', unit_type: 'Course', performance: 65, performance_score: 65 }
    ],
    ml_prediction: {
      prediction: 1,
      probability: 0.8,
      prediction_text: 'On-time graduation likely',
      confidence_score: 80
    },
    details: {
      student_name: 'Test Student',
      total_exams: 5,
      passed_exams: 4
    }
  };
};

const StudyPlanModal: React.FC<StudyPlanModalProps> = ({ 
  isOpen, 
  onClose, 
  onPlanGenerated, 
  existingEvents 
}) => {
  const [examDate, setExamDate] = useState<Date | null>(null);
  const [studyHoursPerDay, setStudyHoursPerDay] = useState<number>(4);
  const [focusAreas, setFocusAreas] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');

  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [loadingRisk, setLoadingRisk] = useState<boolean>(false);
  const [generatingPlan, setGeneratingPlan] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<boolean>(false);

  const { toast } = useToast();

  // Fetch risk assessment (strengths/weaknesses) when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset state on open
      setError(null);
      setGeneratingPlan(false);
      setApiError(false);
      
      // Fetch risk assessment data
      const fetchRiskData = async () => {
        setLoadingRisk(true);
        try {
          // For API access, fetch from the risk endpoint
          const studentId = 1; // In a real app, this would come from authentication context
          const data = await fetchFromApi<RiskAssessment>(`/info/risk?student_id=${studentId}`);
          console.log("Fetched risk assessment:", data);
          setRiskAssessment(data);
        } catch (err: any) {
          console.error("Error fetching risk assessment:", err);
          // Use default risk assessment data if API fails
          setApiError(true);
          setRiskAssessment(createDefaultRiskAssessment());
          
          toast({
            title: "Using Sample Data",
            description: "Could not connect to risk assessment API. Using sample data instead.",
            variant: "default",
          });
        } finally {
          setLoadingRisk(false);
        }
      };
      
      fetchRiskData();
    }
  }, [isOpen, toast]);

  // Handle generating study plan
  const handleGeneratePlan = async () => {
    setError(null);
    if (!examDate) {
      setError("Please select the USMLE Step 1 exam date.");
      return;
    }
    if (!riskAssessment) {
      setError("Student strengths and weaknesses data is not available. Cannot generate plan.");
      return;
    }
    if (studyHoursPerDay <= 0) {
      setError("Study hours per day must be positive.");
      return;
    }

    setGeneratingPlan(true);
    toast({
      title: "Generating Study Plan...",
      description: "Creating your personalized schedule. This may take a moment.",
    });

    // Map FullCalendarEvent back to the simpler CalendarEvent structure expected by backend
    const backendEvents: CalendarEvent[] = existingEvents.map(fe => ({
      id: fe.id,
      title: fe.title,
      start: fe.start,
      end: fe.end,
      allDay: fe.allDay,
      type: fe.extendedProps?.type || 'other',
      description: fe.extendedProps?.description,
      location: fe.extendedProps?.location,
      color: fe.color,
      priority: fe.extendedProps?.priority,
    }));

    const payload: StudyPlanRequestPayload = {
      exam_date: examDate.toISOString(),
      weaknesses: riskAssessment.weaknesses,
      strengths: riskAssessment.strengths,
      events: backendEvents,
      study_hours_per_day: studyHoursPerDay,
      focus_areas: focusAreas ? focusAreas.split(',').map(s => s.trim()).filter(s => s) : undefined,
      additional_notes: additionalNotes || undefined,
    };

    try {
      // Call the backend API to generate the plan
      const response = await fetchFromApi<StudyPlanGenerationResponse>('/calendar/generate-plan', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      
      console.log("Study Plan Generated:", response);
      onPlanGenerated(); // Notify parent component to refresh calendar with new study plan events
      
      toast({
        title: "Study Plan Created",
        description: `Created ${response.summary?.topics_count || 0} study sessions totaling ${response.summary?.total_study_hours || 0} hours`,
      });
    } catch (err: any) {
      console.error("Study Plan Generation Error:", err);
      setError(err.message || 'Failed to generate study plan.');
      toast({
        title: "Error Generating Plan",
        description: err.message || 'Could not generate the study plan.',
        variant: "destructive",
      });
    } finally {
      setGeneratingPlan(false);
    }
  };

  // Helper to format date for display in Popover button
  const formatDateForPicker = (date: Date | null): string => {
    if (!date) return "Pick exam date";
    try {
      return format(date, "PPP"); // Example: "Sep 20, 2024"
    } catch {
      return "Invalid Date";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <BrainCircuit className="mr-2 h-5 w-5 text-blue-500"/> Generate USMLE Step 1 Study Plan
          </DialogTitle>
          <DialogDescription>
            Let the AI create a personalized study schedule based on your exam date, availability, strengths, and weaknesses.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}
          {apiError && (
            <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 p-3 rounded-md mb-2">
              <p className="text-sm">Using sample academic data. Your actual data will be used when the system is connected.</p>
            </div>
          )}

          {/* Exam Date */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="examDate" className="text-right">Exam Date <span className="text-red-500">*</span></Label>
            <div className="col-span-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !examDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateForPicker(examDate)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={examDate ?? undefined}
                    onSelect={(date) => setExamDate(date ?? null)}
                    initialFocus
                    // Disable past dates
                    disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Study Hours */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="studyHours" className="text-right">Hours/Day <span className="text-red-500">*</span></Label>
            <Input
              id="studyHours"
              type="number"
              min="1"
              max="16" // Reasonable max
              value={studyHoursPerDay}
              onChange={(e) => setStudyHoursPerDay(parseInt(e.target.value, 10) || 1)}
              className="col-span-3"
              required
            />
          </div>

          {/* Strengths and Weaknesses Display */}
          <div className="grid grid-cols-1 gap-2 mt-2 border-t pt-4">
            <h3 className="text-lg font-semibold mb-2 text-center">Academic Performance</h3>
            {loadingRisk && <p className="text-center text-muted-foreground">Loading strengths & weaknesses...</p>}
            {!loadingRisk && !riskAssessment && !error && <p className="text-center text-muted-foreground">Could not load performance data.</p>}
            {riskAssessment && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2 text-green-500">Strengths:</h4>
                  <div className="flex flex-wrap gap-1">
                    {riskAssessment && riskAssessment.strengths && riskAssessment.strengths.length > 0 
                      ? riskAssessment.strengths.map((s: WeaknessStrength, i: number) => (
                          <Badge key={`str-${i}`} variant="default" className="bg-green-600 hover:bg-green-700">
                            {s.subject} ({Math.round(s.performance_score || s.performance)}%)
                          </Badge>
                        )) 
                      : <Badge variant="secondary">None specified</Badge>
                    }
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-red-500">Weaknesses:</h4>
                  <div className="flex flex-wrap gap-1">
                    {riskAssessment && riskAssessment.weaknesses && riskAssessment.weaknesses.length > 0 
                      ? riskAssessment.weaknesses.map((w: WeaknessStrength, i: number) => (
                          <Badge key={`wk-${i}`} variant="destructive">
                            {w.subject} ({Math.round(w.performance_score || w.performance)}%)
                          </Badge>
                        )) 
                      : <Badge variant="secondary">None specified</Badge>
                    }
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Focus Areas (Optional) */}
          <div className="grid grid-cols-4 items-center gap-4 mt-4 border-t pt-4">
            <Label htmlFor="focusAreas" className="text-right">Focus Areas</Label>
            <Textarea
              id="focusAreas"
              value={focusAreas}
              onChange={(e) => setFocusAreas(e.target.value)}
              className="col-span-3"
              placeholder="Optional: e.g., Cardiology, Pharmacology, Biostatistics (comma-separated)"
            />
          </div>

          {/* Additional Notes (Optional) */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="additionalNotes" className="text-right">Notes</Label>
            <Textarea
              id="additionalNotes"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              className="col-span-3"
              placeholder="Optional: Any specific requests for the AI tutor?"
            />
          </div>
        </div>
        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button type="button" variant="secondary" onClick={onClose} disabled={generatingPlan || loadingRisk}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleGeneratePlan}
            disabled={generatingPlan || loadingRisk || !riskAssessment || !examDate}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {generatingPlan ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                Generating...
              </>
            ) : (
              'Generate Plan'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StudyPlanModal;