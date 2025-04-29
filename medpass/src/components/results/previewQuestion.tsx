import React, { useState, useEffect } from 'react';
import { Check, X, Clock } from 'lucide-react';
import { QuestionOption, PreviewQuestionProps } from '@/types/results';
import { getQuestionDetails, getOptionLetter } from '@/lib/resultsUtils';
import { useSession } from 'next-auth/react';

const PreviewQuestion: React.FC<PreviewQuestionProps> = ({
    question,
    classificationName,
    attempts = []
}) => {
    const { data: session } = useSession();
    const [questionData, setQuestionData] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch question details on component mount
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
    }, [question.id]);

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
        <div className="bg-gray-900 rounded-xl p-6 text-white shadow-lg max-w-3xl mx-auto">
            {/* Show error if there is one */}
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

            {loading ? (
                <div className="py-10 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
                    <p className="mt-4 text-gray-400">Loading question details...</p>
                </div>
            ) : questionData ? (
                <>
                    {/* Classification and difficulty badges */}
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

                    {/* Question text */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold">{questionData.Question.Prompt || question.text}</h2>
                    </div>

                    {/* Question image if it exists */}
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
                        {questionData.Options && questionData.Options.map((option: { OptionID: React.Key | null | undefined; CorrectAnswer: any; OptionDescription: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; Explanation: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; }, index: number) => (
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

                    {/* Content areas */}
                    {questionData.ContentAreas && questionData.ContentAreas.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-gray-700">
                            <h4 className="text-sm font-medium text-gray-400 mb-2">CONTENT AREAS</h4>
                            <div className="flex flex-wrap gap-2">
                                {questionData.ContentAreas.map((area: { ContentAreaID: React.Key | null | undefined; ContentName: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; Discipline: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; }) => (
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