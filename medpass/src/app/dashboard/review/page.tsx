'use client';

// Route segment config
export const dynamic = 'force-dynamic';
export const runtime = 'edge'; // or 'nodejs' depending on your needs

// Modify global declaration to use typeof check
declare global {
  interface Window {
    currentQuestionIndex?: number;
  }
}

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import Sidebar from '@/components/navbar';
import Question from '@/components/QuestionComp/Question';
import UserGreeting from '@/components/UserGreeting';
import {
  QuestionResponseData,
  UserAnswer,
  SubmissionStatus
} from '@/types/review';

import {
  fetchQuizQuestions,
  fetchQuizQuestionsByDomain,
  fetchQuizQuestionsByDomainAlt,
  submitQuizResultsToDatabase,
  getCorrectAnswerCount,
  countCorrectAnswers,
  calculateTotalPossiblePoints,
  calculateUserScore,
  checkIfCorrect,
  fetchStudentInfo
} from '@/lib/reviewUtils';

// Safe localStorage wrappers
const saveQuizState = (
  currentQuestionIndex: number,
  userAnswers: UserAnswer[],
  answeredQuestions: number[],
  score: number,
  totalPossiblePoints: number
) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('reviewSessionState', JSON.stringify({
        currentQuestionIndex,
        userAnswers,
        answeredQuestions,
        score,
        totalPossiblePoints
      }));
    } catch (e) {
      console.error("Failed to save quiz state to localStorage:", e);
    }
  }
};

const loadQuizState = () => {
  if (typeof window !== 'undefined') {
    try {
      const savedState = localStorage.getItem('reviewSessionState');
      return savedState ? JSON.parse(savedState) : null;
    } catch (e) {
      console.error("Failed to load quiz state from localStorage:", e);
      return null;
    }
  }
  return null;
};

export default function ReviewPage() {
  const searchParams = useSearchParams();

  // State variables
  const [questions, setQuestions] = useState<QuestionResponseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [totalPossiblePoints, setTotalPossiblePoints] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>('idle');
  const [studentId, setStudentId] = useState<number | null>(null);
  const [loadingStudentInfo, setLoadingStudentInfo] = useState(false);
  const [studentInfoError, setStudentInfoError] = useState<string | null>(null);
  const [isPracticeMode, setIsPracticeMode] = useState<boolean>(false);

  // Load student information
  useEffect(() => {
    const getStudentInfo = async () => {
      try {
        setLoadingStudentInfo(true);
        setStudentInfoError(null);
        const studentData = await fetchStudentInfo();
        if (studentData && studentData.StudentID !== undefined) {
          setStudentId(studentData.StudentID);
          console.log("Retrieved student ID:", studentData.StudentID);
        } else {
          throw new Error("Student ID not found in response");
        }
      } catch (err) {
        console.error("Failed to fetch student information:", err);
        setStudentInfoError("Failed to retrieve student information. Please try again later.");
      } finally {
        setLoadingStudentInfo(false);
      }
    };

    // Only run on client side
    if (typeof window !== 'undefined') {
      getStudentInfo();
    }
  }, []);

  // Parse question IDs from URL parameters
  const parseQuestionIds = (): number[] => {
    try {
      // Get the questionIds parameter from the URL
      const questionIdsParam = searchParams?.get('questionids');

      // If no parameter is provided, return empty array
      if (!questionIdsParam) {
        console.warn("No questionIds parameter found in URL");
        return [];
      }

      // Parse the comma-separated string into an array of numbers
      const ids = questionIdsParam.split(',')
        .map(id => id.trim())
        .filter(id => id.length > 0)
        .map(id => parseInt(id, 10))
        .filter(id => !isNaN(id));

      console.log("Parsed question IDs from URL:", ids);
      return ids;
    } catch (error) {
      console.error("Error parsing question IDs:", error);
      return [];
    }
  };

  // Load questions from API based on URL parameters
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true);

        // Check for practice mode
        const practiceParam = searchParams.get('practice');
        const isPractice = practiceParam === 'true';
        setIsPracticeMode(isPractice);

        // Check for domain-based parameters
        const domain = searchParams.get('domain');
        const subdomain = searchParams.get('subdomain');

        // If domain parameters are present, use domain-based fetching
        if (domain && subdomain) {
          console.log(`Loading questions by domain: ${domain}, subdomain: ${subdomain}, practice mode: ${isPractice}`);

          try {
            // Use our corrected implementation
            const loadedQuestions = await fetchQuizQuestionsByDomain(domain, subdomain, isPractice);

            // Check if we received any questions
            if (!loadedQuestions || loadedQuestions.length === 0) {
              setError(`No questions found for ${domain} (${subdomain}). Please try a different domain or go back.`);
              setLoading(false);
              return;
            }

            setQuestions(loadedQuestions);
          } catch (domainError) {
            console.error("Error fetching domain-based questions:", domainError);
            setError(`Failed to load questions: ${domainError instanceof Error ? domainError.message : 'Unknown error'}. Please try again later.`);
            setLoading(false);
            return;
          }
        }
        // Otherwise, use the original question IDs approach
        else {
          // Get question IDs from URL parameters
          const questionIds = parseQuestionIds();

          // Check if we have valid question IDs
          if (questionIds.length === 0) {
            setError('No valid question IDs or domain parameters provided. Please go back and select some questions.');
            setLoading(false);
            return;
          }

          // Fetch questions using the parsed IDs
          const loadedQuestions = await fetchQuizQuestions(questionIds);

          // Check if we received any questions
          if (!loadedQuestions || loadedQuestions.length === 0) {
            setError('No questions found with the provided IDs. Please try again with different questions.');
            setLoading(false);
            return;
          }

          setQuestions(loadedQuestions);
        }

        // Set loading to false first
        setLoading(false);

        // Calculate total possible points after questions are loaded
        // Use setTimeout to ensure questions state is updated
        setTimeout(() => {
          const possiblePoints = calculateTotalPossiblePoints(questions);
          console.log(`Total possible points calculated: ${possiblePoints}`);
          setTotalPossiblePoints(possiblePoints);
        }, 100);

      } catch (err) {
        console.error('Failed to load questions:', err);
        setError(`Failed to load questions: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again later.`);
        setLoading(false);
      }
    };

    loadQuestions();
  }, [searchParams]); // Re-run if search parameters change

  // Load saved state when component mounts and after questions are loaded
  useEffect(() => {
    // Skip this effect during SSR
    if (typeof window === 'undefined') return;

    if (questions.length > 0 && !loading) {
      const savedState = loadQuizState();
      if (savedState) {
        setCurrentQuestionIndex(savedState.currentQuestionIndex);
        setUserAnswers(savedState.userAnswers);
        setAnsweredQuestions(savedState.answeredQuestions);
        setScore(savedState.score);

        // If totalPossiblePoints was saved, restore it too
        if (savedState.totalPossiblePoints) {
          setTotalPossiblePoints(savedState.totalPossiblePoints);
        }
      }
    }
  }, [questions, loading]);

  // Save state whenever key state variables change
  useEffect(() => {
    // Skip this effect during SSR
    if (typeof window === 'undefined') return;

    if (questions.length > 0) {
      saveQuizState(
        currentQuestionIndex,
        userAnswers,
        answeredQuestions,
        score,
        totalPossiblePoints
      );
    }
  }, [currentQuestionIndex, userAnswers, answeredQuestions, score, totalPossiblePoints, questions]);

  // Update global window prop to track current question index
  useEffect(() => {
    // Skip this effect during SSR
    if (typeof window === 'undefined') return;

    window.currentQuestionIndex = currentQuestionIndex;
  }, [currentQuestionIndex]);

  // Question answered event listener
  useEffect(() => {
    // Skip this effect during SSR
    if (typeof window === 'undefined') return;

    const handleQuestionAnswered = (event: CustomEvent<any>) => {
      console.log("Question answered event received", event.detail);

      const { questionIndex, selectedAnswers, confidenceLevel } = event.detail;
      const question = questions[questionIndex];

      if (!question || !question.Options) {
        console.error("Question or options not found");
        return;
      }

      // Calculate points earned using utility function
      const pointsEarned = countCorrectAnswers(selectedAnswers, question.Options);
      const possiblePoints = getCorrectAnswerCount(question);
      console.log(`Points earned: ${pointsEarned} out of ${possiblePoints} possible`);

      // Check if the answer is fully correct using utility function
      const isFullyCorrect = pointsEarned === possiblePoints;

      // Updates answered questions tracking if not already included
      setAnsweredQuestions(prev => {
        if (!prev.includes(questionIndex)) {
          // First time answering - add points to score
          setScore(prevScore => prevScore + pointsEarned);
          console.log(`Adding ${pointsEarned} points to score`);
          return [...prev, questionIndex];
        }
        // Already answered - update score with difference
        else {
          // Find previous answer to adjust score
          const prevAnswer = userAnswers.find(a => a.questionIndex === questionIndex);
          if (prevAnswer) {
            // Get previous points earned
            let prevPoints = 0;
            if (prevAnswer.pointsEarned !== undefined) {
              prevPoints = prevAnswer.pointsEarned;
            } else {
              // Fallback for legacy answers
              prevPoints = countCorrectAnswers(prevAnswer.selectedAnswers, question.Options);
            }

            // Update score by adding the difference
            const pointsDifference = pointsEarned - prevPoints;
            setScore(prevScore => prevScore + pointsDifference);
            console.log(`Adjusting score by ${pointsDifference} points (${prevPoints} → ${pointsEarned})`);
          }
          return prev;
        }
      });

      // Stores user answer data - always updates even if question was previously answered
      setUserAnswers(prev => {
        // Removes any existing answer for this question
        const filteredAnswers = prev.filter(answer => answer.questionIndex !== questionIndex);
        // Adds new answer with pointsEarned
        const newAnswers = [...filteredAnswers, {
          questionIndex,
          isCorrect: isFullyCorrect,
          selectedAnswers,
          confidenceLevel,
          pointsEarned
        }];
        console.log("New userAnswers state:", newAnswers);
        return newAnswers;
      });

      console.log("Event handling complete");
    };

    // Listen for custom event from the Question component
    window.addEventListener('questionAnswered', handleQuestionAnswered as EventListener);

    return () => {
      window.removeEventListener('questionAnswered', handleQuestionAnswered as EventListener);
    };
  }, [questions, userAnswers]);

  // Navigation Functions
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

  // Helper Functions
  const getCurrentQuestionAnswerData = () => {
    return userAnswers.find(answer => answer.questionIndex === currentQuestionIndex);
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setAnsweredQuestions([]);
    setUserAnswers([]);
    setScore(0);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('reviewSessionState');
    }
  };

  // Calculate current score using reimplemented function
  const calculateCurrentScore = (): number => {
    return calculateUserScore(userAnswers, questions);
  };

  // Calculated properties
  const progressPercentage = questions.length ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const isCurrentQuestionAnswered = answeredQuestions.includes(currentQuestionIndex);
  const isQuizCompleted = questions.length > 0 && answeredQuestions.length === questions.length;

  // Calculate score percentage based on total possible points
  const scorePercentage = totalPossiblePoints > 0 ? Math.round((score / totalPossiblePoints) * 100) : 0;

  // Handler for submitting quiz results
  const handleSubmitResults = async () => {
    // Don't submit results in practice mode
    if (isPracticeMode) {
      setSubmissionStatus('success');
      return;
    }

    // Make sure we have a student ID
    if (!studentId) {
      setSubmissionStatus('error');
      setStudentInfoError("Cannot submit without student ID. Please refresh and try again.");
      return;
    }

    // Update submission status
    setSubmissionStatus('submitting');

    const examId = questions[0]?.Question?.ExamID;

    // If no exam ID is present (which might happen in some cases), handle accordingly
    if (!examId) {
      setSubmissionStatus('error');
      setStudentInfoError("Cannot submit without exam ID. This may be a practice session that doesn't need to be saved.");
      return;
    }

    const result = await submitQuizResultsToDatabase(
      studentId,
      examId,
      userAnswers,
      questions,
      score,
      answeredQuestions,
      totalPossiblePoints  // Pass totalPossiblePoints to ensure consistency
    );

    // Update state based on result
    setSubmissionStatus(result.success ? 'success' : 'error');

    if (!result.success) {
      // Use type guard to safely access message property
      setStudentInfoError('success' in result && !result.success
        ? result.message
        : "Failed to submit results. Please try again.");
    }
  };
  
  // Verify score consistency - automatically fix inconsistencies
  useEffect(() => {
    // Skip this effect during SSR
    if (typeof window === 'undefined') return;

    const calculatedScore = calculateCurrentScore();
    if (calculatedScore !== score && userAnswers.length > 0) {
      console.warn(`Score inconsistency detected: state=${score}, calculated=${calculatedScore}`);
      // Automatically fix the score to ensure consistency
      setScore(calculatedScore);
    }
  }, [score, userAnswers, questions]);

  // Verify total possible points consistency
  useEffect(() => {
    // Skip this effect during SSR
    if (typeof window === 'undefined') return;

    if (questions.length > 0) {
      const calculatedTotalPoints = calculateTotalPossiblePoints(questions);
      if (calculatedTotalPoints !== totalPossiblePoints) {
        console.warn(`Total possible points inconsistency detected: state=${totalPossiblePoints}, calculated=${calculatedTotalPoints}`);
        // Automatically fix the total possible points
        setTotalPossiblePoints(calculatedTotalPoints);
      }
    }
  }, [questions, totalPossiblePoints]);

  // Back to results function
  const handleBackToResults = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard/results';
    }
  };

  // Back to practice menu
  const handleBackToPractice = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard/practice';
    }
  };

  // Return JSX...
  return (
    <div className="min-h-screen bg-gray-900 text-slate-100 p-4">
      <Sidebar />

      {/* Progress header */}
      <div className="flex justify-between items-center mb-6 px-2">
        <h1 className="text-2xl font-bold ml-20">
          {isPracticeMode ? 'Practice' : 'Review'}
        </h1>

        {/* Right side: Progress information and user info */}
        <div className="flex items-center">
          {questions.length > 0 && (
            <>
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
                Score: {score}/{totalPossiblePoints}
              </span>
            </>
          )}

          {/* User info */}
          <div className="flex items-center">
            <UserGreeting className="text-xl font-bold" />
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
          <div className="space-y-3">
            <Button
              onClick={() => typeof window !== 'undefined' && window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Try Again
            </Button>
            <div>
              <Button
                onClick={isPracticeMode ? handleBackToPractice : handleBackToResults}
                className="bg-slate-600 hover:bg-slate-700 text-white"
              >
                {isPracticeMode ? 'Back to Practice Menu' : 'Back to Results'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rest of your JSX remains the same... */}

      {/* Current Question */}
      {!loading && !error && questions.length > 0 && (
        <div className="container mx-auto mb-6 max-w-4xl">
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
        <div className="container mx-auto mt-8 max-w-4xl">
          <Card className="bg-slate-900 border-slate-800 text-slate-100">
            <CardHeader>
              <h2 className="text-2xl font-bold">
                {isPracticeMode ? 'Practice Session Complete!' : 'Quiz Complete!'}
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-xl mb-4">
                Your final score: {score}/{totalPossiblePoints} ({scorePercentage}%)
              </p>

              {/* Student ID info (display only) - only show in review mode */}
              {!isPracticeMode && (
                loadingStudentInfo ? (
                  <div className="mb-4 p-4 bg-slate-800 rounded-md">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                      <span className="text-slate-400">Loading student information...</span>
                    </div>
                  </div>
                ) : studentId ? (
                  <div className="mb-4 p-4 bg-slate-800 rounded-md">
                    <p className="text-sm text-slate-400">
                      Results will be saved for student ID: <span className="text-white font-medium">{studentId}</span>
                    </p>
                  </div>
                ) : (
                  <div className="mb-4 p-4 bg-red-800/50 rounded-md">
                    <p className="text-sm text-slate-300">
                      {studentInfoError || "Could not retrieve student information. Please refresh the page."}
                    </p>
                  </div>
                )
              )}

              {/* Practice mode message */}
              {isPracticeMode && (
                <div className="mb-4 p-4 bg-blue-800/30 rounded-md">
                  <p className="text-sm text-slate-300">
                    This is a practice session. Your results won't be permanently saved.
                  </p>
                </div>
              )}

              {/* Question Summary */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Question Summary:</h3>
                <div className="space-y-2">
                  {questions.map((q, index) => {
                    const answer = userAnswers.find(a => a.questionIndex === index);
                    const totalQuestionPoints = getCorrectAnswerCount(q);

                    // Get points earned from answer or recalculate using utility function
                    let pointsEarned = 0;
                    if (answer) {
                      pointsEarned = answer.pointsEarned !== undefined
                        ? answer.pointsEarned
                        : countCorrectAnswers(answer.selectedAnswers, q.Options);
                    }

                    return (
                      <div key={index} className="flex items-center space-x-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${answer
                          ? (pointsEarned === totalQuestionPoints ? "bg-green-600" :
                            pointsEarned > 0 ? "bg-yellow-600" : "bg-red-600")
                          : "bg-slate-700"
                          }`}>
                          {index + 1}
                        </div>
                        <span className="truncate max-w-md">
                          {q.Question.Prompt.substring(0, 60)}...
                        </span>
                        <span className="text-xs text-slate-400">
                          {answer ? `${pointsEarned}/${totalQuestionPoints} points` : 'Not answered'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              {/* Only show Save Results button in non-practice mode */}
              {!isPracticeMode && (
                <Button
                  className={`w-full ${submissionStatus === 'idle' ? 'bg-green-600 hover:bg-green-700' :
                    submissionStatus === 'submitting' ? 'bg-blue-500' :
                      submissionStatus === 'success' ? 'bg-green-700' :
                        'bg-red-600 hover:bg-red-700'
                    } text-white mb-2`}
                  onClick={handleSubmitResults}
                  disabled={submissionStatus === 'submitting' || submissionStatus === 'success' || !studentId}
                >
                  {submissionStatus === 'idle' && 'Save Results'}
                  {submissionStatus === 'submitting' && 'Submitting...'}
                  {submissionStatus === 'success' && 'Results Saved ✓'}
                  {submissionStatus === 'error' && 'Save Failed - Try Again'}
                </Button>
              )}

              <div className="flex space-x-2 w-full">
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {
                    resetQuiz();
                    setSubmissionStatus('idle');
                  }}
                >
                  Retake Quiz
                </Button>

                <Button
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white"
                  onClick={isPracticeMode ? handleBackToPractice : handleBackToResults}
                >
                  {isPracticeMode ? 'Back to Practice Menu' : 'Back to Results'}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}