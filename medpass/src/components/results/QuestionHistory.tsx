'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSession } from 'next-auth/react';

// ============= INTERFACES =============

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

export type ApiResponseItem = {
    ExamResults: ExamResult;
    Performances: Performance[];
};

export type ContentArea = {
    ContentAreaID: number;
    ContentName: string;
    Description: string;
    Discipline: string;
};

export type GradeClassification = {
    GradeClassificationID: number;
    ClassificationName: string;
    UnitType: string;
    ClassOfferingID: number;
};

export type QuestionDetail = {
    QuestionID: number;
    ExamID: number;
    Prompt: string;
    QuestionDifficulty: string;
    ImageUrl: string | null;
    ImageDependent: boolean;
    ImageDescription: string | null;
    GradeClassificationID: number;
};

export type Option = {
    OptionID: number;
    CorrectAnswer: boolean;
    Explanation: string;
    OptionDescription: string;
};

export type QuestionData = {
    Question: QuestionDetail;
    Options: Option[];
    ContentAreas: ContentArea[];
    GradeClassification: GradeClassification;
};

export type Attempt = {
    attemptNumber: number;
    answer: number;
    correct: boolean;
    confidence: number;
    date: string;
    examName?: string;
    examId?: number;
};

// Local extended interface
interface EnhancedPerformance extends Performance {
    isChecked?: boolean;
    domain?: string;
    contentAreas?: ContentArea[];
    ExamName?: string;
    Timestamp?: string;
}

// ============= COMPONENT =============

const QuestionHistory: React.FC = () => {
    // ===== STATE HOOKS =====
    const [performances, setPerformances] = useState<EnhancedPerformance[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [previewQuestionId, setPreviewQuestionId] = useState<number | null>(null);
    const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
    const [domainFilter, setDomainFilter] = useState<string>('all');
    const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
    const [resultFilter, setResultFilter] = useState<string>('all');
    const [previewQuestion, setPreviewQuestion] = useState<QuestionData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [historicalAttempts, setHistoricalAttempts] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
    const [performanceMetrics, setPerformanceMetrics] = useState({
        totalAttempts: 0,
        successRate: 0,
        avgConfidence: 0
    });

    // ===== HOOKS =====
    const router = useRouter();
    const { data: session } = useSession();

    // ===== CONFIGURATION =====
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '';

    // ===== UTILITY FUNCTIONS =====

    const formatDate = (dateInput: string | Date): string => {
        if (!dateInput) return 'Unknown date';

        const date = dateInput instanceof Date ? dateInput : new Date(dateInput);

        // Check if date is valid
        if (isNaN(date.getTime())) return 'Invalid date';

        // Format as MM/DD/YYYY
        return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    };

    const getOptionLetter = (index: number): string => {
        return String.fromCharCode(65 + index);
    };

    const getDifficultyColor = (difficulty?: string) => {
        if (!difficulty) return { color: 'border-gray-500', bg: 'bg-gray-500/10', text: 'text-gray-500' };

        switch (difficulty.toLowerCase()) {
            case 'easy':
                return { color: 'border-green-500', bg: 'bg-green-500/10', text: 'text-green-500' };
            case 'medium':
                return { color: 'border-yellow-500', bg: 'bg-yellow-500/10', text: 'text-yellow-500' };
            case 'hard':
                return { color: 'border-red-500', bg: 'bg-red-500/10', text: 'text-red-500' };
            default:
                return { color: 'border-gray-500', bg: 'bg-gray-500/10', text: 'text-gray-500' };
        }
    };

    // ===== API FUNCTIONS =====

    const getQuestionDetails = async (questionId: string): Promise<any | null> => {
        try {
            const response = await fetch(`${apiBase}/question/${questionId}`, {
                headers: session?.accessToken ? {
                    'Authorization': `Bearer ${session.accessToken}`
                } : {}
            });

            if (!response.ok) {
                return null;
            }

            const data = await response.json();
            return data;
        } catch (error) {
            return null;
        }
    };

    const fetchHistoricalPerformance = async (questionId?: string) => {
        if (!session?.accessToken) {
            setError("Authentication required. Please sign in to view performance data.");
            setLoading(false);
            return null;
        }

        try {
            const response = await fetch(`${apiBase}/question/historical-performance/?skip=0&limit=100`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.accessToken}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch performance data. Status: ${response.status}`);
            }

            const data: ApiResponseItem[] = await response.json();

            // If questionId is provided, filter for that specific question's history
            if (questionId) {
                const allAttempts: any[] = [];

                for (const result of data) {
                    if (result.Performances && result.Performances.length > 0) {
                        const matchingPerformances = result.Performances.filter(
                            (perf: any) => perf.QuestionID.toString() === questionId
                        );

                        if (matchingPerformances.length > 0) {
                            matchingPerformances.forEach((perf: any) => {
                                allAttempts.push({
                                    ...perf,
                                    ExamName: result.ExamResults.ExamName || 'Unknown Exam',
                                    ExamDate: result.ExamResults.Timestamp || new Date().toISOString(),
                                    ExamResultsID: result.ExamResults.ExamResultsID,
                                    StudentID: result.ExamResults.StudentID
                                });
                            });
                        }
                    }
                }

                const sortedAttempts = allAttempts.sort((a, b) => {
                    const dateA = new Date(a.ExamDate).getTime();
                    const dateB = new Date(b.ExamDate).getTime();
                    return dateB - dateA;
                });

                return sortedAttempts;
            }
            // For initial data load, process all performances
            else {
                const allPerformances: EnhancedPerformance[] = [];
                const processedQuestionIds = new Set<number>();

                for (const item of data) {
                    if (item.Performances && item.Performances.length > 0) {
                        for (const perf of item.Performances) {
                            if (!processedQuestionIds.has(perf.QuestionID)) {
                                processedQuestionIds.add(perf.QuestionID);

                                allPerformances.push({
                                    ...perf,
                                    isChecked: false,
                                    ExamName: item.ExamResults.ExamName || 'Unknown Exam',
                                    Timestamp: item.ExamResults.Timestamp || new Date().toISOString()
                                });
                            }
                        }
                    }
                }

                // Fetch additional details for each question (domain, content areas)
                const enhancedPerformances = await Promise.all(
                    allPerformances.map(async (perf) => {
                        try {
                            const details = await getQuestionDetails(perf.QuestionID.toString());

                            if (details) {
                                return {
                                    ...perf,
                                    domain: details.GradeClassification?.ClassificationName || 'Unknown',
                                    contentAreas: details.ContentAreas || []
                                };
                            }

                            return perf;
                        } catch (error) {
                            return perf;
                        }
                    })
                );

                setPerformances(enhancedPerformances);
                setLoading(false);
                return null;
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching data';
            setError(errorMessage);
            setLoading(false);
            return null;
        }
    };

    const calculatePerformanceMetrics = (attempts: any[]) => {
        if (!attempts || attempts.length === 0) {
            return {
                totalAttempts: 0,
                successRate: 0,
                avgConfidence: 0
            };
        }

        const totalAttempts = attempts.length;

        const correctAttempts = attempts.filter(a => {
            const isCorrect = a.correct === true || a.Result === true;
            return isCorrect;
        }).length;

        const successRate = Math.round((correctAttempts / totalAttempts) * 100);

        let totalConfidence = 0;
        let confidenceCount = 0;

        attempts.forEach(a => {
            const confidence = a.confidence !== undefined ? a.confidence : a.Confidence;

            if (confidence !== undefined && confidence !== null) {
                totalConfidence += Number(confidence);
                confidenceCount++;
            }
        });

        const avgConfidence = confidenceCount > 0
            ? parseFloat((totalConfidence / confidenceCount).toFixed(1))
            : 0;

        return {
            totalAttempts,
            successRate,
            avgConfidence
        };
    };

    // ===== EFFECT HOOKS =====

    /**
     * Fetch historical performance data on component mount
     */
    useEffect(() => {
        if (!session?.accessToken) {
            setError("Authentication required. Please sign in to view performance data.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        fetchHistoricalPerformance();
    }, [session]);

    // ===== EVENT HANDLERS =====

    const handleQuestionToggle = (questionId: number) => {
        setPerformances(prevPerformances =>
            prevPerformances.map(p =>
                p.QuestionID === questionId ? { ...p, isChecked: !p.isChecked } : p
            )
        );

        // Update selected questions array
        setSelectedQuestions(prevSelected => {
            if (prevSelected.includes(questionId)) {
                return prevSelected.filter(id => id !== questionId);
            } else {
                return [...prevSelected, questionId];
            }
        });
    };

    const handleQuestionClick = async (questionId: number) => {
        setPreviewQuestionId(questionId);
        setLoadingHistory(true);
        setHistoricalAttempts([]); // Reset previous attempts

        try {
            // Fetch question details for the preview modal
            const details = await getQuestionDetails(questionId.toString());

            if (details) {
                setPreviewQuestion(details);
            } else {
                setError(`Could not load details for question ${questionId}`);
            }

            // Fetch historical attempts for this question ID
            if (session?.accessToken) {
                const historyData = await fetchHistoricalPerformance(questionId.toString());

                if (historyData) {
                    setHistoricalAttempts(historyData);

                    // Calculate performance metrics for this question
                    const attempts = historyData.map(histAttempt => ({
                        answer: histAttempt.SelectedOptionID,
                        correct: histAttempt.Result === true,
                        confidence: histAttempt.Confidence || 0,
                        date: formatDate(histAttempt.ExamDate || histAttempt.Timestamp),
                        examName: histAttempt.ExamName || 'Unknown exam',
                        examId: histAttempt.ExamResultsID
                    }));

                    const metrics = calculatePerformanceMetrics(attempts);
                    setPerformanceMetrics(metrics);
                }
            }
        } catch (error) {
            setError('Failed to load question details');
        } finally {
            setLoadingHistory(false);
        }
    };

    /**
     * Close preview modal
     */
    const closePreview = () => {
        setPreviewQuestionId(null);
        setPreviewQuestion(null);
        setHistoricalAttempts([]);
    };

    /**
     * Handle select all questions
     */
    const handleSelectAll = () => {
        const allFilteredSelected = filteredPerformances.every(p => p.isChecked);

        setPerformances(prevPerformances =>
            prevPerformances.map(p => {
                const matchesFilter = filteredPerformances.some(fp => fp.QuestionID === p.QuestionID);

                if (matchesFilter) {
                    return { ...p, isChecked: !allFilteredSelected };
                }

                return p;
            })
        );

        if (allFilteredSelected) {
            const filteredQuestionIds = filteredPerformances.map(p => p.QuestionID);
            setSelectedQuestions(prevSelected =>
                prevSelected.filter(id => !filteredQuestionIds.includes(id))
            );
        } else {
            const filteredQuestionIds = filteredPerformances.map(p => p.QuestionID);
            setSelectedQuestions(prevSelected => {
                const selectedSet = new Set(prevSelected);

                filteredQuestionIds.forEach(id => selectedSet.add(id));

                return Array.from(selectedSet);
            });
        }
    };

    /**
     * Handle creating mock quiz
     */
    const handleCreateMockQuiz = () => {
        if (selectedQuestions.length === 0) {
            alert('Please select at least one question');
            return;
        }

        // Store selected question IDs in URL query
        router.push(`/dashboard/review/?questionids=${selectedQuestions.join(',')}`);

        // Clear any localStorage data that might interfere with the new quiz
        localStorage.removeItem('reviewSessionState');
    };

    // ===== COMPUTED VALUES =====

    // Apply filters to performances
    const filteredPerformances = performances.filter(p => {
        // Domain filter
        if (domainFilter !== 'all' && p.domain !== domainFilter) return false;

        // Difficulty filter
        if (difficultyFilter !== 'all' &&
            p.QuestionDifficulty?.toLowerCase() !== difficultyFilter.toLowerCase()) return false;

        // Result filter
        if (resultFilter === 'correct' && !p.Result) return false;
        if (resultFilter === 'incorrect' && p.Result) return false;

        return true;
    });

    // Get unique domains for filter
    const domains = Array.from(new Set(performances.filter(p => p.domain).map(p => p.domain)));

    // ===== RENDER JSX =====
    return (
        <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-white text-xl font-bold">Question History</CardTitle>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className=" italics text-white bg-gray-700 hover:bg-gray-700"
                        onClick={handleSelectAll}
                    >
                        SELECT ALL
                    </Button>
                </div>
            </CardHeader>

            <CardContent>
                {/* Preview Question Modal with Attempt History */}
                {previewQuestionId && previewQuestion && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/90 backdrop-blur-sm">
                        <div className="max-w-4xl w-3/4 mx-auto">
                            <div className="relative flex flex-col items-center">
                                {/* Close button */}
                                <button
                                    onClick={closePreview}
                                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                                    aria-label="Close preview"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                <div className="w-full">
                                    {/* Question details and historical attempts */}
                                    <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
                                        {/* Badges */}
                                        <div className="mb-4">
                                            <Badge className={`${getDifficultyColor(previewQuestion.Question.QuestionDifficulty).bg} ${getDifficultyColor(previewQuestion.Question.QuestionDifficulty).text} border ${getDifficultyColor(previewQuestion.Question.QuestionDifficulty).color}`}>
                                                {previewQuestion.Question.QuestionDifficulty}
                                            </Badge>
                                            <Badge className="ml-2 bg-gray-700 text-white">
                                                {previewQuestion.GradeClassification.ClassificationName}
                                            </Badge>
                                        </div>

                                        {/* Question Text */}
                                        <h3 className="text-xl font-semibold text-white mb-6">
                                            {previewQuestion.Question.Prompt}
                                        </h3>

                                        {/* Historical Attempts Section */}
                                        <div className="mt-4 border-t border-gray-700 pt-4">
                                            <h3 className="text-md text-white font-semibold mb-4">Attempt History</h3>

                                            {loadingHistory ? (
                                                <div className="py-2 text-center text-gray-500">Loading attempt history...</div>
                                            ) : historicalAttempts.length > 0 ? (
                                                <div className="space-y-3">
                                                    <div className="grid grid-cols-5 gap-2 text-xs font-medium text-gray-400 mb-2">
                                                        <div>DATE</div>
                                                        <div>EXAM</div>
                                                        <div className="text-center">ANSWER</div>
                                                        <div className="text-center">RESULT</div>
                                                        <div className="text-center">CONFIDENCE</div>
                                                    </div>
                                                    {historicalAttempts.map((attempt, index) => {
                                                        // Safely extract data, providing defaults for missing properties
                                                        const examDate = attempt.ExamDate || attempt.Timestamp || 'Unknown';
                                                        const examName = attempt.ExamName || "N/A";
                                                        const selectedOption = attempt.SelectedOptionID;
                                                        const result = attempt.Result;
                                                        const confidence = attempt.Confidence !== undefined ? attempt.Confidence : '-';

                                                        return (
                                                            <div key={index} className="grid grid-cols-5 gap-2 py-2 border-b border-gray-800 text-sm">
                                                                <div className="text-gray-400">{formatDate(examDate)}</div>
                                                                <div className="text-gray-300">{examName}</div>
                                                                <div className="text-center">
                                                                    <span className="px-2 py-1 bg-gray-800 rounded-full text-xs text-white">
                                                                        {selectedOption !== undefined
                                                                            ? getOptionLetter(selectedOption - 1)
                                                                            : '-'}
                                                                    </span>
                                                                </div>
                                                                <div className="text-center">
                                                                    {result ? (
                                                                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                                                                    ) : (
                                                                        <X className="w-5 h-5 text-red-500 mx-auto" />
                                                                    )}
                                                                </div>
                                                                <div className="text-center">
                                                                    <span className="text-gray-300">{confidence}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="py-4 text-center text-gray-500">No attempt history found</div>
                                            )}
                                        </div>

                                        {/* Performance Analytics Section */}
                                        {historicalAttempts.length > 0 && (
                                            <div className="mt-6 border-t border-gray-700 pt-4 text-white">
                                                <h3 className="text-md font-semibold mb-4">Performance Analytics</h3>

                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="bg-gray-800/50 p-3 rounded-lg">
                                                        <div className="text-xs text-gray-400 mb-1">TOTAL ATTEMPTS</div>
                                                        <div className="text-xl font-semibold">{performanceMetrics.totalAttempts}</div>
                                                    </div>

                                                    <div className="bg-gray-800/50 p-3 rounded-lg">
                                                        <div className="text-xs text-gray-400 mb-1">SUCCESS RATE</div>
                                                        <div className="text-xl font-semibold">
                                                            {performanceMetrics.successRate}%
                                                        </div>
                                                    </div>

                                                    <div className="bg-gray-800/50 p-3 rounded-lg">
                                                        <div className="text-xs text-gray-400 mb-1">AVG CONFIDENCE</div>
                                                        <div className="text-xl font-semibold">
                                                            {performanceMetrics.avgConfidence}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                {/* Filters */}
                <div className="mb-6 flex flex-wrap gap-4">
                    <div className="flex flex-col space-y-1.5">
                        <label className="text-sm font-medium text-gray-400">Subdomain</label>
                        <Select value={domainFilter} onValueChange={setDomainFilter}>
                            <SelectTrigger className="w-[180px] bg-gray-700 border-gray-600 text-white">
                                <SelectValue placeholder="All Subdomains" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-700 border-gray-600 text-white">
                                <SelectItem value="all">All Subdomains</SelectItem>
                                {domains.map((domain) => (
                                    <SelectItem key={domain} value={domain!}>
                                        {domain}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col space-y-1.5">
                        <label className="text-sm font-medium text-gray-400">Difficulty</label>
                        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                            <SelectTrigger className="w-[180px] bg-gray-700 border-gray-600 text-white">
                                <SelectValue placeholder="All difficulties" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-700 border-gray-600 text-white">
                                <SelectItem value="all">All difficulties</SelectItem>
                                <SelectItem value="easy">Easy</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col space-y-1.5">
                        <label className="text-sm font-medium text-gray-400">Result</label>
                        <Select value={resultFilter} onValueChange={setResultFilter}>
                            <SelectTrigger className="w-[180px] bg-gray-700 border-gray-600 text-white">
                                <SelectValue placeholder="All results" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-700 border-gray-600 text-white">
                                <SelectItem value="all">All results</SelectItem>
                                <SelectItem value="correct">Correct</SelectItem>
                                <SelectItem value="incorrect">Incorrect</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Column headers */}
                <div className="grid grid-cols-12 gap-2 mb-4 items-center">
                    <div className="col-span-5">
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Question</span>
                        <div className="h-px bg-gray-700 mt-1"></div>
                    </div>
                    <div className="col-span-2 text-center">
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Subdomain</span>
                        <div className="h-px bg-gray-700 mt-1"></div>
                    </div>
                    <div className="col-span-2 text-center">
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Difficulty</span>
                        <div className="h-px bg-gray-700 mt-1"></div>
                    </div>
                    <div className="col-span-2 text-center">
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Answer</span>
                        <div className="h-px bg-gray-700 mt-1"></div>
                    </div>
                    <div className="col-span-1 text-center">
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Conf.</span>
                        <div className="h-px bg-gray-700 mt-1"></div>
                    </div>
                </div>

                {/* Performance list */}
                {loading ? (
                    <div className="text-center py-10">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
                        <p className="mt-4 text-gray-400">Loading question data...</p>
                    </div>
                ) : filteredPerformances.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-gray-400">No questions found matching the current filters.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredPerformances.map((performance) => {
                            const difficultyStyles = getDifficultyColor(performance.QuestionDifficulty);

                            return (
                                <div key={performance.StudentQuestionPerformanceID} className="grid grid-cols-12 gap-2 items-center py-2 border-b border-gray-800">
                                    <div className="col-span-5">
                                        <div className="flex items-center">
                                            {/* Checkbox area */}
                                            <div
                                                className="w-5 h-5 mr-3 flex items-center justify-center border border-gray-600 rounded cursor-pointer hover:border-gray-400 transition-colors"
                                                onClick={() => handleQuestionToggle(performance.QuestionID)}
                                            >
                                                {performance.isChecked && <span className="w-3 h-3 bg-white rounded-sm"></span>}
                                            </div>

                                            {/* Question text area */}
                                            <span
                                                className="text-sm text-gray-300 cursor-pointer hover:text-white transition-colors"
                                                onClick={() => handleQuestionClick(performance.QuestionID)}
                                            >
                                                {performance.QuestionPrompt}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="col-span-2 flex justify-center">
                                        <span className="text-xs px-3 py-1 rounded-full bg-gray-700 text-gray-300">
                                            {performance.domain || 'N/A'}
                                        </span>
                                    </div>

                                    <div className="col-span-2 flex justify-center">
                                        <div className={`px-3 py-1 rounded-full border ${difficultyStyles.color} ${difficultyStyles.bg}`}>
                                            <span className={`${difficultyStyles.text} text-xs font-medium`}>
                                                {performance.QuestionDifficulty || 'N/A'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="col-span-2 flex justify-center">
                                        {performance.Result ? (
                                            <div className="bg-green-900/20 w-8 h-8 rounded-full flex items-center justify-center">
                                                <Check className="text-green-500 w-5 h-5" />
                                            </div>
                                        ) : (
                                            <div className="bg-red-900/20 w-8 h-8 rounded-full flex items-center justify-center">
                                                <X className="text-red-500 w-5 h-5" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="col-span-1 flex justify-center">
                                        {performance.Confidence !== undefined ? (
                                            <span className="text-sm font-medium text-gray-300 bg-gray-800/70 px-3 py-1 rounded-full">
                                                {performance.Confidence}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-gray-500">-</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Selected questions summary */}
                <div className="mt-6 pt-4 border-t border-gray-700 flex justify-between items-center">
                    <div>
                        <span className="text-gray-400">
                            {selectedQuestions.length} of {filteredPerformances.length} questions selected
                        </span>
                    </div>
                    <Button
                        variant="default"
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={handleCreateMockQuiz}
                        disabled={selectedQuestions.length === 0}
                    >
                        TAKE MOCK QUIZ <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default QuestionHistory;