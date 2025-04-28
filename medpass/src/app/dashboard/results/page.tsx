'use client';

import { useState, useEffect } from 'react';
import Domain from '@/components/results/domain';
import Sidebar from '@/components/navbar';
import UserGreeting from '@/components/UserGreeting';
import { ApiResponseItem, ExamResult } from '@/types/results';
import { useSession } from 'next-auth/react';

export default function DomainPage() {
    const { data: session } = useSession();
    const [performanceData, setPerformanceData] = useState<ApiResponseItem[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!session?.accessToken) return;
        fetchData();
    }, [session]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/question/historical-performance/?skip=0&limit=100`,
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

    return (
        <div className="min-h-screen bg-gray-900 text-slate-100 p-4">
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
                {!session?.accessToken && (
                    <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-300 px-4 py-3 rounded mb-4">
                        <p>Please sign in to view your performance data.</p>
                    </div>
                )}

                {loading && (
                    <div className="text-center py-4">
                        <p>Loading data...</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded mb-4">
                        <p>Error: {error}</p>
                    </div>
                )}

                {performanceData && (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            {performanceData.map((item) => {
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
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}