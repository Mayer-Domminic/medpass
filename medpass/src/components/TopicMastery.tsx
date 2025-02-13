import React from 'react';
import { BookOpen, Trophy, AlertCircle, TrendingUp } from 'lucide-react';

interface TopicItemProps {
  name: string;
  mastery: number;
  questions: number;
  correct: number;
  recommendation: string;
}

const TopicItem: React.FC<TopicItemProps> = ({ name, mastery, questions, correct, recommendation }) => (
  <div className="bg-gray-800/50 rounded-lg p-4">
    <div className="flex items-center justify-between mb-3">
      <span className="text-white font-medium">{name}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">{correct}/{questions} correct</span>
        <div className={`px-2 py-0.5 rounded text-sm ${
          mastery >= 80 ? 'bg-green-500/20 text-green-400' :
          mastery >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-red-500/20 text-red-400'
        }`}>
          {mastery}%
        </div>
      </div>
    </div>
    <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
      <div 
        className={`h-2 rounded-full transition-all ${
          mastery >= 80 ? 'bg-green-500' :
          mastery >= 60 ? 'bg-yellow-500' :
          'bg-red-500'
        }`}
        style={{ width: `${mastery}%` }}
      />
    </div>
    <p className="text-sm text-gray-300">{recommendation}</p>
  </div>
);

const TopicMasteryOverview: React.FC = () => {
  const topics = [
    {
      name: "Cardiac Anatomy",
      mastery: 85,
      questions: 50,
      correct: 43,
      recommendation: "Ready for advanced concepts. Consider reviewing valve disorders."
    },
    {
      name: "Heart Failure",
      mastery: 45,
      questions: 30,
      correct: 14,
      recommendation: "Review systolic vs. diastolic dysfunction fundamentals."
    }
  ];

  const strengths = "Strong understanding of anatomy and physiology";
  const improvements = "ECG interpretation and pathophysiology need attention";

  return (
    <div className="h-full pt-2"> {/* Reduced top padding */}
      <h3 className="text-xl font-semibold text-white mb-3">Topic Mastery Overview</h3>
      <div className="grid grid-cols-2 gap-6 h-[calc(100%-2rem)]">
        <div className="space-y-3"> {/* Removed overflow-y-auto */}
          {topics.map((topic, index) => (
            <TopicItem key={index} {...topic} />
          ))}
        </div>

        <div className="space-y-3"> {/* Removed overflow-y-auto */}
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <h4 className="text-white font-medium">Strengths</h4>
            </div>
            <p className="text-gray-300 text-sm">{strengths}</p>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <h4 className="text-white font-medium">Areas for Improvement</h4>
            </div>
            <p className="text-gray-300 text-sm">{improvements}</p>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <h4 className="text-white font-medium">High-Yield Focus</h4>
            </div>
            <div className="space-y-1">
              {topics.map((topic, index) => (
                topic.mastery < 70 && (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="w-2 h-2 rounded-full bg-red-400"></span>
                    {topic.name}
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopicMasteryOverview;