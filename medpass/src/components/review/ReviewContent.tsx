'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import Question from '@/components/review/Question';
import UserGreeting from '@/components/UserGreeting';
import { useSession, getSession } from 'next-auth/react';

// ============= INTERFACES =============

// Interface matching the API response format
export interface QuestionResponseData {
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
    GradeClassification: {
        GradeClassificationID: number;
        ClassificationName: string;
        UnitType: string;
    };
}

// Structure for user answer data
export interface UserAnswer {
    questionIndex: number;
    selectedAnswers: number[];
    confidenceLevel: string;
    isCorrect: boolean;
    pointsEarned?: number;
}

// Confidence level options
export const confidenceLevels = [
    { id: "very-bad", label: "Very Bad" },
    { id: "bad", label: "Bad" },
    { id: "neutral", label: "Neutral" },
    { id: "good", label: "Good" },
    { id: "very-good", label: "Very Good" }
];

// Submission status type
export type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'error';

// API response types
export interface SubmissionSuccessResult {
    success: true;
    data: any;
}

export interface SubmissionErrorResult {
    success: false;
    message: string;
}

export type SubmissionResult = SubmissionSuccessResult | SubmissionErrorResult;

// Configure global declaration for currentQuestionIndex
declare global {
    interface Window {
        currentQuestionIndex?: number;
    }
}

// ============= REVIEW CONTENT COMPONENT =============

export default function ReviewContent() {
    // Hooks
    const searchParams = useSearchParams();
    const { data: session } = useSession();

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

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '';

    // ===== UTILITY FUNCTIONS =====

    // Get auth headers for API requests
    const getHeaders = async (): Promise<Record<string, string>> => {
        try {
            const session = await getSession();
            return {
                'Content-Type': 'application/json',
                ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {})
            };
        } catch (error) {
            // Fallback if session retrieval fails
            return { 'Content-Type': 'application/json' };
        }
    };

    // Helper function to count correct answers in a question
    const getCorrectAnswerCount = (questionData: QuestionResponseData): number => {
        if (!questionData?.Options) return 0;
        return questionData.Options.filter(opt => opt.CorrectAnswer).length;
    };

    // Helper function to count correct answers selected by user
    const countCorrectAnswers = (selectedAnswers: number[], questionOptions: any[]): number => {
        if (!selectedAnswers || !questionOptions) return 0;
        return selectedAnswers.reduce((count, answerId) => {
            const option = questionOptions.find(opt => opt.OptionID === answerId);
            return option?.CorrectAnswer ? count + 1 : count;
        }, 0);
    };

    // Calculate total possible points
    const calculateTotalPossiblePoints = (questions: QuestionResponseData[]): number => {
        if (!questions?.length) return 0;
        return questions.reduce((total, question) => {
            if (!question?.Options) return total;
            return total + question.Options.filter(opt => opt.CorrectAnswer).length;
        }, 0);
    };

    // Calculate user's score
    const calculateUserScore = (userAnswers: UserAnswer[], questions: QuestionResponseData[]): number => {
        if (!userAnswers?.length || !questions?.length) return 0;

        return userAnswers.reduce((total, answer) => {
            // Use pre-calculated points if available
            if (answer.pointsEarned !== undefined) {
                return total + answer.pointsEarned;
            }

            const question = questions[answer.questionIndex];
            if (!question?.Options || !Array.isArray(answer.selectedAnswers)) return total;

            const correctCount = countCorrectAnswers(answer.selectedAnswers, question.Options);
            return total + correctCount;
        }, 0);
    };

    // Local storage functions
    const saveQuizState = (
        currentQuestionIndex: number,
        userAnswers: UserAnswer[],
        answeredQuestions: number[],
        score: number,
        totalPossiblePoints: number
    ) => {
        try {
            localStorage.setItem('reviewSessionState', JSON.stringify({
                currentQuestionIndex,
                userAnswers,
                answeredQuestions,
                score,
                totalPossiblePoints
            }));
        } catch (e) {
            // Silent fail - if localStorage isn't available, we can still function
        }
    };

    const loadQuizState = () => {
        try {
            const savedState = localStorage.getItem('reviewSessionState');
            return savedState ? JSON.parse(savedState) : null;
        } catch (e) {
            return null;
        }
    };

    // ===== API FUNCTIONS =====

    // Fetch student information
    const fetchStudentInfo = async (): Promise<any> => {
        try {

            const response = await fetch(`${apiBase}/student/info`, { 
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.accessToken}`,
                }
             });

            if (!response.ok) throw new Error(`Error: ${response.status}`);
            return await response.json();
        } catch (error) {
            throw error;
        }
    };

    // Fetch single question
    const fetchQuestionDetails = async (questionId: number): Promise<QuestionResponseData> => {
        try {
            const headers = await getHeaders();
            const response = await fetch(`${apiBase}/question/${questionId}`, { headers });

            if (!response.ok) throw new Error(`Error: ${response.status}`);
            return await response.json();
        } catch (error) {
            throw error;
        }
    };

    // Fetch all questions by IDs
    const fetchQuizQuestions = async (questionIds: number[]): Promise<QuestionResponseData[]> => {
        try {
            const questionsPromises = questionIds.map(id => fetchQuestionDetails(id));
            return await Promise.all(questionsPromises);
        } catch (error) {
            throw error;
        }
    };

    // Fetch questions by domain
    const fetchQuizQuestionsByDomain = async (
        domain: string,
        subdomain: string,
        isPractice: boolean
    ): Promise<QuestionResponseData[]> => {
        try {
            const headers = await getHeaders();
            headers['Accept'] = 'application/json';

            const endpoint = isPractice
                ? `/question/practice/${encodeURIComponent(domain)}/${encodeURIComponent(subdomain)}`
                : `/question/review/${encodeURIComponent(domain)}/${encodeURIComponent(subdomain)}`;

            const response = await fetch(`${apiBase}${endpoint}`, {
            });

            if (!response.ok) throw new Error(`Error: ${response.status}`);

            const data = await response.json();
            if (!Array.isArray(data)) throw new Error("API returned invalid data format");

            return data as QuestionResponseData[];
        } catch (error) {
            throw error;
        }
    };

    // Submit quiz results
    const submitQuizResultsToDatabase = async (
        studentId: number,
        examId: number,
        userAnswers: UserAnswer[],
        questions: QuestionResponseData[],
        score: number,
        totalPossiblePoints: number
    ): Promise<SubmissionResult> => {
        try {
            // Helper function for confidence level conversion
            const confidenceToInt = (confidenceStr: string): number => {
                switch (confidenceStr.toLowerCase()) {
                    case 'very-good': return 5;
                    case 'good': return 4;
                    case 'neutral': return 3;
                    case 'bad': return 2;
                    case 'very-bad': return 1;
                    default: return 3;
                }
            };

            const percentageScore = Math.round((score / totalPossiblePoints) * 100);

            const formattedData = {
                StudentID: studentId,
                ExamID: examId,
                ClerkshipID: null,
                Score: percentageScore,
                PassOrFail: null,
                Timestamp: new Date().toISOString(),
                Performances: userAnswers.map((answer: UserAnswer) => {
                    const pointsEarned = answer.pointsEarned !== undefined
                        ? answer.pointsEarned
                        : countCorrectAnswers(answer.selectedAnswers, questions[answer.questionIndex].Options);

                    const totalPossible = getCorrectAnswerCount(questions[answer.questionIndex]);

                    return {
                        QuestionID: questions[answer.questionIndex].Question.QuestionID,
                        Result: answer.isCorrect,
                        Confidence: confidenceToInt(answer.confidenceLevel),
                        PointsEarned: pointsEarned,
                        TotalPossible: totalPossible
                    };
                })
            };

            const headers = await getHeaders();
            const response = await fetch(`${apiBase}/question/exam-results-with-performance/`, {
                method: 'POST',
                headers,
                body: JSON.stringify(formattedData)
            });

            if (!response.ok) {
                return { success: false, message: `Failed to submit: ${response.status}` };
            }

            const result = await response.json();
            return { success: true, data: result };
        } catch (error) {
            return { success: false, message: String(error) };
        }
    };

    // ===== HELPER FUNCTIONS =====

    // Parse URL parameters for question IDs
    const parseQuestionIds = (): number[] => {
        if (!searchParams) return [];

        const questionIdsParam = searchParams.get('questionids');
        if (!questionIdsParam) return [];

        return questionIdsParam.split(',')
            .map(id => id.trim())
            .filter(id => id.length > 0)
            .map(id => parseInt(id, 10))
            .filter(id => !isNaN(id));
    };

    // Get data for current question
    const getCurrentQuestionAnswerData = () => {
        return userAnswers.find(answer => answer.questionIndex === currentQuestionIndex);
    };

    // Navigation functions
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

    const resetQuiz = () => {
        setCurrentQuestionIndex(0);
        setAnsweredQuestions([]);
        setUserAnswers([]);
        setScore(0);
        try {
            localStorage.removeItem('reviewSessionState');
        } catch (e) {
            // Silent fail
        }
    };

    const handleBackToResults = () => {
        window.location.href = '/dashboard/results';
    };

    const handleBackToPractice = () => {
        window.location.href = '/dashboard/practice';
    };

    // Submit results handler
    const handleSubmitResults = async () => {
        // Don't submit in practice mode
        if (isPracticeMode) {
            setSubmissionStatus('success');
            return;
        }

        // Validate student ID
        if (!studentId) {
            setSubmissionStatus('error');
            setStudentInfoError("Cannot submit without student ID. Please refresh and try again.");
            return;
        }

        setSubmissionStatus('submitting');

        const examId = questions[0]?.Question?.ExamID;
        if (!examId) {
            setSubmissionStatus('error');
            setStudentInfoError("Cannot submit without exam ID. This may be a practice session.");
            return;
        }

        const result = await submitQuizResultsToDatabase(
            studentId,
            examId,
            userAnswers,
            questions,
            score,
            totalPossiblePoints
        );

        setSubmissionStatus(result.success ? 'success' : 'error');

        if (!result.success) {
            setStudentInfoError(result.message || "Failed to submit results. Please try again.");
        }
    };

    // ===== EFFECT HOOKS =====

    // Load student information
    useEffect(() => {
        const getStudentInfo = async () => {
            try {
                setLoadingStudentInfo(true);
                setStudentInfoError(null);
                const studentData = await fetchStudentInfo();

                if (studentData?.StudentID) {
                    setStudentId(studentData.StudentID);
                } else {
                    throw new Error("Student ID not found in response");
                }
            } catch (err) {
                setStudentInfoError("Failed to retrieve student information. Please try again later.");
            } finally {
                setLoadingStudentInfo(false);
            }
        };

        getStudentInfo();
    }, []);

    // Load questions from API
    useEffect(() => {
        if (!searchParams) return;

        const loadQuestions = async () => {
            try {
                setLoading(true);

                // Check for practice mode
                const practiceParam = searchParams.get('practice');
                const isPractice = practiceParam === 'true';
                setIsPracticeMode(isPractice);

                // Check for domain parameters
                const domain = searchParams.get('domain');
                const subdomain = searchParams.get('subdomain');

                let loadedQuestions: QuestionResponseData[] = [];

                // Domain-based or ID-based fetching
                if (domain && subdomain) {
                    loadedQuestions = await fetchQuizQuestionsByDomain(domain, subdomain, isPractice);

                    if (!loadedQuestions.length) {
                        setError(`No questions found for ${domain} (${subdomain}). Please try a different domain or go back.`);
                        setLoading(false);
                        return;
                    }
                } else {
                    const questionIds = parseQuestionIds();

                    if (!questionIds.length) {
                        setError('No valid question IDs or domain parameters provided. Please go back and select some questions.');
                        setLoading(false);
                        return;
                    }

                    loadedQuestions = await fetchQuizQuestions(questionIds);

                    if (!loadedQuestions.length) {
                        setError('No questions found with the provided IDs. Please try again with different questions.');
                        setLoading(false);
                        return;
                    }
                }

                setQuestions(loadedQuestions);
                setLoading(false);

                // Calculate total possible points after questions are loaded
                setTimeout(() => {
                    const possiblePoints = calculateTotalPossiblePoints(loadedQuestions);
                    setTotalPossiblePoints(possiblePoints);
                }, 0);

            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                setError(`Failed to load questions: ${errorMessage}. Please try again later.`);
                setLoading(false);
            }
        };

        loadQuestions();
    }, [searchParams]);

    // Load saved state
    useEffect(() => {
        if (!questions.length || loading) return;

        const savedState = loadQuizState();
        if (savedState) {
            setCurrentQuestionIndex(savedState.currentQuestionIndex);
            setUserAnswers(savedState.userAnswers);
            setAnsweredQuestions(savedState.answeredQuestions);
            setScore(savedState.score);

            if (savedState.totalPossiblePoints) {
                setTotalPossiblePoints(savedState.totalPossiblePoints);
            }
        }
    }, [questions, loading]);

    // Save state on changes
    useEffect(() => {
        if (!questions.length) return;

        saveQuizState(
            currentQuestionIndex,
            userAnswers,
            answeredQuestions,
            score,
            totalPossiblePoints
        );
    }, [currentQuestionIndex, userAnswers, answeredQuestions, score, totalPossiblePoints, questions]);

    // Update global window prop
    useEffect(() => {
        window.currentQuestionIndex = currentQuestionIndex;
    }, [currentQuestionIndex]);

    // Question answered event listener
    useEffect(() => {
        const handleQuestionAnswered = (event: CustomEvent<any>) => {
            const { questionIndex, selectedAnswers, confidenceLevel } = event.detail;
            const question = questions[questionIndex];

            if (!question?.Options) return;

            // Calculate points earned
            const pointsEarned = countCorrectAnswers(selectedAnswers, question.Options);
            const possiblePoints = getCorrectAnswerCount(question);
            const isFullyCorrect = pointsEarned === possiblePoints;

            // Update answered questions and score
            setAnsweredQuestions(prev => {
                if (!prev.includes(questionIndex)) {
                    // First time answering
                    setScore(prevScore => prevScore + pointsEarned);
                    return [...prev, questionIndex];
                } else {
                    // Already answered - update score with difference
                    const prevAnswer = userAnswers.find(a => a.questionIndex === questionIndex);
                    if (prevAnswer) {
                        // Get previous points
                        const prevPoints = prevAnswer.pointsEarned !== undefined
                            ? prevAnswer.pointsEarned
                            : countCorrectAnswers(prevAnswer.selectedAnswers, question.Options);

                        // Update score
                        const pointsDifference = pointsEarned - prevPoints;
                        setScore(prevScore => prevScore + pointsDifference);
                    }
                    return prev;
                }
            });

            // Update user answers
            setUserAnswers(prev => {
                const filteredAnswers = prev.filter(answer => answer.questionIndex !== questionIndex);
                return [...filteredAnswers, {
                    questionIndex,
                    isCorrect: isFullyCorrect,
                    selectedAnswers,
                    confidenceLevel,
                    pointsEarned
                }];
            });
        };

        window.addEventListener('questionAnswered', handleQuestionAnswered as EventListener);
        return () => {
            window.removeEventListener('questionAnswered', handleQuestionAnswered as EventListener);
        };
    }, [questions, userAnswers]);

    // Verify score consistency
    useEffect(() => {
        if (!userAnswers.length) return;

        const calculatedScore = calculateUserScore(userAnswers, questions);
        if (calculatedScore !== score) {
            setScore(calculatedScore);
        }
    }, [score, userAnswers, questions]);

    // Verify total possible points consistency
    useEffect(() => {
        if (!questions.length) return;

        const calculatedTotalPoints = calculateTotalPossiblePoints(questions);
        if (calculatedTotalPoints !== totalPossiblePoints) {
            setTotalPossiblePoints(calculatedTotalPoints);
        }
    }, [questions, totalPossiblePoints]);

    // ===== CALCULATED VALUES =====
    const progressPercentage = questions.length ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
    const isCurrentQuestionAnswered = answeredQuestions.includes(currentQuestionIndex);
    const isQuizCompleted = questions.length > 0 && answeredQuestions.length === questions.length;
    const scorePercentage = totalPossiblePoints > 0 ? Math.round((score / totalPossiblePoints) * 100) : 0;

    // ===== RENDER JSX =====
    return (
        <>
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
                            onClick={() => window.location.reload()}
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

                                        // Get points earned from answer or recalculate
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
        </>
    );
}