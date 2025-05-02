"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useSession } from "next-auth/react";
import AnalyticsContent from '@/components/analytics/AnalyticsContent';

// Interfaces for API responses
interface ExamResult {
    ExamResultsID: number;
    StudentID: number;
    StudentName: string;
    ExamID: number;
    ExamName: string;
    Score: number;
    PassOrFail: boolean;
    Timestamp: string | null;
    ClerkshipID: null | number;
}

interface QuestionPerformance {
    StudentQuestionPerformanceID: number;
    ExamResultsID: number;
    QuestionID: number;
    Result: boolean;
    Confidence: number;
    QuestionPrompt: string;
    QuestionDifficulty: string;
}

interface HistoricalPerformance {
    ExamResults: ExamResult;
    Performances: QuestionPerformance[];
}

interface StatisticsAverageReport {
    total_exams_taken: number;
    average_score: string;
    total_questions_answered: string;
    correct_answer_percentage: string;
    exam_dates: {
        examresultsid: number;
        timestamp: string;
        score: number;
    }[];
}

interface Prediction {
    prediction: number;
    probability: number;
    prediction_text: string;
    confidence_score: number;
}

// Interfaces for processed metrics
interface MetricData {
    title: string;
    value: string;
    trend: number;
    color: string;
    data: Array<{ date: string; value: number }> | null;
}

interface MetricSections {
    historical: MetricData[];
    predictive: MetricData[];
    strengths: MetricData[];
    weaknesses: MetricData[];
    engagement: MetricData[];
}

// Context interface
interface AnalyticsContextType {
    // API data
    historicalPerformance: HistoricalPerformance[] | null;
    statisticsReport: StatisticsAverageReport | null;
    prediction: Prediction | null;

    // Loading states
    loading: boolean;
    error: string | null;

    // Processed metrics
    metrics: MetricSections | null;

    // Time filter
    timeRange: string;
    setTimeRange: React.Dispatch<React.SetStateAction<string>>;

    // Utility functions
    refreshData: () => Promise<void>;
}

// Create context
const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

// Custom hook for using the context
export const useAnalytics = (): AnalyticsContextType => {
    const context = useContext(AnalyticsContext);
    if (context === undefined) {
        throw new Error('useAnalytics must be used within an AnalyticsProvider');
    }
    return context;
};

interface AnalyticsProviderProps {
    children: React.ReactNode;
    session: any;
    apiBase: string;
}

// The Provider component
export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({
    children,
    session,
    apiBase
}) => {
    // State for API data
    const [historicalPerformance, setHistoricalPerformance] = useState<HistoricalPerformance[] | null>(null);
    const [statisticsReport, setStatisticsReport] = useState<StatisticsAverageReport | null>(null);
    const [prediction, setPrediction] = useState<Prediction | null>(null);
    const [studentId, setStudentId] = useState<number | null>(null);

    // UI state
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState<string>('Last 7 Days');

    // Debug session status
    useEffect(() => {
        console.log("Session status:", {
            exists: !!session,
            hasToken: !!session?.accessToken,
            tokenLength: session?.accessToken?.length
        });
    }, [session]);

    // Debug API base URL
    useEffect(() => {
        console.log("API Base URL:", apiBase);
        if (!apiBase) {
            console.error("Missing API Base URL. Check NEXT_PUBLIC_API_URL environment variable.");
        }
    }, [apiBase]);

    // Function to fetch student info
    const fetchStudentInfo = async (): Promise<any> => {
        console.log("Fetching student info");
        try {
            const response = await fetch(`${apiBase}/student/info`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.accessToken}`,
                }
            });

            console.log("Student info response:", {
                status: response.status,
                ok: response.ok
            });

            if (!response.ok) throw new Error(`Error: ${response.status}`);

            const data = await response.json();
            console.log("Student info data:", data);
            return data;
        } catch (error) {
            console.error("Error fetching student info:", error);
            throw error;
        }
    };

    // Function to fetch all analytics data
    const fetchAnalyticsData = async () => {
        if (!session) {
            console.error("No session available for API calls");
            setError("Authentication required");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Get student info if needed
            let currentStudentId = studentId;
            if (!currentStudentId) {
                console.log("No student ID in state, fetching from API");
                const studentData = await fetchStudentInfo();
                console.log("Student data received:", studentData);

                if (studentData && typeof studentData.StudentID === 'number') {
                    currentStudentId = studentData.StudentID;
                    setStudentId(currentStudentId);
                    console.log("Student ID set:", currentStudentId);
                } else {
                    console.error("Invalid student data structure:", studentData);
                    throw new Error("Student ID not found in response");
                }
            }

            console.log("Fetching all analytics data for student ID:", currentStudentId);

            // Parallel API requests with proper error handling
            try {
                // Historical performance data
                const histPerfPromise = (async () => {
                    const endpoint = `/question/historical-performance/?student_id=${currentStudentId}&skip=0&limit=100`;
                    console.log(`Fetching ${endpoint}`);

                    try {
                        const response = await fetch(`${apiBase}${endpoint}`, {
                            headers: {
                                Authorization: `Bearer ${session?.accessToken}`,
                                'Content-Type': 'application/json',
                            },
                        });

                        console.log(`Response for ${endpoint}:`, {
                            status: response.status,
                            ok: response.ok
                        });

                        if (!response.ok) {
                            throw new Error(`Error fetching ${endpoint}: ${response.status}`);
                        }

                        const data = await response.json();
                        console.log(`Data preview for ${endpoint}:`,
                            JSON.stringify(data).substring(0, 200) + '...');
                        return data;
                    } catch (error) {
                        console.error(`Fetch error for ${endpoint}:`, error);
                        throw error;
                    }
                })();

                // Statistics report data
                const statsReportPromise = (async () => {
                    const endpoint = `statistics-average-report`;
                    console.log(`Fetching ${endpoint}`);

                    try {
                        const response = await fetch(`${apiBase}/${endpoint}`, {
                            headers: {
                                Authorization: `Bearer ${session?.accessToken}`,
                                'Content-Type': 'application/json'
                            },
                        });

                        console.log(`Response for ${endpoint}:`, {
                            status: response.status,
                            ok: response.ok
                        });

                        if (!response.ok) {
                            throw new Error(`Error fetching ${endpoint}: ${response.status}`);
                        }

                        const data = await response.json();
                        console.log(`Data preview for ${endpoint}:`,
                            JSON.stringify(data).substring(0, 200) + '...');
                        return data;
                    } catch (error) {
                        console.error(`Fetch error for ${endpoint}:`, error);
                        throw error;
                    }
                })();

                // Prediction data
                const predictionPromise = (async () => {
                    const endpoint = `inf/prediction?student_id=${currentStudentId}`;
                    console.log(`Fetching ${endpoint}`);

                    try {
                        const response = await fetch(`${apiBase}/${endpoint}`, {
                            headers: {
                                Authorization: `Bearer ${session?.accessToken}`,
                                'Content-Type': 'application/json',
                            },
                        });

                        console.log(`Response for ${endpoint}:`, {
                            status: response.status,
                            ok: response.ok
                        });

                        if (!response.ok) {
                            throw new Error(`Error fetching ${endpoint}: ${response.status}`);
                        }

                        const data = await response.json();
                        console.log(`Data preview for ${endpoint}:`,
                            JSON.stringify(data).substring(0, 200) + '...');
                        return data;
                    } catch (error) {
                        console.error(`Fetch error for ${endpoint}:`, error);
                        throw error;
                    }
                })();

                const [histPerf, statsReport, pred] = await Promise.all([
                    histPerfPromise,
                    statsReportPromise,
                    predictionPromise
                ]);

                // Validate responses before setting state
                if (histPerf && Array.isArray(histPerf)) {
                    console.log("Historical performance data valid");
                    setHistoricalPerformance(histPerf);
                } else {
                    console.error("Invalid historical performance data:", histPerf);
                    setError("Received invalid data format for historical performance");
                }

                if (statsReport && typeof statsReport === 'object' &&
                    statsReport.exam_dates && Array.isArray(statsReport.exam_dates)) {
                    console.log("Statistics report data valid");
                    setStatisticsReport(statsReport);
                } else {
                    console.error("Invalid statistics report data:", statsReport);
                    setError("Received invalid data format for statistics report");
                }

                if (pred && typeof pred === 'object' &&
                    typeof pred.confidence_score === 'number') {
                    console.log("Prediction data valid");
                    setPrediction(pred);
                } else {
                    console.error("Invalid prediction data:", pred);
                    setError("Received invalid data format for prediction");
                }

            } catch (apiError) {
                console.error("API error during Promise.all:", apiError);
                throw apiError;
            }

        } catch (error) {
            console.error("Error fetching analytics data:", error);
            setError("Failed to load analytics data. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    // Initial data fetch
    useEffect(() => {
        if (session?.accessToken) {
            const initializeData = async () => {
                console.log("Initializing data with session token");
                try {
                    // Get student info first
                    const studentData = await fetchStudentInfo();
                    console.log("Received student data:", studentData);

                    if (studentData?.StudentID) {
                        setStudentId(studentData.StudentID);
                        console.log("Student ID set, fetching analytics data");
                        // Then fetch analytics data
                        await fetchAnalyticsData();
                    } else {
                        console.error("Invalid student data structure:", studentData);
                        throw new Error("Student ID not found in response");
                    }
                } catch (error) {
                    console.error("Error initializing data:", error);
                    setError("Failed to load student information. Please try again later.");
                    setLoading(false);
                }
            };

            initializeData();
        } else {
            console.log("No session token available, skipping initialization");
        }
    }, [session, apiBase]);

    // Function to calculate trend percentage with debug
    const calculateTrend = (scores: number[], windowSize = 2): number => {
        if (!scores || !Array.isArray(scores) || scores.length < windowSize * 2) {
            console.log("Insufficient score history for trend calculation");
            return 0;
        }

        // Get the two windows (recent and previous periods)
        const recentScores = scores.slice(-windowSize);
        const previousScores = scores.slice(-windowSize * 2, -windowSize);

        // Create progressively higher weights for more recent scores
        // For example: [1, 2, 3, 4] for a windowSize of 4
        const weights = Array.from({ length: windowSize }, (_, i) => i + 1);
        const weightSum = weights.reduce((sum, w) => sum + w, 0);

        // Calculate weighted averages for both periods
        let recentWeightedSum = 0;
        let previousWeightedSum = 0;

        for (let i = 0; i < windowSize; i++) {
            recentWeightedSum += recentScores[i] * weights[i];
            previousWeightedSum += previousScores[i] * weights[i];
        }

        const recentWeightedAvg = recentWeightedSum / weightSum;
        const previousWeightedAvg = previousWeightedSum / weightSum;

        // Avoid division by zero
        if (previousWeightedAvg === 0) return 0;

        // Calculate percentage improvement
        const trendPercentage = ((recentWeightedAvg - previousWeightedAvg) / previousWeightedAvg) * 100;

        // Optionally, round to 1 decimal place for reporting
        return Math.round(trendPercentage * 10) / 10;
    };

    // Process metrics based on the fetched data
    const metrics = useMemo<MetricSections | null>(() => {
        console.log("Calculating metrics with data:", {
            hasHistoricalPerformance: !!historicalPerformance,
            hasStatisticsReport: !!statisticsReport,
            hasPrediction: !!prediction
        });

        if (!historicalPerformance || !statisticsReport || !prediction) {
            console.log("Missing required data for metrics calculation");
            return null;
        }

        try {
            // Sort exams by timestamp (newest first) with improved error handling
            const filteredExams = [...historicalPerformance].sort((a, b) => {
                // Add null/undefined check
                if (!a.ExamResults.Timestamp) return 1;
                if (!b.ExamResults.Timestamp) return -1;

                const dateA = new Date(a.ExamResults.Timestamp).getTime();
                const dateB = new Date(b.ExamResults.Timestamp).getTime();

                // Check for invalid dates
                if (isNaN(dateA) || isNaN(dateB)) {
                    console.error("Invalid date detected in sorting:", {
                        aTimestamp: a.ExamResults.Timestamp,
                        bTimestamp: b.ExamResults.Timestamp
                    });
                    return 0;
                }

                return dateB - dateA;
            });

            console.log(`Processing ${filteredExams.length} exams for time range: ${timeRange}`);

            // Create real data points for exam scores from statistics report
            const examScores = statisticsReport.exam_dates.map(date => date.score);
            const examDates = statisticsReport.exam_dates.map(date => {
                if (!date.timestamp) return "Unknown";
                try {
                    const dateObj = new Date(date.timestamp);
                    if (isNaN(dateObj.getTime())) return "Invalid Date";
                    return dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                } catch (e) {
                    console.error("Error parsing date:", e);
                    return "Error";
                }
            });

            // Get all question performances from exams
            const allPerformances = filteredExams.flatMap(exam => exam.Performances || []);
            console.log(`Processing ${allPerformances.length} question performances`);

            // Group performances by exam timestamp (for time-based metrics)
            const performancesByExam = new Map<string, QuestionPerformance[]>();
            filteredExams.forEach(exam => {
                if (exam.ExamResults.Timestamp && exam.Performances.length > 0) {
                    const date = new Date(exam.ExamResults.Timestamp)
                        .toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                    performancesByExam.set(date, exam.Performances);
                }
            });

            // Calculate confidence metrics from real data
            // High confidence success
            const highConfidenceQuestions = allPerformances.filter(p => p.Confidence >= 4);
            const highConfidenceSuccess = highConfidenceQuestions.length > 0
                ? highConfidenceQuestions.filter(p => p.Result).length / highConfidenceQuestions.length * 100
                : 0;

            // Medium confidence success
            const mediumConfidenceQuestions = allPerformances.filter(p => p.Confidence === 3);
            const mediumConfidenceSuccess = mediumConfidenceQuestions.length > 0
                ? mediumConfidenceQuestions.filter(p => p.Result).length / mediumConfidenceQuestions.length * 100
                : 0;

            // Low confidence success
            const lowConfidenceQuestions = allPerformances.filter(p => p.Confidence <= 2);
            const lowConfidenceSuccess = lowConfidenceQuestions.length > 0
                ? lowConfidenceQuestions.filter(p => p.Result).length / lowConfidenceQuestions.length * 100
                : 0;

            // Calculate confidence-accuracy gap
            const confidenceValues = allPerformances.map(perf => perf.Confidence);
            // Fix: Cast accuracyValues to number[] to avoid the type constraints
            const accuracyValues = allPerformances.map(perf => perf.Result ? 1 : 0) as number[];

            const avgConfidence = confidenceValues.length > 0
                ? (confidenceValues.reduce((sum, val) => sum + val, 0) /
                    confidenceValues.length) / 5 * 100
                : 0;

            // Fix: Use number as the initial value in reduce
            const avgAccuracy = accuracyValues.length > 0
                ? (accuracyValues.reduce((sum: number, val: number) => sum + val, 0) /
                    accuracyValues.length) * 100
                : 0;

            const confidenceAccuracyGap = Math.abs(avgConfidence - avgAccuracy);

            // Calculate success rates by difficulty
            const difficultyPerformance: Record<string, { correct: number, total: number }> = {};
            allPerformances.forEach(perf => {
                if (!perf.QuestionDifficulty) return;

                if (!difficultyPerformance[perf.QuestionDifficulty]) {
                    difficultyPerformance[perf.QuestionDifficulty] = { correct: 0, total: 0 };
                }

                difficultyPerformance[perf.QuestionDifficulty].total += 1;
                if (perf.Result) {
                    difficultyPerformance[perf.QuestionDifficulty].correct += 1;
                }
            });

            // Calculate difficulty success rates
            const difficultyRates: Record<string, number> = {};
            Object.entries(difficultyPerformance).forEach(([difficulty, stats]) => {
                difficultyRates[difficulty] = stats.total > 0
                    ? (stats.correct / stats.total) * 100
                    : 0;
            });

            // Create performance by exam data for confidence metrics
            const confDataByDifficulty: Record<string, Array<{ date: string; value: number }>> = {};
            const confDataByConfLevel: Record<string, Array<{ date: string; value: number }>> = {};

            // Initialize with all available dates
            const allDates = Array.from(performancesByExam.keys());

            ['Easy', 'Medium', 'Hard'].forEach(diff => {
                confDataByDifficulty[diff] = [];
            });

            ['High', 'Medium', 'Low'].forEach(level => {
                confDataByConfLevel[level] = [];
            });

            // Fill with real data where available
            performancesByExam.forEach((performances, date) => {
                // By difficulty
                ['Easy', 'Medium', 'Hard'].forEach(diff => {
                    const questions = performances.filter(p => p.QuestionDifficulty === diff);
                    const value = questions.length > 0
                        ? questions.filter(p => p.Result).length / questions.length * 100
                        : null;

                    if (value !== null) {
                        confDataByDifficulty[diff].push({ date, value });
                    }
                });

                // By confidence
                const highConf = performances.filter(p => p.Confidence >= 4);
                const medConf = performances.filter(p => p.Confidence === 3);
                const lowConf = performances.filter(p => p.Confidence <= 2);

                if (highConf.length > 0) {
                    confDataByConfLevel['High'].push({
                        date,
                        value: highConf.filter(p => p.Result).length / highConf.length * 100
                    });
                }

                if (medConf.length > 0) {
                    confDataByConfLevel['Medium'].push({
                        date,
                        value: medConf.filter(p => p.Result).length / medConf.length * 100
                    });
                }

                if (lowConf.length > 0) {
                    confDataByConfLevel['Low'].push({
                        date,
                        value: lowConf.filter(p => p.Result).length / lowConf.length * 100
                    });
                }
            });

            // Process metrics into sections
            return {
                historical: [
                    {
                        title: "Average Exam Score",
                        value: `${parseFloat(statisticsReport.average_score || "0").toFixed(1)}%`,
                        trend: calculateTrend(examScores),
                        color: "#60A5FA",
                        data: examScores.map((score, i) => ({
                            date: examDates[i] || `Exam ${i + 1}`,
                            value: score
                        })),
                        description: "The mean score across all exams taken in the selected time period. Calculated as (total points earned / total possible points) × 100%."
                    },
                    {
                        title: "Correct Answer Percentage",
                        value: `${parseFloat(statisticsReport.correct_answer_percentage || "0").toFixed(1)}%`,
                        trend: calculateTrend(
                            filteredExams
                                .filter(exam => exam.Performances.length > 0)
                                .map(exam => {
                                    return exam.Performances.filter(p => p.Result).length /
                                        Math.max(1, exam.Performances.length) * 100;
                                })
                        ),
                        color: "#34D399",
                        data: filteredExams
                            .filter(exam => exam.Performances.length > 0)
                            .map(exam => {
                                const date = exam.ExamResults.Timestamp
                                    ? new Date(exam.ExamResults.Timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                    : `Exam ${exam.ExamResults.ExamResultsID}`;
                                return {
                                    date,
                                    value: exam.Performances.filter(p => p.Result).length /
                                        Math.max(1, exam.Performances.length) * 100
                                };
                            }),

                        description: "The percentage of all questions answered correctly across all exams in the selected time period. Calculated as (number of correct answers / total questions answered) × 100%."
                    },
                    {
                        title: "Exam Pass Rate",
                        value: `${Math.round(
                            filteredExams.filter(e => e.ExamResults.PassOrFail).length /
                            Math.max(1, filteredExams.length) * 100
                        )}%`,
                        trend: 0, // Calculate from historical data change
                        color: "#FBBF24",
                        data: filteredExams.map(exam => {
                            const date = exam.ExamResults.Timestamp
                                ? new Date(exam.ExamResults.Timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                : `Exam ${exam.ExamResults.ExamResultsID}`;
                            return {
                                date,
                                value: exam.ExamResults.PassOrFail ? 100 : 0
                            };
                        }),
                        description: "The percentage of exams marked as passed in the selected time period. Calculated as (number of exams passed / total exams taken) × 100%."
                    }
                ],
                predictive: [
                    {
                        title: "Graduation Likelihood",
                        value: `${Math.round(prediction.confidence_score || 0)}%`,
                        trend: 0,
                        color: "#818CF8",
                        data: null,
                        description: "A predictive score estimating the likelihood of graduation based on your performance patterns. This is calculated using a machine learning model analyzing all available performance data."
                    },
                    {
                        title: "Success Probability",
                        value: `${Math.round((prediction.probability || 0) * 100)}%`,
                        trend: 0,
                        color: "#EC4899",
                        data: null,
                        description: "The probability of passing future exams based on current performance metrics. This is derived from a predictive model analyzing past performance patterns."
                    }
                ],
                strengths: [
                    {
                        title: "High Confidence Success",
                        value: `${Math.round(highConfidenceSuccess)}%`,
                        trend: 0,
                        color: "#10B981",
                        data: confDataByConfLevel['High'],
                        description: "The percentage of questions where you reported high confidence (4-5) and answered correctly. This measures how well you know what you know. Calculated as (correct answers with high confidence / total high confidence questions) × 100%."
                    },
                    {
                        title: "Medium Confidence Success",
                        value: `${Math.round(mediumConfidenceSuccess)}%`,
                        trend: 0,
                        color: "#6366F1",
                        data: confDataByConfLevel['Medium'],
                        description: "The percentage of questions where you reported medium confidence (3) and answered correctly. Calculated as (correct answers with medium confidence / total medium confidence questions) × 100%."
                    }
                ],
                weaknesses: [
                    {
                        title: "Low Confidence Accuracy",
                        value: `${Math.round(lowConfidenceSuccess)}%`,
                        trend: 0,
                        color: "#F87171",
                        data: confDataByConfLevel['Low'],
                        description: "The percentage of questions where you reported low confidence (1-2) and answered correctly. This measures how well you recognize knowledge gaps. Calculated as (correct answers with low confidence / total low confidence questions) × 100%."
                    },
                    {
                        title: "Confidence-Accuracy Gap",
                        value: `${confidenceAccuracyGap.toFixed(1)}%`,
                        trend: 0,
                        color: "#FB923C",
                        data: null,
                        description: "The absolute difference between your average self-reported confidence (scaled to percentage) and your actual accuracy. A lower number indicates better calibration between confidence and performance. Calculated as |avgConfidence - avgAccuracy|."
                    }
                ],
                engagement: [
                    {
                        title: "Total Exams Taken",
                        value: statisticsReport.total_exams_taken.toString(),
                        trend: 0,
                        color: "#A855F7",
                        data: null,
                        description: "The total number of exams you've completed in the selected time period."
                    },
                    {
                        title: "Questions Answered",
                        value: statisticsReport.total_questions_answered,
                        trend: 0,
                        color: "#14B8A6",
                        data: null,
                        description: "The total number of questions you've answered across all exams in the selected time period."
                    }
                ]
            };
        } catch (error) {
            console.error("Error calculating metrics:", error);
            return null;
        }
    }, [historicalPerformance, statisticsReport, prediction, timeRange]);

    // Context value
    const contextValue: AnalyticsContextType = {
        historicalPerformance,
        statisticsReport,
        prediction,
        loading,
        error,
        metrics,
        timeRange,
        setTimeRange,
        refreshData: fetchAnalyticsData
    };

    return (
        <AnalyticsContext.Provider value={contextValue}>
            {children}
        </AnalyticsContext.Provider>
    );
};

// This is the client wrapper component that gets session and renders everything
export const AnalyticsClientWrapper: React.FC = () => {
    // Get session using next-auth's hook
    const { data: session } = useSession();

    // Create session object for the provider
    const sessionData = {
        accessToken: session?.accessToken || '',
    };

    const API_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}` || '';

    // Render provider with the analytics content
    return (
        <AnalyticsProvider session={sessionData} apiBase={API_BASE}>
            <AnalyticsContent />
        </AnalyticsProvider>
    );
};