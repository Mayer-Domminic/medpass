import React, { useState, useEffect } from 'react';
import { Check, X, Clock, BarChart2 } from 'lucide-react';
import questionService from '@/lib/QuestionService';
import { Attempt } from '@/types/domain';
import { useSession } from 'next-auth/react'; 

interface QuestionOption {
    id: string;
    text: string;
    isCorrect: boolean;
}

interface PreviewQuestionProps {
    question: {
        id: string;
        text: string;
        difficulty?: string;
    };
    classificationName: string;
    attempts?: Attempt[];
}

const PreviewQuestion: React.FC<PreviewQuestionProps> = ({
    question,
    classificationName,
    attempts = []
}) => {
    const { data: session } = useSession(); // Get authentication session
    const [options, setOptions] = useState<QuestionOption[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [historicalAttempts, setHistoricalAttempts] = useState<any[]>([]);
    const [combinedAttempts, setCombinedAttempts] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState<boolean>(true);

    // Fetch question details (options) on component mount
    useEffect(() => {
        const fetchQuestionDetails = async () => {
            setLoading(true);
            const details = await questionService.getQuestionDetails(question.id);
            if (details && details.options) {
                setOptions(details.options);
            }
            setLoading(false);
        };

        fetchQuestionDetails();
    }, [question.id]);

    // Fetch historical performance data for this question
    useEffect(() => {
        const fetchHistoricalPerformance = async () => {
            // Return early if no access token is available
            if (!session?.accessToken) {
                setLoadingHistory(false);
                return;
            }

            setLoadingHistory(true);
            // Pass the access token to the service instead of a hardcoded ID
            const historyData = await questionService.getHistoricalPerformance(
                session.accessToken,
                question.id
            );
            setHistoricalAttempts(historyData);
            setLoadingHistory(false);
        };

        fetchHistoricalPerformance();
    }, [question.id, session]); // Add session as a dependency

    // Combine current attempts with historical attempts
    useEffect(() => {
        // Process historical attempts into the same format as current attempts
        const processedHistorical = historicalAttempts.map((histAttempt, index) => ({
            attemptNumber: attempts.length + index + 1,
            answer: histAttempt.SelectedOptionID || 2,
            correct: histAttempt.Result || false,
            confidence: histAttempt.Confidence || 0,
            date: histAttempt.ExamDate ? new Date(histAttempt.ExamDate).toLocaleDateString() : 'Unknown date',
            examName: histAttempt.ExamName || 'Unknown exam'
        }));

        // Combine current and historical attempts
        const allAttempts = [...attempts, ...processedHistorical];

        // Sort by date (most recent first)
        const sortedAttempts = allAttempts.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateB - dateA; // Most recent first
        });

        setCombinedAttempts(sortedAttempts);
    }, [attempts, historicalAttempts]);

    // Helper to map option index to letter
    const getOptionLetter = (index: number) => {
        return String.fromCharCode(65 + index); // 0 -> A, 1 -> B, etc.
    };

    return (
        <div className="bg-gray-900 rounded-xl p-6 text-white shadow-lg max-w-3xl mx-auto">
            {/* Classification */}
            <div className="mb-4">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {classificationName}
                </span>
            </div>

            {/* Question text */}
            <div className="mb-6">
                <h2 className="text-lg font-semibold">{question.text}</h2>
            </div>

            {/* Options */}
            {loading ? (
                <div className="py-4 text-center text-gray-500">Loading question options...</div>
            ) : (
                <div className="space-y-3 mb-8">
                    {options.map((option, index) => (
                        <div
                            key={option.id}
                            className={`p-3 rounded-lg flex items-start ${option.isCorrect ? 'bg-green-800/20 border border-green-600' : 'bg-gray-800/50 border border-gray-700'
                                }`}
                        >
                            <div className="flex-shrink-0 mr-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${option.isCorrect ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'
                                    }`}>
                                    {getOptionLetter(index)}
                                </div>
                            </div>
                            <div className="flex-grow">
                                <p className="text-sm text-gray-300">{option.text}</p>
                            </div>
                            {option.isCorrect && (
                                <div className="flex-shrink-0 ml-2">
                                    <Check className="w-5 h-5 text-green-500" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Historical Attempts Section */}
            <div className="mt-8 border-t border-gray-700 pt-4">
                <h3 className="text-md font-semibold mb-4 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Attempt History
                </h3>

                {!session?.accessToken ? (
                    <div className="py-4 text-center text-gray-500">Please sign in to view your attempt history</div>
                ) : loadingHistory ? (
                    <div className="py-2 text-center text-gray-500">Loading attempt history...</div>
                ) : combinedAttempts.length > 0 ? (
                    <div className="space-y-3">
                        <div className="grid grid-cols-5 gap-2 text-xs font-medium text-gray-400 mb-2">
                            <div>DATE</div>
                            <div>EXAM</div>
                            <div className="text-center">ANSWER</div>
                            <div className="text-center">RESULT</div>
                            <div className="text-center">CONFIDENCE</div>
                        </div>
                        {combinedAttempts.map((attempt, index) => (
                            <div key={index} className="grid grid-cols-5 gap-2 py-2 border-b border-gray-800 text-sm">
                                <div className="text-gray-400">{attempt.date}</div>
                                <div className="text-gray-300">{attempt.examName || "N/A"}</div>
                                <div className="text-center">
                                    <span className="px-2 py-1 bg-gray-800 rounded-full text-xs">
                                        {getOptionLetter(attempt.answer - 1)}
                                    </span>
                                </div>
                                <div className="text-center">
                                    {attempt.correct ? (
                                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                                    ) : (
                                        <X className="w-5 h-5 text-red-500 mx-auto" />
                                    )}
                                </div>
                                <div className="text-center">
                                    <span className="text-gray-300">{attempt.confidence}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-4 text-center text-gray-500">No attempt history found</div>
                )}
            </div>

            {/* Performance Analytics Section */}
            {combinedAttempts.length > 0 && (
                <div className="mt-8 border-t border-gray-700 pt-4">
                    <h3 className="text-md font-semibold mb-4 flex items-center">
                        <BarChart2 className="w-4 h-4 mr-2" />
                        Performance Analytics
                    </h3>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gray-800/50 p-3 rounded-lg">
                            <div className="text-xs text-gray-400 mb-1">TOTAL ATTEMPTS</div>
                            <div className="text-xl font-semibold">{combinedAttempts.length}</div>
                        </div>

                        <div className="bg-gray-800/50 p-3 rounded-lg">
                            <div className="text-xs text-gray-400 mb-1">SUCCESS RATE</div>
                            <div className="text-xl font-semibold">
                                {Math.round((combinedAttempts.filter(a => a.correct).length / combinedAttempts.length) * 100)}%
                            </div>
                        </div>

                        <div className="bg-gray-800/50 p-3 rounded-lg">
                            <div className="text-xs text-gray-400 mb-1">AVG CONFIDENCE</div>
                            <div className="text-xl font-semibold">
                                {(combinedAttempts.reduce((acc, curr) => acc + curr.confidence, 0) / combinedAttempts.length).toFixed(1)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PreviewQuestion;