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
        QuestionID: data.question.QuestionID,
        ExamID: data.question.ExamID,
        Prompt: data.question.Prompt,
        QuestionDifficulty: data.question.QuestionDifficulty,
        ImageUrl: data.question.ImageUrl,
        ImageDependent: data.question.ImageDependent,
        ImageDescription: data.question.ImageDescription,
        ExamName: data.question.ExamName
      },
      Options: data.options.map((opt: any) => ({
        OptionID: opt.optionId,
        CorrectAnswer: opt.isCorrect,
        Explanation: opt.explanation,
        OptionDescription: opt.description
      })),
      ContentAreas: data.contentAreas.map((area: any) => ({
        ContentAreaID: area.contentAreaId,
        ContentName: area.name,
        Description: area.discipline, // Using discipline as description if no description is provided
        Discipline: area.discipline
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

  //--- localstorage functions ---
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
  }, []); // Empty dependency array - IMPORTANT FIX

  return (
    <div className="min-h-screen bg-gray-900 text-slate-100 p-4">
        <Sidebar />
      {/* Progress header */}
      <div className="container mx-auto mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
          <h1 className="text-2xl font-bold mb-2 md:mb-0">Medical Quiz [DEMO]</h1>
          <div className="flex flex-col w-full md:w-auto md:flex-row items-center gap-4">
            <span className="text-slate-400">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <div className="w-full md:w-64 h-2 bg-slate-800 rounded-full">
              <div 
                className="h-full bg-blue-600 rounded-full" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <span className="text-slate-400">
              Score: {score}/{answeredQuestions.length}
            </span>
          </div>
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

      {/* Current Question */}
      {!loading && !error && questions.length > 0 && (
        <div className="container mx-auto mb-6">
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
        <div className="container mx-auto mt-8">
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
            <CardFooter>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={resetQuiz}
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