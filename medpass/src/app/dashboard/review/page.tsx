'use client';

// extends window (global object) to include currentQuestionIndex, used by Question component
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
  submitQuizResultsToDatabase,
  saveQuizState,
  loadQuizState,
  getCorrectAnswerCount,
  countCorrectAnswers,
  calculateTotalPossiblePoints,
  calculateUserScore,
  checkIfCorrect,
  fetchStudentInfo
} from '@/lib/reviewUtils';

export default function ReviewPage() {
  const searchParams = useSearchParams();

  // replace mock data with state for loaded questions
  const [questions, setQuestions] = useState<QuestionResponseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  //--- state variables ---
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [totalPossiblePoints, setTotalPossiblePoints] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>('idle');
  const [studentId, setStudentId] = useState<number | null>(null);
  const [loadingStudentInfo, setLoadingStudentInfo] = useState(false);
  const [studentInfoError, setStudentInfoError] = useState<string | null>(null);

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

    getStudentInfo();
  }, []);

  // Parse question IDs from URL parameters
  const parseQuestionIds = (): number[] => {
    try {
      // Get the questionIds parameter from the URL
      const questionIdsParam = searchParams.get('questionIds');

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

        // Get question IDs from URL parameters
        const questionIds = parseQuestionIds();

        // Check if we have valid question IDs
        if (questionIds.length === 0) {
          setError('No valid question IDs provided. Please go back and select some questions.');
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

        // Calculate total possible points immediately after loading questions
        const possiblePoints = calculateTotalPossiblePoints(loadedQuestions);
        console.log(`Total possible points calculated: ${possiblePoints}`);
        setTotalPossiblePoints(possiblePoints);

        setLoading(false);
      } catch (err) {
        setError('Failed to load questions. Please try again later.');
        setLoading(false);
        console.error('Error loading questions:', err);
      }
    };

    loadQuestions();
  }, [searchParams]); // Re-run if search parameters change

  // load saved state when component mounts and after questions are loaded
  useEffect(() => {
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

  // save state whenever key state variables changes
  useEffect(() => {
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

  // update global window prop to track current question index
  useEffect(() => {
    window.currentQuestionIndex = currentQuestionIndex;
  }, [currentQuestionIndex]);

  // question answered event listener - USING REIMPLEMENTED FUNCTIONS
  useEffect(() => {
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

      // updates answered questions tracking if not already included
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

      // stores user answer data - always updates even if question was previously answered
      setUserAnswers(prev => {
        // removes any existing answer for this question
        const filteredAnswers = prev.filter(answer => answer.questionIndex !== questionIndex);
        // adds new answer with pointsEarned
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

    // listen for custom event from the Question component
    window.addEventListener('questionAnswered', handleQuestionAnswered as EventListener);

    return () => {
      window.removeEventListener('questionAnswered', handleQuestionAnswered as EventListener);
    };
  }, [questions, userAnswers]);

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

  // Calculate current score using reimplemented function
  const calculateCurrentScore = (): number => {
    return calculateUserScore(userAnswers, questions);
  };

  //--- calculated properties ---
  const progressPercentage = questions.length ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const isCurrentQuestionAnswered = answeredQuestions.includes(currentQuestionIndex);
  const isQuizCompleted = questions.length > 0 && answeredQuestions.length === questions.length;

  // Calculate score percentage based on total possible points
  const scorePercentage = totalPossiblePoints > 0 ? Math.round((score / totalPossiblePoints) * 100) : 0;

  // Handler for submitting quiz results
  const handleSubmitResults = async () => {
    // Make sure we have a student ID
    if (!studentId) {
      setSubmissionStatus('error');
      setStudentInfoError("Cannot submit without student ID. Please refresh and try again.");
      return;
    }

    // Update submission status
    setSubmissionStatus('submitting');

    const examId = questions[0].Question.ExamID;
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
      setStudentInfoError(result.message || "Failed to submit results. Please try again.");
    }
  };

  // Verify score consistency - automatically fix inconsistencies
  useEffect(() => {
    const calculatedScore = calculateCurrentScore();
    if (calculatedScore !== score && userAnswers.length > 0) {
      console.warn(`Score inconsistency detected: state=${score}, calculated=${calculatedScore}`);
      // Automatically fix the score to ensure consistency
      setScore(calculatedScore);
    }
  }, [score, userAnswers, questions]);

  // Verify total possible points consistency
  useEffect(() => {
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
    window.location.href = '/dashboard/results';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-slate-100 p-4">
      <Sidebar />

      {/* Progress header */}
      <div className="flex justify-between items-center mb-6 px-2">
        <h1 className="text-2xl font-bold ml-20">Review</h1>

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
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Try Again
            </Button>
            <div>
              <Button
                onClick={handleBackToResults}
                className="bg-slate-600 hover:bg-slate-700 text-white"
              >
                Back to Results
              </Button>
            </div>
          </div>
        </div>
      )}

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
              <h2 className="text-2xl font-bold">Quiz Complete!</h2>
            </CardHeader>
            <CardContent>
              <p className="text-xl mb-4">
                Your final score: {score}/{totalPossiblePoints} ({scorePercentage}%)
              </p>

              {/* Student ID info (display only) */}
              {loadingStudentInfo ? (
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
                  onClick={handleBackToResults}
                >
                  Back to Results
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}