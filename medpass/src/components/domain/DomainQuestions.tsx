import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';

interface GeneratedQuestion {
    id: string;
    text: string;
    difficulty: 'easy' | 'medium' | 'hard';
    category: string;
    correctPct: number;
    timesPracticed: number;
}

interface DomainQuestionsProps {
    domain: string;
    subdomain: string;
}

const DomainQuestions: React.FC<DomainQuestionsProps> = ({ domain, subdomain }) => {
    const { data: session } = useSession();
    const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingQuestions, setLoadingQuestions] = useState(true);
    const [error, setError] = useState('');
    const [additionalContext, setAdditionalContext] = useState('');

    // get saved questions
    useEffect(() => {
        if (session?.accessToken) {
            fetchSavedQuestions();
        }
    }, [session?.accessToken, domain, subdomain]);

    const fetchSavedQuestions = async () => {
        setLoadingQuestions(true);
        try {
            if (!session?.accessToken) {
                setError('Authentication required');
                setLoadingQuestions(false);
                return;
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/practice-questions/?domain=${encodeURIComponent(domain)}&subdomain=${encodeURIComponent(subdomain)}`,
                {
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (Array.isArray(data.questions)) {
                // sort questions
                const sortedQuestions = data.questions.sort((a: GeneratedQuestion, b: GeneratedQuestion) => {
                    if (a.timesPracticed > 0 && b.timesPracticed > 0) {
                        return b.timesPracticed - a.timesPracticed;
                    }
                    if (a.timesPracticed > 0) return -1;
                    if (b.timesPracticed > 0) return 1;

                    const difficultyOrder: { [key in 'hard' | 'medium' | 'easy']: number } = {
                        'hard': 1,
                        'medium': 2,
                        'easy': 3
                    };

                    const aDifficulty = a.difficulty as keyof typeof difficultyOrder;
                    const bDifficulty = b.difficulty as keyof typeof difficultyOrder;

                    return difficultyOrder[aDifficulty] - difficultyOrder[bDifficulty];
                });

                setQuestions(sortedQuestions);
            }
        } catch (err) {
            console.error('Failed to fetch saved questions:', err);
            setError('Failed to fetch saved questions');
        } finally {
            setLoadingQuestions(false);
        }
    };

    const generateQuestions = async () => {
        if (!session?.accessToken) {
            setError('Authentication required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/practice-questions/generate?domain=${encodeURIComponent(domain)}&subdomain=${encodeURIComponent(subdomain)}&count=5&additional_context=${encodeURIComponent(additionalContext)}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${session.accessToken}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (Array.isArray(data.questions)) {
                await fetchSavedQuestions();
            } else {
                setError('Invalid response format');
            }
        } catch (err) {
            console.error('Failed to generate questions:', err);
            setError('Failed to generate questions');
        } finally {
            setLoading(false);
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'easy': return 'bg-green-500/10 text-green-400 border-green-500';
            case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500';
            case 'hard': return 'bg-red-500/10 text-red-400 border-red-500';
            default: return 'bg-blue-500/10 text-blue-400 border-blue-500';
        }
    };

    return (
        <div className="mt-6">
            {/* Context input */}
            <div className="mb-4">
                <label htmlFor="additionalContext" className="block text-sm font-medium text-gray-400 mb-1">
                    Additional Context (optional)
                </label>
                <textarea
                    id="additionalContext"
                    value={additionalContext}
                    onChange={e => setAdditionalContext(e.target.value)}
                    className="w-full bg-gray-800 text-gray-300 border border-gray-700 rounded-md p-2"
                    placeholder="Any specific topics or areas you'd like to focus on"
                    rows={2}
                />
            </div>

            {/* Blue button row */}
            <div className="flex justify-end mb-4">
                <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={generateQuestions}
                    disabled={loading}
                >
                    {loading ? 'Generating...' : questions.length > 0 ? 'Generate More' : 'Generate Questions'}
                </Button>
            </div>

            {/* Error display */}
            {error && (
                <div className="p-4 bg-red-900/20 border border-red-700 rounded-md text-red-400 mb-4">
                    {error}
                </div>
            )}

            {/* Loading state */}
            {loadingQuestions && (
                <div className="p-8 text-center text-gray-400">
                    <div className="animate-spin h-6 w-6 border-t-2 border-b-2 border-blue-500 rounded-full mx-auto mb-2"></div>
                    <p>Loading questions...</p>
                </div>
            )}

            {/* Question list with fixed max height and scrollbar */}
            {!loadingQuestions && questions.length > 0 ? (
                <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                    <div className="flex justify-between items-center text-sm text-gray-400 mb-2 px-4">
                        <span className="font-medium">Total Questions: {questions.length}</span>
                        <span className="font-medium">
                            Practice Stats: {questions.reduce((sum, q) => sum + q.timesPracticed, 0)} attempts •
                            {questions.filter(q => q.timesPracticed > 0).length} tried
                        </span>
                    </div>

                    <ul>
                        {questions.map(q => {
                            const difficultyColor = getDifficultyColor(q.difficulty);
                            const hasPracticed = q.timesPracticed > 0;

                            return (
                                <li
                                    key={q.id}
                                    className={`bg-gray-800 border border-gray-700 rounded-md p-4 flex items-start 
                              justify-between hover:bg-gray-700/50 transition-colors border-l-4 
                              ${hasPracticed ? 'border-l-blue-500' : 'border-l-gray-600'}`}
                                >
                                    {/* Question text with wrapping */}
                                    <div className="flex-1 pr-4 min-w-0">
                                        <div className="flex items-center mb-1.5">
                                            <span className={`text-xs px-2 py-0.5 rounded-full border ${difficultyColor} mr-2`}>
                                                {q.difficulty}
                                            </span>
                                            {hasPracticed && (
                                                <span className={`text-xs px-2 py-0.5 rounded-full 
                                        ${q.correctPct >= 70 ? 'bg-green-900/20 text-green-400' :
                                                        q.correctPct >= 40 ? 'bg-yellow-900/20 text-yellow-400' :
                                                            'bg-red-900/20 text-red-400'}`}>
                                                    {Math.round(q.correctPct)}% correct
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-gray-200 font-medium break-words">{q.text}</span>
                                    </div>

                                    {/* Insights container */}
                                    <div className="flex-shrink-0 flex flex-col items-end space-y-1 text-sm text-gray-400 ml-3">
                                        {hasPracticed ? (
                                            <>
                                                <div className="flex flex-col items-end">
                                                    <span className="font-semibold text-gray-200">Practiced:</span>
                                                    <span className="text-lg">{q.timesPracticed}×</span>
                                                </div>
                                                <div className="h-1.5 w-16 bg-gray-700 rounded overflow-hidden mt-1">
                                                    <div
                                                        className={`h-full ${q.correctPct >= 70 ? 'bg-green-500' :
                                                                q.correctPct >= 40 ? 'bg-yellow-500' :
                                                                    'bg-red-500'
                                                            }`}
                                                        style={{ width: `${q.correctPct}%` }}
                                                    ></div>
                                                </div>
                                            </>
                                        ) : (
                                            <span className="text-gray-500 italic">Not practiced</span>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ) : (
                !loadingQuestions && (
                    <div className="p-8 text-center text-gray-400 border border-dashed border-gray-700 rounded-md">
                        Click "Generate Questions" to load practice questions for this subdomain
                    </div>
                )
            )}
        </div>
    );
};

export default DomainQuestions;