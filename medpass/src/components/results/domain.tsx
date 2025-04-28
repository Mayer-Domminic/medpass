import React, { useState, useEffect, useRef } from 'react';
import Subdomain from './subdomain';
import { DomainProps, Question, Performance, Attempt } from '@/types/domain';

const Domain: React.FC<DomainProps> = ({ examResult, performances }) => {
  // All hooks must be called at the top level
  const [expanded, setExpanded] = useState<boolean>(false);
  const [attemptsData, setAttemptsData] = useState<Record<string, Attempt[]>>({});
  const isInitialMount = useRef(true);

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  // Process data when component mounts or when performances change
  useEffect(() => {
    // Skip if no data or on subsequent renders with same data
    if (!performances || performances.length === 0) {
      return;
    }

    // Create attempts data from performances
    const newAttemptsData: Record<string, Attempt[]> = {};

    performances.forEach(performance => {
      const questionId = performance.QuestionID.toString();

      // Create an Attempt object from each Performance
      const attemptFromPerformance: Attempt = {
        attemptNumber: 1,
        answer: 1, // Default to first option
        correct: performance.Result,
        confidence: performance.Confidence || 1,
        date: examResult?.Timestamp || new Date().toLocaleDateString()
      };

      // Initialize the array for this question if it doesn't exist
      if (!newAttemptsData[questionId]) {
        newAttemptsData[questionId] = [];
      }

      // Add the attempt to the array
      newAttemptsData[questionId].push(attemptFromPerformance);
    });

    setAttemptsData(newAttemptsData);

    // Mark initial mount as complete
    isInitialMount.current = false;
  }, []); // Empty dependency array - runs only on mount

  // Check if data is available
  if (!examResult || !performances || performances.length === 0) {
    return null;
  }

  // Transform performances into Question[] expected by Subdomain
  const questions: Question[] = performances.map((performance: Performance) => ({
    id: performance.QuestionID.toString(),
    text: performance.QuestionPrompt,
    difficulty: performance.QuestionDifficulty.toLowerCase(),
    result: performance.Result,
    confidence: performance.Confidence || 1,
    isChecked: false,
    isCorrect: performance.Result === true,
  }));

  return (
    <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg max-w-2xl mx-auto">
      <div className="flex items-center justify-between cursor-pointer" onClick={toggleExpand}>
        <h2 className="text-lg font-semibold text-gray-300">{examResult.ExamName}</h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-400">
            {examResult.Timestamp && (
              <span className="mr-4">
                {new Date(examResult.Timestamp).toLocaleDateString()}
              </span>
            )}
            <span>Score: {examResult.Score}</span>
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
              title: examResult.ExamName || '',
              name: examResult.ExamName || '',
              questions: questions,
              isLatestConf: false,
            }}
            isExpanded={true}
            onToggle={() => { }}
            attempts={attemptsData}
          />
        </div>
      )}
    </div>
  );
};

export default Domain;