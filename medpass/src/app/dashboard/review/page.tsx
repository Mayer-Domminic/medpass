import { Suspense } from 'react';
import Sidebar from '@/components/navbar';
import ReviewContent from '@/components/review/ReviewContent';

const ReviewPageSkeleton = () => (
  <div className="min-h-screen bg-gray-900 text-slate-100 p-4">
    <div className="animate-pulse flex flex-col space-y-6">
      <div className="h-10 bg-slate-800 rounded w-1/4"></div>
      <div className="space-y-4">
        <div className="h-40 bg-slate-800 rounded"></div>
        <div className="h-40 bg-slate-800 rounded"></div>
        <div className="h-20 bg-slate-800 rounded"></div>
      </div>
    </div>
  </div>
);

export default function ReviewPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-slate-100 p-4">
      <Sidebar />

      <Suspense fallback={<ReviewPageSkeleton />}>
        <ReviewContent />
      </Suspense>
    </div>
  );
}