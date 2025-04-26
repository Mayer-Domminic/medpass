'use client';

// extends window (global object) to include currentQuestionIndex, used by Question component
declare global {
    interface Window {
      currentQuestionIndex?: number;
    }
  }

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import Sidebar from '@/components/navbar';
import Question from '@/components/QuestionComp/Question';

// Interface matching the API response format
interface QuestionResponseData {
  Question: {
    QuestionID: number;
    ExamID: number;
    Prompt: string;
    QuestionDifficulty: string;
    ImageUrl: string | null;
    ImageDependent: boolean;
    ImageDescription: string | null;
    ExamName?: string;
  };
  Options: {
    OptionID: number;
    CorrectAnswer: boolean;
    Explanation: string;
    OptionDescription: string;
  }[];
  ContentAreas: {
    ContentAreaID: number;
    ContentName: string;
    Description: string;
    Discipline: string;
  }[];
}

interface QuestionProps {
  questionData: QuestionResponseData;
  showFeedback: boolean;
  savedAnswers: number[];
  savedConfidenceLevel: string;
}

// structure for user answer data
interface UserAnswer {
  questionIndex: number;
  selectedAnswers: number[]; // Array for multiple correct answers
  confidenceLevel: string;
  isCorrect: boolean;
}

// Function to fetch question details from API
const fetchQuestionDetails = async (questionId: number, accessToken?: string) => {
  try {
    const API_URL = 
      typeof window === "undefined" 
        ? "http://backend:8000" 
        : "http://localhost:8000";
    
    const response = await fetch(`${API_URL}/api/v1/question/${questionId}`);

    if (!response.ok) {
      console.error(`Server responded with status: ${response.status}`);
      const errorText = await response.text();
      console.error(`Error details: ${errorText}`);
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Received data structure:", data);
    
    // Convert data to match the expected QuestionResponseData format if needed
    const formattedData: QuestionResponseData = {
      Question: {
        QuestionID: data.Question.QuestionID,
        ExamID: data.Question.ExamID,
        Prompt: data.Question.Prompt,
        QuestionDifficulty: data.Question.QuestionDifficulty,
        ImageUrl: data.Question.ImageUrl,
        ImageDependent: data.Question.ImageDependent,
        ImageDescription: data.Question.ImageDescription,
        ExamName: data.Question.ExamName
      },
      Options: data.Options.map((opt: any) => ({
        OptionID: opt.OptionID,
        CorrectAnswer: opt.CorrectAnswer,
        Explanation: opt.Explanation,
        OptionDescription: opt.OptionDescription
      })),
      ContentAreas: data.ContentAreas.map((area: any) => ({
        ContentAreaID: area.ContentAreaID,
        ContentName: area.ContentName,
        Description: area.Description,
        Discipline: area.Discipline
      }))
    };
    
    return formattedData;
  } catch (error) {
    console.error('Failed to fetch question:', error);
    throw error;
  }
};

// Function to fetch all questions needed for the quiz
const fetchQuizQuestions = async (questionIds: number[], accessToken?: string) => {
  try {
    const questionsPromises = questionIds.map(id => fetchQuestionDetails(id, accessToken));
    return await Promise.all(questionsPromises);
  } catch (error) {
    console.error('Failed to fetch quiz questions:', error);
    throw error;
  }
};

export default function ReviewPage() {
  // replace mock data with state for loaded questions
  const [questions, setQuestions] = useState<QuestionResponseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  //--- state variables ---
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [studentId, setStudentId] = useState<number>(100); // Example student ID, replace with actual logic to get student ID

  // Load questions from API
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true);
        // Example question IDs - replace with your actual question IDs
        // You might want to fetch these from another endpoint or have them predefined
        const questionIds = [10, 11, 12]; // Example IDs
        const loadedQuestions = await fetchQuizQuestions(questionIds);
        setQuestions(loadedQuestions);
        setLoading(false);
      } catch (err) {
        setError('Failed to load questions. Please try again later.');
        setLoading(false);
        console.error('Error loading questions:', err);
      }
    };

    loadQuestions();
  }, []);

  //---localstorage functions ---
  const saveQuizState = () => {
    const quizState = {
      currentQuestionIndex,
      userAnswers,
      answeredQuestions,
      score
    };
    localStorage.setItem('reviewSessionState', JSON.stringify(quizState));
  };
  
  const loadQuizState = () => {
    const savedState = localStorage.getItem('reviewSessionState');
    if (savedState) {
      try {
        const { currentQuestionIndex, userAnswers, answeredQuestions, score } = JSON.parse(savedState);
        setCurrentQuestionIndex(currentQuestionIndex);
        setUserAnswers(userAnswers);
        setAnsweredQuestions(answeredQuestions);
        setScore(score);
        return true;
      } catch (error) {
        console.error('Error parsing saved quiz state', error);
      }
    }
    return false;
  };
  
  // Function to submit quiz results to the database
  const submitQuizResultsToDatabase = async (studentId: number, examId: number) => {
    try {
      const quizState = JSON.parse(localStorage.getItem('reviewSessionState') || '{}');
      
      if (!quizState.userAnswers || quizState.userAnswers.length === 0) {
        console.error('No quiz data available to submit');
        return { success: false, message: 'No quiz data available' };
      }
      
      // Convert confidence levels to integer values
      const confidenceToInt = (confidenceStr: string): number => {
        switch(confidenceStr.toLowerCase()) {
          case 'very-good': return 5;
          case 'good': return 4;
          case 'neutral': return 3;
          case 'bad': return 2;
          case 'very-bad': return 1;
          default: return 3; // Default to neutral if unknown
        }
      };
      
      // Calculate percentage score - Must be an integer
      const percentageScore = Math.round((quizState.score / quizState.answeredQuestions.length) * 100);
      
      // Format the data according to ExamResultWithPerformancesCreate schema
      const formattedData = {
        student_id: studentId,
        exam_id: examId,
        clerkship_id: null, // Set to actual clerkship ID if available
        score: percentageScore, // Rounded to integer
        pass_or_fail: null, // Let backend determine this based on exam pass score
        timestamp: new Date().toISOString(),
        performances: quizState.userAnswers.map((answer: UserAnswer) => {
          return {
            question_id: questions[answer.questionIndex].Question.QuestionID,
            result: answer.isCorrect,
            confidence: confidenceToInt(answer.confidenceLevel) // Convert string to integer
          };
        })
      };
      
      console.log('Submitting formatted data:', formattedData);
      
      const API_URL = 
        typeof window === "undefined" 
          ? "http://backend:8000" 
          : "http://localhost:8000";
      
      const response = await fetch(`${API_URL}/api/v1/question/exam-results-with-performance/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to submit quiz results:', errorText);
        return { success: false, message: `Failed to submit: ${response.status}` };
      }
      
      const result = await response.json();
      console.log('Quiz results submitted successfully:', result);
      return { success: true, data: result };
      
    } catch (error) {
      console.error('Error submitting quiz results:', error);
      return { success: false, message: String(error) };
    }
  };
  
  //--- navigation Functions ---
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  //--- helper Functions ---
  const getCurrentQuestionAnswerData = () => {
    return userAnswers.find(answer => answer.questionIndex === currentQuestionIndex);
  };
  
  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setAnsweredQuestions([]);
    setUserAnswers([]);
    setScore(0);
    localStorage.removeItem('reviewSessionState');
  };
  
  //--- calculated properties ---
  const progressPercentage = questions.length ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const isCurrentQuestionAnswered = answeredQuestions.includes(currentQuestionIndex);
  const isQuizCompleted = questions.length > 0 && answeredQuestions.length === questions.length;
  
  //---effect hooks and listeners ---
  
  // load saved state when component mounts and after questions are loaded
  useEffect(() => {
    if (questions.length > 0 && !loading) {
      loadQuizState();
    }
  }, [questions, loading]);
  
  // save state whenever key state variables changes
  useEffect(() => {
    if (questions.length > 0) {
      saveQuizState();
    }
  }, [currentQuestionIndex, userAnswers, answeredQuestions, score, questions]);
  
  // update global window prop to track current question index
  useEffect(() => {
    window.currentQuestionIndex = currentQuestionIndex;
  }, [currentQuestionIndex]);
  
  // question answered event listener - UPDATED FOR MULTIPLE CORRECT ANSWERS
  useEffect(() => {
    const handleQuestionAnswered = (event: CustomEvent<any>) => {
      console.log("Question answered event received", event.detail);
      
      const { questionIndex, isCorrect, selectedAnswers, confidenceLevel } = event.detail;
      
      console.log("Current answeredQuestions state:", answeredQuestions);
      
      // updates answered questions tracking if not already included
      setAnsweredQuestions(prev => {
        if (!prev.includes(questionIndex)) {
          // Only increment score if this is a new correct answer
          if (isCorrect) {
            setScore(prevScore => prevScore + 1);
            console.log("Incrementing score because answer is correct");
          }
          return [...prev, questionIndex];
        }
        return prev;
      });
      
      // stores user answer data - always updates even if question was previously answered
      setUserAnswers(prev => {
        // removes any existing answer for this question
        const filteredAnswers = prev.filter(answer => answer.questionIndex !== questionIndex);
        // adds new answer
        const newAnswers = [...filteredAnswers, { 
          questionIndex, 
          isCorrect, 
          selectedAnswers, // Now using array of selected answers
          confidenceLevel 
        }];
        console.log("New userAnswers state:", newAnswers);
        return newAnswers;
      });
      
      console.log("Event handling complete");
    };
  
    // listen for custom event from the Question component
    window.addEventListener('questionAnswered', handleQuestionAnswered as EventListener);
    
    return () => {
      window.removeEventListener('questionAnswered', handleQuestionAnswered as EventListener);
    };
  }, []);  // Empty dependency array - IMPORTANT FIX

  return (
    <div className="min-h-screen bg-gray-900 text-slate-100 p-4">
      <Sidebar />
      
      {/* Progress header */}
      <div className="flex justify-between items-center mb-6 px-2">
        {/* Left side: Title - Positioned correctly to align with navbar */}
        <h1 className="text-4xl font-bold ml-8">Review: BLOCK 1</h1>
        
        {/* Right side: Progress information and user info */}
        <div className="flex items-center">
          <span className="text-slate-400 mr-3">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <div className="w-64 h-2 bg-slate-800 rounded-full mr-3">
            <div 
              className="h-full bg-blue-600 rounded-full" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <span className="text-slate-400 mr-4">
            Score: {score}/{answeredQuestions.length}
          </span>
          
          {/* User info */}
          <span className="text-xl font-bold">Bron</span>!
          <span className="ml-3 text-sm bg-emerald-900 text-green-300 px-3 py-1 rounded-full">
            Junior
          </span>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="container mx-auto text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl">Loading questions...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="container mx-auto text-center py-12">
          <div className="bg-red-800 text-white p-4 rounded-md mb-4 inline-block">
            <p>{error}</p>
          </div>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Current Question - Adjusted for better centering */}
      {!loading && !error && questions.length > 0 && (
        <div className="container mx-auto mb-6 max-w-4xl"> {/* Added max-width for better centering */}
          {/* Pass answer data only if this specific question has been answered */}
          {/* use a key to ensure proper re-rendering when switching questions */}
          <Question 
            key={`question-${currentQuestionIndex}`}
            questionData={questions[currentQuestionIndex]}
            showFeedback={isCurrentQuestionAnswered}
            savedAnswers={isCurrentQuestionAnswered ? (getCurrentQuestionAnswerData()?.selectedAnswers || []) : []}
            savedConfidenceLevel={isCurrentQuestionAnswered ? (getCurrentQuestionAnswerData()?.confidenceLevel || "") : ""}
          />

          {/* Navigation buttons */}
          <div className="flex justify-between mt-6">
            <Button 
              variant="outline" 
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className="bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            
            <Button 
              onClick={handleNextQuestion}
              disabled={currentQuestionIndex === questions.length - 1}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Quiz Summary*/}
      {isQuizCompleted && (
        <div className="container mx-auto mt-8 max-w-4xl"> {/* Added max-width for consistency */}
          <Card className="bg-slate-900 border-slate-800 text-slate-100">
            <CardHeader>
              <h2 className="text-2xl font-bold">Quiz Complete!</h2>
            </CardHeader>
            <CardContent>
              <p className="text-xl mb-4">
                Your final score: {score}/{questions.length} ({Math.round((score/questions.length) * 100)}%)
              </p>
              
              {/* Question Summary */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Question Summary:</h3>
                <div className="space-y-2">
                  {questions.map((q, index) => {
                    const answer = userAnswers.find(a => a.questionIndex === index);
                    return (
                      <div key={index} className="flex items-center space-x-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          answer
                            ? (answer.isCorrect ? "bg-green-600" : "bg-red-600") 
                            : "bg-slate-700"
                        }`}>
                          {index + 1}
                        </div>
                        <span className="truncate max-w-md">{q.Question.Prompt.substring(0, 60)}...</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button 
                className={`w-full ${
                  submissionStatus === 'idle' ? 'bg-green-600 hover:bg-green-700' :
                  submissionStatus === 'submitting' ? 'bg-blue-500' :
                  submissionStatus === 'success' ? 'bg-green-700' :
                  'bg-red-600 hover:bg-red-700'
                } text-white mb-2`}
                onClick={async () => {
                  // Now using the state variable for studentId
                  const examId = questions[0].Question.ExamID;
                  
                  // Update submission status
                  setSubmissionStatus('submitting');
                  
                  const result = await submitQuizResultsToDatabase(studentId, examId);
                  
                  // Update state based on result
                  setSubmissionStatus(result.success ? 'success' : 'error');
                }}
                disabled={submissionStatus === 'submitting' || submissionStatus === 'success'}
              >
                {submissionStatus === 'idle' && 'Save Results to Database'}
                {submissionStatus === 'submitting' && 'Submitting...'}
                {submissionStatus === 'success' && 'Results Saved ✓'}
                {submissionStatus === 'error' && 'Save Failed - Try Again'}
              </Button>
              
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  resetQuiz();
                  setSubmissionStatus('idle');
                }}
              >
                Retake Quiz
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}