'use client';

import { useState, useEffect } from 'react';
import Domain from '@/components/domain/domain';
import { Performance, ExamResult } from '@/types/domain';

// Define the API response type
interface ApiResponseItem {
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

export default function DomainPage() {
    const [performanceData, setPerformanceData] = useState<ApiResponseItem[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                'http://localhost:8000/api/v1/question/historical-performance/?student_id=100&skip=0&limit=100',
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
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

    // Filter exam results to only include those with performance data
    const examResultsWithPerformance = performanceData?.filter(item =>
        item.Performances && item.Performances.length > 0
    ) || [];

    // Count of all exam results
    const totalExamResults = performanceData?.length || 0;

    // Count of exam results with performance data
    const examResultsWithPerformanceCount = examResultsWithPerformance.length;

    return (
        <div className="p-6 max-w-4xl mx-auto bg-gray-900 text-white min-h-screen">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-4">Student Historical Performance</h1>
                <button
                    onClick={fetchData}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
                >
                    Fetch Performance Data
                </button>
            </div>

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
                    <div className="bg-gray-800/50 border border-gray-700 px-4 py-3 rounded mb-4">
                        <h2 className="font-bold mb-2 text-gray-300">Performance Data Available:</h2>
                        <p className="text-gray-400">
                            {examResultsWithPerformanceCount} of {totalExamResults} exam results have detailed question data
                        </p>
                    </div>

                    {/* Only map through exam results that have performance data */}
                    <div className="space-y-4">
                        {examResultsWithPerformance.map((item) => {
                            // Create a properly typed ExamResult object with defaults for required fields
                            const examResult: ExamResult = {
                                ExamResultsID: item.ExamResults.ExamResultsID,
                                StudentID: item.ExamResults.StudentID || 0,
                                StudentName: item.ExamResults.StudentName || 'Unknown Student',
                                ExamID: item.ExamResults.ExamID || 0,
                                ExamName: item.ExamResults.ExamName || 'Unknown Exam',
                                Score: item.ExamResults.Score || 0,
                                PassOrFail: item.ExamResults.PassOrFail || false,
                                Timestamp: item.ExamResults.Timestamp || '',
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
    );
}