'use client';
import QuestionPerformance from "@/components/results/QuestionHistory";

export default function DevPage() {
  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <h1 className="text-xl font-semibold text-white mb-6">Development Page</h1>
      <QuestionPerformance />
    </div>
  );
}