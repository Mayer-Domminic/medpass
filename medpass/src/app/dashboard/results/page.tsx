import { Suspense } from 'react';
import Sidebar from '@/components/navbar';
import ResultsContent from '@/components/results/ResultsContent';

const ResultsPageSkeleton = () => (
    <div className="min-h-screen bg-gray-900 text-slate-100 p-4">
        <Sidebar />
        <div className="flex justify-between items-center mb-6 px-2">
            <h1 className="text-2xl font-bold ml-20">Student Historical Performance</h1>
            <div className="h-8 w-40 bg-gray-800 rounded"></div>
        </div>

        <div className="flex-1 max-w-4xl mx-auto">
            <div className="animate-pulse flex flex-col space-y-6">
                <div className="h-20 bg-gray-800 rounded-lg"></div>
                <div className="space-y-4">
                    <div className="h-40 bg-gray-800 rounded-lg"></div>
                    <div className="h-40 bg-gray-800 rounded-lg"></div>
                    <div className="h-40 bg-gray-800 rounded-lg"></div>
                </div>
            </div>
        </div>
    </div>
);

export default function ResultsPage() {
    return (
        <div className="min-h-screen bg-gray-900 text-slate-100 p-4">
            <Suspense fallback={<ResultsPageSkeleton />}>
                <ResultsContent />
            </Suspense>
        </div>
    );
}