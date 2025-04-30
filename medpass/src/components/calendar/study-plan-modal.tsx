import React, { useState, useEffect } from 'react';
import { format, parseISO, addMonths } from 'date-fns';
import { 
  RiskAssessment, 
  WeaknessStrength,
  FullCalendarEvent, 
  StudyPlanRequestPayload,
  StudyPlanGenerationResponse
} from './calendar-view';

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, BrainCircuit, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface StudyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanGenerated: (planId?: string) => void;
  existingEvents: FullCalendarEvent[];
}

// Fetch function for API calls
const fetchFromApi = async <T,>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/api/v1${endpoint}`;
    
    // Get auth token from session
    const session = await fetch('/api/auth/session');
    const data = await session.json();
    const token = data?.accessToken;
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    };
    
    const response = await fetch(url, { 
      ...options, 
      headers,
      credentials: 'include'
    });

    if (response.status === 401) {
      throw new Error("Authentication required. Please log in again.");
    }

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { detail: response.statusText };
      }
      
      const errorMessage = errorData.detail || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
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
  const [activeTab, setActiveTab] = useState<string>("basic");
  
  // Basic settings
  const [examDate, setExamDate] = useState<Date | null>(null);
  const [studyHoursPerDay, setStudyHoursPerDay] = useState<number>(4);
  const [focusAreas, setFocusAreas] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  
  // Advanced settings
  const [includeWeekends, setIncludeWeekends] = useState<boolean>(false);
  const [includeMornings, setIncludeMornings] = useState<boolean>(true);
  const [includeEvenings, setIncludeEvenings] = useState<boolean>(true);
  const [preferredLocations, setPreferredLocations] = useState<string>('Home, Library');
  
  // Plan data 
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<StudyPlanGenerationResponse | null>(null);
  
  // UI states
  const [loadingRisk, setLoadingRisk] = useState<boolean>(false);
  const [generatingPlan, setGeneratingPlan] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [lastPlanId, setLastPlanId] = useState<string | null>(null);

  const { toast } = useToast();

  // Set a default exam date (3 months from now) if none selected
  useEffect(() => {
    if (!examDate) {
      // Set a sensible default - 3 months in the future
      setExamDate(addMonths(new Date(), 3));
    }
  }, []);

  // Fetch risk assessment (strengths/weaknesses) when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset state on open
      setError(null);
      setGeneratingPlan(false);
      setApiError(false);
      setShowSuccess(false);
      setGeneratedPlan(null);
      
      // Fetch risk assessment data
      const fetchRiskData = async () => {
        setLoadingRisk(true);
        try {
          try {
            const data = await fetchFromApi<RiskAssessment>(`/inf/risk`);
            console.log("Fetched risk assessment:", data);
            setRiskAssessment(data);
            setApiError(false);
          } catch (fetchErr) {
            console.error("Error fetching risk assessment:", fetchErr);
            // Gracefully fall back to default data
            setApiError(true);
            setRiskAssessment(createDefaultRiskAssessment());
            
            toast({
              title: "Using Sample Data",
              description: "Could not connect to risk assessment API. Using sample data instead.",
              variant: "default",
            });
          }
        } catch (err: any) {
          console.error("Unexpected error in risk data flow:", err);
          // Ensure we always have default data as a fallback
          setApiError(true);
          setRiskAssessment(createDefaultRiskAssessment());
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
    const backendEvents = existingEvents.map(fe => ({
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
  
    // Create the advanced preferences object
    const advancedPreferences = {
      include_weekends: includeWeekends,
      include_mornings: includeMornings,
      include_evenings: includeEvenings,
      preferred_locations: preferredLocations.split(',').map(loc => loc.trim()).filter(loc => loc)
    };
  
    // Simplified payload with only necessary fields
    const payload: StudyPlanRequestPayload = {
      exam_date: examDate.toISOString(),
      weaknesses: riskAssessment.weaknesses || [],
      strengths: riskAssessment.strengths || [],
      events: backendEvents,
      study_hours_per_day: studyHoursPerDay,
      focus_areas: focusAreas ? focusAreas.split(',').map(s => s.trim()).filter(s => s) : [],
      additional_notes: additionalNotes ? 
        `${additionalNotes} Advanced preferences: ${JSON.stringify(advancedPreferences)}` : 
        `Advanced preferences: ${JSON.stringify(advancedPreferences)}`
    };
  
    try {
      console.log("Sending payload:", JSON.stringify(payload));
      
      // Call the backend API to generate the plan
      const response = await fetchFromApi<StudyPlanGenerationResponse>('/calendar/generate-plan', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
  
      console.log("Study Plan Generated:", response);
  
      if (!response || !response.plan) {
        throw new Error("Invalid response format from server");
      }
  
      setGeneratedPlan(response);
      setLastPlanId(response.plan?.id || null);
      setShowSuccess(true);
      
      // Notify parent component to refresh calendar with new study plan events and pass the plan ID
      onPlanGenerated(response.plan?.id);
      
      toast({
        title: "Study Plan Created",
        description: `Created ${response.summary?.topics_count || 0} study sessions totaling ${response.summary?.total_study_hours || 0} hours`,
      });
    } catch (err) {
      console.error("Study Plan Generation Error:", err);
      
      // Extract error message in a robust way
      let errorMessage = '';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err === 'object') {
        errorMessage = JSON.stringify(err);
      } else {
        errorMessage = 'Unknown error occurred';
      }
      
      // Clean up error message if it's an object representation
      if (errorMessage.includes('[object Object]')) {
        errorMessage = 'Server returned an invalid response. Please try again later.';
      }
      
      setError(errorMessage || 'Failed to generate study plan.');
      toast({
        title: "Error Generating Plan",
        description: errorMessage || 'Could not generate the study plan.',
        variant: "destructive",
      });
    } finally {
      setGeneratingPlan(false);
    }
  };  

  // Handle PDF export
  const handleExportPDF = async () => {
    if (!lastPlanId) return;
    
    try {
      // Create a download link
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      const downloadLink = document.createElement("a");
      downloadLink.href = `${baseUrl}/api/v1/calendar/export-plan/${lastPlanId}`;
      downloadLink.target = "_blank";
      downloadLink.download = "USMLE_Study_Plan.pdf";
      
      // Add to document, click and remove
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast({
        title: "Exporting PDF",
        description: "Your study plan PDF is being downloaded.",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Error Exporting PDF",
        description: "Could not export the study plan as PDF.",
        variant: "destructive",
      });
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <BrainCircuit className="mr-2 h-5 w-5 text-blue-500"/> Generate USMLE Step 1 Study Plan
          </DialogTitle>
          <DialogDescription>
            Let the AI create a personalized study schedule based on your exam date, availability, strengths, and weaknesses.
          </DialogDescription>
        </DialogHeader>
        
        {!showSuccess ? (
          // Plan generation form
          <Tabs defaultValue="basic" className="w-full" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Settings</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Options</TabsTrigger>
            </TabsList>
            
            <div className="mt-4">
              {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}
              {apiError && (
                <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 p-3 rounded-md mb-2">
                  <p className="text-sm">Using sample academic data. Your actual data will be used when the system is connected.</p>
                </div>
              )}
            </div>
            
            <TabsContent value="basic" className="mt-0">
              <div className="grid gap-4 py-4">
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
                          onSelect={(date) => setExamDate(date ?? addMonths(new Date(), 3))}
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

                {/* Focus Areas (Optional) */}
                <div className="grid grid-cols-4 items-center gap-4 mt-2">
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
              </div>
            </TabsContent>
            
            <TabsContent value="advanced" className="mt-0">
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Schedule Preferences</CardTitle>
                      <CardDescription>
                        Customize when and where you prefer to study
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="weekends" 
                          checked={includeWeekends} 
                          onCheckedChange={(checked) => setIncludeWeekends(!!checked)} 
                        />
                        <Label htmlFor="weekends">Include weekend study sessions</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="mornings" 
                          checked={includeMornings} 
                          onCheckedChange={(checked) => setIncludeMornings(!!checked)} 
                        />
                        <Label htmlFor="mornings">Include morning study sessions (6AM-12PM)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="evenings" 
                          checked={includeEvenings} 
                          onCheckedChange={(checked) => setIncludeEvenings(!!checked)} 
                        />
                        <Label htmlFor="evenings">Include evening study sessions (6PM-10PM)</Label>
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="locations" className="text-right">Preferred Locations</Label>
                        <Input 
                          id="locations" 
                          value={preferredLocations} 
                          onChange={(e) => setPreferredLocations(e.target.value)}
                          className="col-span-3"
                          placeholder="Home, Library, Café (comma-separated)"
                        />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Study Plan Strategy</CardTitle>
                      <CardDescription>
                        Information about how the AI will generate your plan
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-5 space-y-2 text-sm">
                        <li>The AI will analyze your academic strengths and weaknesses</li>
                        <li>More study time will be allocated to your weak areas</li>
                        <li>Sessions will be spaced to optimize memory retention</li>
                        <li>The plan will include regular review sessions and practice tests</li>
                        <li>Your existing calendar commitments will be respected</li>
                        <li>The plan will adapt to your preferred study times and locations</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          // Success view after plan generation
          <div className="py-4">
            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 mb-4">
              <h3 className="text-lg font-medium text-green-800 dark:text-green-200 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Study Plan Generated Successfully!
              </h3>
              <p className="text-green-700 dark:text-green-300 mt-2">
                Your personalized USMLE Step 1 study schedule has been added to your calendar.
              </p>
            </div>
            
            {generatedPlan && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Study Plan Summary</CardTitle>
                    <CardDescription>
                      Overview of your new study plan
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Plan Details</h4>
                        <ul className="space-y-2">
                          <li className="flex justify-between">
                            <span>Total Study Hours:</span>
                            <span className="font-medium">{generatedPlan.summary.total_study_hours}</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Total Topics Covered:</span>
                            <span className="font-medium">{generatedPlan.summary.topics_count}</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Exam Date:</span>
                            <span className="font-medium">
                              {new Date(generatedPlan.plan.examDate).toLocaleDateString()}
                            </span>
                          </li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Focus Areas</h4>
                        <div className="flex flex-wrap gap-1">
                          {generatedPlan.summary.focus_areas && 
                            Object.entries(generatedPlan.summary.focus_areas)
                              .sort((a, b) => b[1] - a[1])
                              .slice(0, 5)
                              .map(([subject, hours], i) => (
                                <Badge key={`focus-${i}`} variant="outline" className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
                                  {subject}: {Math.round(hours)}h
                                </Badge>
                              ))
                          }
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button 
                      onClick={handleExportPDF} 
                      variant="outline"
                      className="text-blue-600 border-blue-600"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export as PDF
                    </Button>
                  </CardFooter>
                </Card>
                
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-2">Next Steps</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Your study events have been added to your calendar</li>
                    <li>You can edit individual study sessions by clicking on them in the calendar</li>
                    <li>Mark study sessions as completed as you go through them</li>
                    <li>Download a PDF version for offline reference</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
        
        <DialogFooter className="mt-4">
          {!showSuccess ? (
            <>
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Plan'
                )}
              </Button>
            </>
          ) : (
            <Button type="button" variant="default" onClick={onClose} className="ml-auto">
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
export default StudyPlanModal;