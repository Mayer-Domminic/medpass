'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Sidebar from '@/components/navbar';
import StudyAnalytics from '@/components/analytics';
import QuestionPerformance from '@/components/results/QuestionHistory';
import { useAnalytics } from '@/app/dashboard/analytics/context';
import LineMetric from '@/components/analytics/lineMetric';
import GeneralMetric from '@/components/analytics/generalMetric';

// This component contains the actual page content and uses the useAnalytics hook
const AnalyticsContent: React.FC = () => {
    const {
        metrics,
        timeRange,
        setTimeRange,
        loading,
        error
    } = useAnalytics();

    const timeRanges = ['Last 7 Days', 'Last 30 Days', 'Last 90 Days'];

    // Handle loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900">
                <Sidebar />
                <div className="pl-[100px] p-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="animate-pulse space-y-6">
                            <div className="flex justify-between items-center">
                                <div className="h-8 bg-gray-800 rounded w-64"></div>
                                <div className="h-8 bg-gray-800 rounded w-32"></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="h-40 bg-gray-800 rounded-lg"></div>
                                ))}
                            </div>
                            <div className="h-80 bg-gray-800 rounded-lg"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Handle error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-900">
                <Sidebar />
                <div className="pl-[100px] p-6">
                    <div className="max-w-7xl mx-auto">
                        <Card className="bg-red-900/30 border-red-700">
                            <CardContent className="p-6">
                                <p className="text-white">Failed to load analytics data: {error}</p>
                                <button className="mt-4 bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded">
                                    Retry
                                </button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    // If no metrics yet, show placeholder
    if (!metrics) {
        return (
            <div className="min-h-screen bg-gray-900">
                <Sidebar />
                <div className="pl-[100px] p-6">
                    <div className="max-w-7xl mx-auto">
                        <Card className="bg-gray-800/50 border-gray-700">
                            <CardContent className="p-6">
                                <p className="text-white">No analytics data available yet.</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    // Create metric descriptions mapping
    const metricDescriptions: Record<string, string> = {
        // Trends Over Time
        "Average Exam Score": "The mean score across all exams taken in the selected time period. Calculated as (total points earned / total possible points) × 100%.",
        "Correct Answer Percentage": "The percentage of all questions answered correctly across all exams in the selected time period. Calculated as (number of correct answers / total questions answered) × 100%.",
        "Exam Pass Rate": "The percentage of exams marked as passed in the selected time period. Calculated as (number of exams passed / total exams taken) × 100%.",

        // Confidence Metrics
        "High Confidence Success": "The percentage of questions where you reported high confidence (4-5) and answered correctly. This measures how well you know what you know. Calculated as (correct answers with high confidence / total high confidence questions) × 100%.",
        "Medium Confidence Success": "The percentage of questions where you reported medium confidence (3) and answered correctly. Calculated as (correct answers with medium confidence / total medium confidence questions) × 100%.",
        "Low Confidence Accuracy": "The percentage of questions where you reported low confidence (1-2) and answered correctly. This measures how well you recognize knowledge gaps. Calculated as (correct answers with low confidence / total low confidence questions) × 100%.",

        // User Scores
        "Graduation Likelihood": "A predictive score estimating the likelihood of graduation based on your performance patterns. This is calculated using a machine learning model analyzing all available performance data.",
        "Success Probability": "The probability of passing future exams based on current performance metrics. This is derived from a predictive model analyzing past performance patterns.",
        "Confidence-Accuracy Gap": "The absolute difference between your average self-reported confidence (scaled to percentage) and your actual accuracy. A lower number indicates better calibration between confidence and performance. Calculated as |avgConfidence - avgAccuracy|."
    };

    // Create metric groups
    // 1. Trends Over Time (use LineMetric with real trend data)
    const trendMetrics = metrics.historical || [];

    // 2. Confidence Success Metrics (use LineMetric with partial real trend data)
    const confidenceMetrics = [
        ...(metrics.strengths || []),
        ...(metrics.weaknesses || []).filter(metric =>
            metric.title.toLowerCase().includes('confidence') &&
            !metric.title.toLowerCase().includes('gap')
        )
    ];

    // 3. User Score Metrics (use GeneralMetric without trend visualization)
    const userScoreMetrics = [
        ...(metrics.predictive || []),
        ...(metrics.weaknesses || []).filter(metric =>
            metric.title.toLowerCase().includes('gap')
        )
    ];

    // Helper to determine if a metric should use line visualization
    const hasLineData = (metric: { data: any[] | null }) => {
        return metric.data !== null && Array.isArray(metric.data) && metric.data.length > 0;
    };

    return (
        <div className="min-h-screen bg-gray-900">
            <Sidebar />
            <div className="pl-[100px] p-6">
                <h1 className="text-2xl font-bold mb-6 text-white">Analytics Dashboard</h1>
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="flex justify-between items-center">
                    </div>

                    {/* Trends Over Time Section */}
                    <div>
                        <h3 className="text-white text-xl font-bold mb-4">Trends Over Time</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {trendMetrics.map((metric, index) => (
                                <LineMetric
                                    key={`trend-metric-${index}`}
                                    title={metric.title}
                                    value={metric.value}
                                    trend={metric.trend}
                                    color={metric.color}
                                    data={metric.data || []}
                                    description={metricDescriptions[metric.title]} 
                                />
                            ))}
                        </div>
                    </div>

                    {/* Confidence Success Section */}
                    <div>
                        <h3 className="text-white text-xl font-bold mb-4">Confidence Success Metrics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {confidenceMetrics.map((metric, index) => (
                                hasLineData(metric) ? (
                                    <GeneralMetric
                                        key={`confidence-metric-${index}`}
                                        title={metric.title}
                                        value={metric.value}
                                        trend={metric.trend}
                                        color={metric.color}
                                        data={metric.data || []}
                                        description={metricDescriptions[metric.title]} 
                                    />
                                ) : (
                                    <GeneralMetric
                                        key={`confidence-metric-${index}`}
                                        title={metric.title}
                                        value={metric.value}
                                        trend={metric.trend}
                                        color={metric.color}
                                        data={[]} // Empty array for GeneralMetric
                                        description={metricDescriptions[metric.title]} 
                                    />
                                )
                            ))}
                        </div>
                    </div>

                    {/* User Scores Section */}
                    <div>
                        <h3 className="text-white text-xl font-bold mb-4">User Scores</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {userScoreMetrics.map((metric, index) => (
                                <GeneralMetric
                                    key={`user-score-metric-${index}`}
                                    title={metric.title}
                                    value={metric.value}
                                    trend={metric.trend}
                                    color={metric.color}
                                    data={[]} // Empty array for static metrics without trends
                                    description={metricDescriptions[metric.title]}
                                    inverse={metric.title === "Confidence-Accuracy Gap"} // Set inverse=true only for this metric
                                />
                            ))}
                        </div>
                    </div>

                    {/* Interactive Analytics Section */}
                    <Card className="bg-gray-800/50 border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-white">Scores Over Time</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <StudyAnalytics />
                        </CardContent>
                    </Card>

                    {/* Question Performance Section */}
                    <div className="mt-8">
                        <QuestionPerformance />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsContent;