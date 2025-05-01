import React, { useState, useEffect } from 'react';
import { Check, X, Clock } from 'lucide-react';
import { useSession } from 'next-auth/react';

// ============= INTERFACES =============

export type QuestionOption = {
    id: number;
    text: string;
    isCorrect: boolean;
    explanation?: string;
};

export type Question = {
    id: string;
    text: string;
    difficulty: string;
    result: boolean;
    confidence: number;
    isChecked: boolean;
    isCorrect: boolean;
    imageUrl?: string | null;
    imageDescription?: string | null;
    options?: QuestionOption[];
    correctOption?: number;
    explanation?: string;
    selectedOptionID?: number;
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

export type PreviewQuestionProps = {
    question: Question;
    classificationName?: string;
    attempts?: Attempt[];
};

export type ContentArea = {
    ContentAreaID: number;
    ContentName: string;
    Description: string;
    Discipline: string;
};

export type Option = {
    OptionID: number;
    CorrectAnswer: boolean;
    Explanation: string;
    OptionDescription: string;
};

// ============= COMPONENT =============

const PreviewQuestion: React.FC<PreviewQuestionProps> = ({
    question,
    classificationName,
    attempts = []
}) => {
    // ===== STATE HOOKS =====
    const [questionData, setQuestionData] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // ===== HOOKS =====
    const { data: session } = useSession();

    // ===== CONFIGURATION =====
    const apiBase = `${process.env.NEXT_PUBLIC_API_URL}/api/v1`;

    // ===== UTILITY FUNCTIONS =====


    const getQuestionDetails = async (questionId: string): Promise<any | null> => {
        try {
            const response = await fetch(`${apiBase}/question/${questionId}`, {
                headers: session?.accessToken ? {
                    Authorization: `Bearer ${session.accessToken}`
                } : {},
            });

            if (!response.ok) {
                console.error(`Failed to fetch question details for ID ${questionId}`);
                return null;
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching question details:', error);
            return null;
        }
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

    // ===== EFFECT HOOKS =====

    /**
     * Fetch question details on component mount
     */
    useEffect(() => {
        const fetchQuestionDetails = async () => {
            console.log(`[PreviewQuestion] Fetching details for question ID: ${question.id}`);
            setLoading(true);
            try {
                const details = await getQuestionDetails(question.id);
                console.log(`[PreviewQuestion] Received details:`, details);

                if (details) {
                    setQuestionData(details);
                } else {
                    setError("Could not load question details");
                }
            } catch (err) {
                console.error(`[PreviewQuestion] Error fetching question details:`, err);
                setError("Error loading question details");
            } finally {
                setLoading(false);
            }
        };

        fetchQuestionDetails();
    }, [question.id, session?.accessToken]);

    // ===== RENDER JSX =====
    return (
        <div className="bg-gray-900 rounded-xl p-6 text-white shadow-lg max-w-3xl mx-auto">
            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg">
                    <p className="text-red-400">{error}</p>
                </div>
            )}

            {/* Classification */}
            {classificationName && (
                <div className="mb-4">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {classificationName}
                    </span>
                </div>
            )}

            {/* Loading State */}
            {loading ? (
                <div className="py-10 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
                    <p className="mt-4 text-gray-400">Loading question details...</p>
                </div>
            ) : questionData ? (
                <>
                    {/* Classification and Difficulty Badges */}
                    <div className="mb-4 flex flex-wrap gap-2">
                        {questionData.Question.QuestionDifficulty && (
                            <div className={`px-3 py-1 rounded-full border ${getDifficultyColor(questionData.Question.QuestionDifficulty).color} ${getDifficultyColor(questionData.Question.QuestionDifficulty).bg}`}>
                                <span className={`${getDifficultyColor(questionData.Question.QuestionDifficulty).text} text-xs font-medium`}>
                                    {questionData.Question.QuestionDifficulty}
                                </span>
                            </div>
                        )}
                        {questionData.GradeClassification && !classificationName && (
                            <span className="text-xs px-3 py-1 rounded-full bg-gray-700 text-gray-300">
                                {questionData.GradeClassification.ClassificationName}
                            </span>
                        )}
                    </div>

                    {/* Question Text */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold">{questionData.Question.Prompt || question.text}</h2>
                    </div>

                    {/* Question Image if it exists */}
                    {questionData.Question.ImageUrl && (
                        <div className="mb-6">
                            <img
                                src={questionData.Question.ImageUrl}
                                alt={questionData.Question.ImageDescription || "Question image"}
                                className="max-w-full h-auto rounded-lg border border-gray-700"
                            />
                            {questionData.Question.ImageDescription && (
                                <p className="mt-2 text-sm text-gray-400">
                                    {questionData.Question.ImageDescription}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Options */}
                    <div className="space-y-3 mb-8">
                        {questionData.Options && questionData.Options.map((option: Option, index: number) => (
                            <div
                                key={option.OptionID}
                                className={`p-3 rounded-lg flex items-start ${option.CorrectAnswer ? 'bg-green-800/20 border border-green-600' : 'bg-gray-800/50 border border-gray-700'}`}
                            >
                                <div className="flex-shrink-0 mr-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${option.CorrectAnswer ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                                        {getOptionLetter(index)}
                                    </div>
                                </div>
                                <div className="flex-grow">
                                    <p className="text-sm text-gray-300">{option.OptionDescription}</p>

                                    {/* Explanation (only show if this is the correct answer or has explanation) */}
                                    {option.Explanation && (
                                        <div className="mt-2 text-sm text-gray-400 italic">
                                            <span className="font-medium text-gray-300"></span> {option.Explanation}
                                        </div>
                                    )}
                                </div>
                                {option.CorrectAnswer && (
                                    <div className="flex-shrink-0 ml-2">
                                        <Check className="w-5 h-5 text-green-500" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Content Areas */}
                    {questionData.ContentAreas && questionData.ContentAreas.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-gray-700">
                            <h4 className="text-sm font-medium text-gray-400 mb-2">CONTENT AREAS</h4>
                            <div className="flex flex-wrap gap-2">
                                {questionData.ContentAreas.map((area: ContentArea) => (
                                    <span key={area.ContentAreaID} className="px-3 py-1 rounded-full bg-gray-800 text-gray-300 text-xs">
                                        {area.ContentName} - {area.Discipline}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="py-10 text-center">
                    <p className="text-gray-400">Question data could not be loaded.</p>
                </div>
            )}
        </div>
    );
};

export default PreviewQuestion;