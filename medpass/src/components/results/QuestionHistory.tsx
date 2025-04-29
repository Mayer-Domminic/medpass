'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight, Check, X, Filter, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSession } from 'next-auth/react';
import {
    Performance,
    ApiResponseItem,
    QuestionDetail,
    Option,
    ContentArea,
    GradeClassification,
    QuestionData
} from '@/types/results';
import {
    formatDate,
    getQuestionDetails,
    getHistoricalPerformance,
    getOptionLetter,
    combineAttempts,
    calculatePerformanceMetrics
} from '@/lib/resultsUtils';
import PreviewQuestion from './previewQuestion';

// Define local types
interface EnhancedPerformance extends Performance {
    isChecked?: boolean;
    domain?: string;
    contentAreas?: ContentArea[];
    ExamName?: string;
    Timestamp?: string;
}

const QuestionPerformance: React.FC = () => {
    const [performances, setPerformances] = useState<EnhancedPerformance[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [previewQuestionId, setPreviewQuestionId] = useState<number | null>(null);
    const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
    const [domainFilter, setDomainFilter] = useState<string>('all');
    const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
    const [resultFilter, setResultFilter] = useState<string>('all');
    const [previewQuestion, setPreviewQuestion] = useState<QuestionData | null>(null);
    const [error, setError] = useState<string | null>(null);
    // New state for historical attempts
    const [historicalAttempts, setHistoricalAttempts] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
    const [performanceMetrics, setPerformanceMetrics] = useState({
        totalAttempts: 0,
        successRate: 0,
        avgConfidence: 0
    });
    const router = useRouter();
    const { data: session } = useSession();

    // Fetch historical performance data
    useEffect(() => {
        if (!session?.accessToken) {
            setError("Authentication required. Please sign in to view performance data.");
            setLoading(false);
            return;
        }

        fetchHistoricalPerformance();
    }, [session]);

    const fetchHistoricalPerformance = async () => {
        setLoading(true);
        setError(null);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const response = await fetch(
                `${apiUrl}/api/v1/question/historical-performance/?skip=0&limit=100`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session?.accessToken}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch performance data. Status: ${response.status}`);
            }

            const data: ApiResponseItem[] = await response.json();

            // Extract all performances from all exam results
            const allPerformances: EnhancedPerformance[] = [];
            // Use a Set to track question IDs we've already processed to avoid duplicates
            const processedQuestionIds = new Set<number>();

            for (const item of data) {
                if (item.Performances && item.Performances.length > 0) {
                    // Add each performance with exam context, but only if we haven't seen this question before
                    for (const perf of item.Performances) {
                        // Skip if we've already processed this question
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
                        console.error(`Error fetching details for question ${perf.QuestionID}:`, error);
                        return perf;
                    }
                })
            );

            setPerformances(enhancedPerformances);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching data';
            setError(errorMessage);
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Handle question selection
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
        console.log(`[handleQuestionClick] Starting for questionId: ${questionId}`);
        setPreviewQuestionId(questionId);
        setLoadingHistory(true);
        setHistoricalAttempts([]); // Reset previous attempts

        try {
            // Fetch question details for the preview modal
            console.log(`[handleQuestionClick] Fetching question details for questionId: ${questionId}`);
            const details = await getQuestionDetails(questionId.toString());

            if (details) {
                console.log('[handleQuestionClick] Question details received:', details);
                setPreviewQuestion(details);
            } else {
                console.error(`[handleQuestionClick] Could not load details for question ${questionId}`);
                setError(`Could not load details for question ${questionId}`);
            }

            // Fetch historical attempts for this question ID
            if (session?.accessToken) {
                console.log(`[handleQuestionClick] Fetching historical performance with accessToken: ${session.accessToken.substring(0, 10)}...`);

                const historyData = await getHistoricalPerformance(
                    session.accessToken,
                    questionId.toString()
                );

                console.log('[handleQuestionClick] Raw history data received:', historyData);
                console.log(`[handleQuestionClick] Number of history records: ${historyData.length}`);

                // Check each record to understand what data is missing
                historyData.forEach((record, index) => {
                    console.log(`[handleQuestionClick] Record ${index} details:`, {
                        hasSelectedOptionID: record.SelectedOptionID !== undefined,
                        selectedOptionID: record.SelectedOptionID,
                        result: record.Result,
                        confidence: record.Confidence,
                        recordKeys: Object.keys(record)
                    });
                });

                // IMPORTANT: Changed the filter logic to not filter out records!
                // The API is returning the correct StudentQuestionPerformance objects but they might not have
                // a SelectedOptionID property as expected
                setHistoricalAttempts(historyData);

                // Calculate performance metrics for this question
                const attempts = historyData.map(histAttempt => {
                    const mappedAttempt = {
                        answer: histAttempt.SelectedOptionID,
                        correct: histAttempt.Result === true,
                        confidence: histAttempt.Confidence || 0,
                        date: formatDate(histAttempt.ExamDate || histAttempt.Timestamp),
                        examName: histAttempt.ExamName || 'Unknown exam',
                        examId: histAttempt.ExamResultsID
                    };
                    console.log('[handleQuestionClick] Mapped attempt:', mappedAttempt);
                    return mappedAttempt;
                });

                const metrics = calculatePerformanceMetrics(attempts);
                console.log('[handleQuestionClick] Calculated metrics:', metrics);
                setPerformanceMetrics(metrics);
            } else {
                console.error('[handleQuestionClick] No access token available');
            }
        } catch (error) {
            console.error('[handleQuestionClick] Error:', error);
            setError('Failed to load question details');
        } finally {
            setLoadingHistory(false);
            console.log('[handleQuestionClick] Completed');
        }
    };

    // Close preview modal
    const closePreview = () => {
        setPreviewQuestionId(null);
        setPreviewQuestion(null);
        setHistoricalAttempts([]);
    };

    // Handle select all questions
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

    // Create mock quiz
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

    // Get difficulty color
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
                {/* Modified Preview Question Modal with Attempt History */}
                {previewQuestionId && previewQuestion && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/90 backdrop-blur-sm">
                        <div className="max-w-4xl w-3/4 mx-auto">
                            <div className="relative flex flex-col items-center">
                                {/* Add close button */}
                                <button
                                    onClick={closePreview}
                                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                                    aria-label="Close preview"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                <div className="w-full">
                                    {/* Switch to showing question details and historical attempts */}
                                    <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
                                        <div className="mb-4">
                                            <Badge className={`${getDifficultyColor(previewQuestion.Question.QuestionDifficulty).bg} ${getDifficultyColor(previewQuestion.Question.QuestionDifficulty).text} border ${getDifficultyColor(previewQuestion.Question.QuestionDifficulty).color}`}>
                                                {previewQuestion.Question.QuestionDifficulty}
                                            </Badge>
                                            <Badge className="ml-2 bg-gray-700 text-white">
                                                {previewQuestion.GradeClassification.ClassificationName}
                                            </Badge>
                                        </div>

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

export default QuestionPerformance;