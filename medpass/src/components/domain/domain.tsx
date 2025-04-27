import React, { useState } from 'react';
import Subdomain from './subdomain';
import { DomainProps, Question, Performance, ExamResult } from '@/types/domain';

const Domain: React.FC<DomainProps> = ({ examResult, performances }) => {
  const [expanded, setExpanded] = useState<boolean>(false);

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  // Check if examResult and performances are defined before using them
  if (!examResult || !performances) {
    return <div>Loading...</div>;  // Show a loading message or handle it accordingly
  }

  // Transform performances into Question[] expected by Subdomain
  const questions: Question[] = performances.map((performance: Performance) => ({
    id: performance.QuestionID.toString(),
    text: performance.QuestionPrompt,            // Using text as specified
    difficulty: performance.QuestionDifficulty.toLowerCase(), // Convert to lowercase for consistency
    result: performance.Result,
    confidence: performance.Confidence || 1,     // Fallback to 1 if not provided
    isChecked: false,                            // Default value
    isCorrect: performance.Result === true,      // Example logic
  }));

  return (
    <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg max-w-2xl mx-auto">
      <div className="flex items-center justify-between cursor-pointer" onClick={toggleExpand}>
        <h2 className="text-lg font-semibold text-gray-300">{examResult.ExamName}</h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-400">
            {examResult.StudentName && (
              <span className="mr-4">{examResult.StudentName}</span>
            )}
            {examResult.Timestamp && (
              <span className="mr-4">
                {new Date(examResult.Timestamp).toLocaleDateString()}
              </span>
            )}
            <span>{examResult.Score}%</span>
            <span className={examResult.PassOrFail ? 'text-green-500' : 'text-red-500'}>
              {examResult.PassOrFail ? ' (Pass)' : ' (Fail)'}
            </span>
          </span>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-2">
          <Subdomain
            subdomain={{
              id: 'performance',
              title: `Performance Results (${questions.length} questions)`,
              questions: questions,
              isLatestConf: false,
            }}
            isExpanded={true}
            onToggle={() => { }} 
          />
        </div>
      )}
    </div>
  );
};

export default Domain;