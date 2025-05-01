import React, { useState, useEffect, useRef } from 'react';
import Subdomain from './subdomain';

// ============= INTERFACES =============

export type ExamResult = {
  ExamResultsID: number;
  StudentID: number;
  StudentName: string;
  ExamID: number;
  ExamName: string;
  Score: number;
  PassOrFail: boolean;
  Timestamp?: string | null;
  ClerkshipID?: number | null;
};

export type Performance = {
  StudentQuestionPerformanceID: number;
  ExamResultsID: number;
  QuestionID: number;
  Result: boolean;
  Confidence: number;
  QuestionPrompt: string;
  QuestionDifficulty: string;
  SelectedOptionID?: number;
};

export type Question = {
  id: string;
  text: string;
  difficulty: string;
  result: boolean;
  confidence: number;
  isChecked: boolean;
  isCorrect: boolean;
  imageUrl?: string | null;
  imageDescription?: string | null;
  options?: QuestionOption[];
  correctOption?: number;
  explanation?: string;
  selectedOptionID?: number;
};

export type QuestionOption = {
  id: number;
  text: string;
  isCorrect: boolean;
  explanation?: string;
};

export type Attempt = {
  attemptNumber: number;
  answer: number;
  correct: boolean;
  confidence: number;
  date: string;
  examName?: string;
  examId?: number;
};

export type DomainProps = {
  examResult: ExamResult;
  performances: Performance[];
  onQuestionSelect?: (questionId: string, isSelected: boolean) => void;
  selectedQuestions?: string[];
};

export type SubdomainType = {
  id: string;
  title: string;
  name?: string;
  questions: Question[];
  isLatestConf: boolean;
};

// ============= DOMAIN COMPONENT =============

const Domain: React.FC<DomainProps> = ({
  examResult,
  performances,
  onQuestionSelect,
  selectedQuestions = []
}) => {
  // ===== STATE HOOKS =====
  const [expanded, setExpanded] = useState<boolean>(false);
  const [attemptsData, setAttemptsData] = useState<Record<string, Attempt[]>>({});
  const isInitialMount = useRef(true);

  // ===== EVENT HANDLERS =====

  /**
   * Toggle the expanded state of the domain
   */
  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  /**
   * Handle question selection from subdomain
   */
  const handleQuestionToggle = (questionId: string, isChecked: boolean) => {
    if (onQuestionSelect) {
      onQuestionSelect(questionId, isChecked);
    }
  };

  // ===== EFFECT HOOKS =====

  /**
   * Process performance data when component mounts
   */
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
  }, []); // Empty dependency array to run only on mount

  // ===== DATA TRANSFORMATION =====

  // Check if data is available
  if (!examResult || !performances || performances.length === 0) {
    return null;
  }

  // Transform performances into Question[] expected by Subdomain
  // and mark questions as checked if they're in the selectedQuestions array
  const questions: Question[] = performances.map((performance: Performance) => ({
    id: performance.QuestionID.toString(),
    text: performance.QuestionPrompt,
    difficulty: performance.QuestionDifficulty.toLowerCase(),
    result: performance.Result,
    confidence: performance.Confidence || 1,
    isChecked: selectedQuestions.includes(performance.QuestionID.toString()),
    isCorrect: performance.Result === true,
  }));

  // ===== RENDER JSX =====
  return (
    <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg max-w-2xl mx-auto">
      {/* Domain header with exam information */}
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

      {/* Expanded content with questions */}
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
            onQuestionToggle={handleQuestionToggle}
            attempts={attemptsData}
          />
        </div>
      )}
    </div>
  );
};

export default Domain;