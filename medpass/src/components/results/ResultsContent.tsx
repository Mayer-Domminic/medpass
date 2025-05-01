'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Domain from '@/components/results/domain';
import Sidebar from '@/components/navbar';
import UserGreeting from '@/components/UserGreeting';
import { useSession } from 'next-auth/react';

// ============= INTERFACES =============

export interface ApiResponseItem {
    ExamResults: {
        ExamResultsID: number;
        StudentID?: number;
        StudentName?: string;
        ExamID?: number;
        ExamName?: string;
        Score?: number;
        PassOrFail?: boolean;
        Timestamp?: string | null;
        ClerkshipID?: number | null;
    };
    Performances: Performance[];
}

export type Performance = {
    StudentQuestionPerformanceID: number;
    ExamResultsID: number;
    QuestionID: number;
    Result: boolean;
    Confidence: number;
    QuestionPrompt: string;
    QuestionDifficulty: string;
    SelectedOptionID?: number;
};

export type ExamResult = {
    ExamResultsID: number;
    StudentID: number;
    StudentName: string;
    ExamID: number;
    ExamName: string;
    Score: number;
    PassOrFail: boolean;
    Timestamp?: string | null;
    ClerkshipID?: number | null;
};

// ============= COMPONENT =============

export default function ResultsContent() {
    // ===== HOOKS =====
    const router = useRouter();
    const { data: session } = useSession();

    // ===== STATE HOOKS =====
    const [performanceData, setPerformanceData] = useState<ApiResponseItem[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

    // ===== CONFIGURATION =====
    const apiBase = `${process.env.NEXT_PUBLIC_API_URL}/api/v1`;

    // ===== EFFECT HOOKS =====

    useEffect(() => {
        if (!session?.accessToken) return;
        fetchData();
    }, [session]);

    // ===== API FUNCTIONS =====

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${apiBase}/question/historical-performance/?skip=0&limit=100`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session?.accessToken}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            setPerformanceData(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    // ===== EVENT HANDLERS =====

    const handleQuestionSelect = (questionId: string, isSelected: boolean) => {
        if (isSelected) {
            setSelectedQuestions(prev =>
                prev.includes(questionId) ? prev : [...prev, questionId]
            );
        } else {
            setSelectedQuestions(prev => prev.filter(id => id !== questionId));
        }
    };

    /**
     * Handle taking mock quiz
     */
    const handleTakeMockQuiz = () => {
        if (selectedQuestions.length === 0) {
            alert('Please select at least one question for the mock quiz');
            return;
        }

        // Using the App Router style navigation with query params
        const queryString = selectedQuestions.join(',');

        // Store session state in localStorage (client-side only)
        if (typeof window !== 'undefined') {
            localStorage.removeItem('reviewSessionState');
        }

        router.push(`/dashboard/review?questionids=${encodeURIComponent(queryString)}`);
    };

    // ===== RENDER JSX =====
    return (
        <>
            <Sidebar />

            {/* Progress header */}
            <div className="flex justify-between items-center mb-6 px-2">
                <h1 className="text-2xl font-bold ml-20">Student Historical Performance</h1>

                {/* Right side: User info */}
                <div className="flex items-center">
                    <UserGreeting className="text-xl font-bold" />
                </div>
            </div>

            <div className="flex-1 max-w-4xl mx-auto">
                {/* Authentication Warning */}
                {!session?.accessToken && (
                    <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-300 px-4 py-3 rounded mb-4">
                        <p>Please sign in to view your performance data.</p>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-4">
                        <p>Loading data...</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded mb-4">
                        <p>Error: {error}</p>
                    </div>
                )}

                {/* Results Content */}
                {performanceData && performanceData.length > 0 && (
                    <>
                        {/* Mock Quiz Button Section */}
                        <div className="bg-gray-800 rounded-lg p-4 mb-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-semibold mb-1">Create Mock Quiz</h2>
                                    <p className="text-sm text-gray-400">
                                        Select questions from your history to create a personalized mock quiz
                                    </p>
                                </div>
                                <button
                                    onClick={handleTakeMockQuiz}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium transition-colors"
                                    disabled={selectedQuestions.length === 0}
                                >
                                    Take Mock Quiz
                                </button>
                            </div>
                        </div>

                        {/* Exam Results List */}
                        <div className="space-y-6">
                            <div className="space-y-4">
                                {performanceData.map((item) => {
                                    // Transform API data to match Domain component props
                                    const examResult: ExamResult = {
                                        ExamResultsID: item.ExamResults.ExamResultsID,
                                        StudentID: item.ExamResults.StudentID || 0,
                                        StudentName: item.ExamResults.StudentName || 'Unknown Student',
                                        ExamID: item.ExamResults.ExamID || 0,
                                        ExamName: item.ExamResults.ExamName || 'Unknown Exam',
                                        Score: item.ExamResults.Score || 0,
                                        PassOrFail: item.ExamResults.PassOrFail || false,
                                        Timestamp: item.ExamResults.Timestamp || null,
                                        ClerkshipID: item.ExamResults.ClerkshipID
                                    };

                                    return (
                                        <Domain
                                            key={examResult.ExamResultsID}
                                            examResult={examResult}
                                            performances={item.Performances}
                                            onQuestionSelect={handleQuestionSelect}
                                            selectedQuestions={selectedQuestions}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}

                {/* Empty State */}
                {performanceData && (performanceData.length === 0 || !performanceData.some(item => item.Performances && item.Performances.length > 0)) && (
                    <>
                        <div className="flex items-center justify-center h-full w-full py-32">
                            <div className="text-center">
                                <p className="text-gray-400 text-lg font-semibold">No exams to display</p>
                                <p className="text-gray-500 text-sm mt-2">
                                    Complete some exams to see your performance history
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}