import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Check, X } from 'lucide-react';
import PreviewQuestion from './previewQuestion';

// ============= INTERFACES =============

export type QuestionOption = {
  id: number;
  text: string;
  isCorrect: boolean;
  explanation?: string;
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

export type Attempt = {
  attemptNumber: number;
  answer: number;
  correct: boolean;
  confidence: number;
  date: string;
  examName?: string;
  examId?: number;
};

export type SubdomainType = {
  id: string;
  title: string;
  name?: string;
  questions: Question[];
  isLatestConf: boolean;
};

export type SubdomainProps = {
  subdomain: SubdomainType;
  isExpanded: boolean;
  onToggle: () => void;
  onQuestionToggle?: (questionId: string, isChecked: boolean) => void;
  attempts?: Record<string, Attempt[]>;
};

// ============= COMPONENT =============

const Subdomain: React.FC<SubdomainProps> = ({
  subdomain,
  isExpanded,
  onToggle,
  onQuestionToggle,
  attempts = {}
}) => {
  // ===== STATE HOOKS =====
  const [previewQuestionId, setPreviewQuestionId] = useState<string | null>(null);

  // ===== UTILITY FUNCTIONS =====

  const getMostRecentAttemptForQuestion = (questionId: string): Attempt | null => {
    if (!attempts || !attempts[questionId] || attempts[questionId].length === 0) {
      return null;
    }

    // Sort attempts by date (most recent first)
    const sortedAttempts = [...attempts[questionId]].sort((a, b) => {
      // Convert dates to timestamps for comparison
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA; // Most recent first
    });

    // Return the most recent attempt
    return sortedAttempts[0];
  };

  const getAllAttemptsForQuestion = (questionId: string): Attempt[] => {
    if (!attempts || !attempts[questionId]) {
      return [];
    }

    // Make sure we return a properly formatted array of Attempt objects
    return attempts[questionId].map(attempt => ({
      ...attempt,
      // Ensure these properties exist and have valid values
      attemptNumber: attempt.attemptNumber || 1,
      answer: attempt.answer || 1,
      correct: attempt.correct || false,
      confidence: attempt.confidence || 0,
      date: attempt.date || new Date().toLocaleDateString()
    }));
  };

  // ===== EVENT HANDLERS =====

  const handleQuestionToggle = (questionId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (onQuestionToggle) {
      // We need to toggle the current state
      // Since we don't have direct access to the selectedQuestions array,
      // we determine if it's currently checked by the isChecked property
      const question = subdomain.questions.find(q => q.id === questionId);
      if (question) {
        onQuestionToggle(questionId, !question.isChecked);
      }
    }
  };

  const handleQuestionClick = (questionId: string) => {
    setPreviewQuestionId(questionId);
  };

  /**
   * Close preview modal
   */
  const closePreview = () => {
    setPreviewQuestionId(null);
  };

  /**
   * Handle select all questions
   */
  const handleSelectAll = () => {
    if (onQuestionToggle) {
      // Check if all questions are already selected
      const allChecked = subdomain.questions.every(q => q.isChecked);

      // Toggle all questions based on current state
      subdomain.questions.forEach(q => {
        onQuestionToggle(q.id, !allChecked);
      });
    }
  };

  // ===== RENDER JSX =====
  return (
    <div className="bg-gray-900 rounded-xl shadow-lg">
      {/* Preview Question Modal */}
      {previewQuestionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/90 backdrop-blur-sm">
          <div className="max-w-4xl w-3/4 mx-auto">
            <div className="relative flex flex-col items-center">
              {/* Close Button */}
              <button
                onClick={closePreview}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                aria-label="Close preview"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-full">
                {/* Pass all attempts to PreviewQuestion for history */}
                {subdomain.questions.map((q: Question) => {
                  if (q.id === previewQuestionId) {
                    return (
                      <PreviewQuestion
                        key={q.id}
                        question={q}
                        classificationName={subdomain.name || "N/A"}
                        attempts={getAllAttemptsForQuestion(q.id)}
                      />
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {isExpanded && (
        <div className="p-4">
          {/* Header with Select All button */}
          <div className="grid grid-cols-12 gap-2 mb-4 items-center">
            <div className="col-span-4">
              <button
                onClick={handleSelectAll}
                className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-full text-xs font-medium text-gray-300 hover:text-white transition-colors"
              >
                SELECT ALL
              </button>
            </div>
            <div className="col-span-2"></div>
            <div className="col-span-2 text-center">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Difficulty</span>
              <div className="h-px bg-gray-700 mt-1"></div>
            </div>
            <div className="col-span-2 text-center">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Answer</span>
              <div className="h-px bg-gray-700 mt-1"></div>
            </div>
            <div className="col-span-2 text-center">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Conf.</span>
              <div className="h-px bg-gray-700 mt-1"></div>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-3">
            {subdomain.questions.map((question: Question) => {
              // Get the most recent attempt for this question
              const mostRecentAttempt = getMostRecentAttemptForQuestion(question.id);

              // Use data from the most recent attempt if available
              const isCorrect = mostRecentAttempt ? mostRecentAttempt.correct : question.isCorrect;
              const confidence = mostRecentAttempt ? mostRecentAttempt.confidence : question.confidence;

              // Set colors based on difficulty
              let difficultyColor = "border-green-500";
              let difficultyTextColor = "text-green-500";
              let difficultyBg = "bg-green-500/10";

              if (question.difficulty === 'med' || question.difficulty === 'medium') {
                difficultyColor = "border-yellow-500";
                difficultyTextColor = "text-yellow-500";
                difficultyBg = "bg-yellow-500/10";
              } else if (question.difficulty === 'hard') {
                difficultyColor = "border-red-500";
                difficultyTextColor = "text-red-500";
                difficultyBg = "bg-red-500/10";
              }

              return (
                <div key={question.id} className="grid grid-cols-12 gap-2 items-center py-2 border-b border-gray-800">
                  {/* Question Text and Checkbox */}
                  <div className="col-span-6">
                    <div className="flex items-center">
                      {/* Checkbox Area*/}
                      <div
                        className="w-5 h-5 mr-3 flex items-center justify-center border border-gray-600 rounded cursor-pointer hover:border-gray-400 transition-colors"
                        onClick={(e) => handleQuestionToggle(question.id, e)}
                      >
                        {question.isChecked && <span className="w-3 h-3 bg-white rounded-sm"></span>}
                      </div>

                      {/* Question Text Area */}
                      <span
                        className="text-sm text-gray-300 cursor-pointer hover:text-white transition-colors"
                        onClick={() => handleQuestionClick(question.id)}
                      >
                        {question.text}
                      </span>
                    </div>
                  </div>

                  {/* Difficulty Badge */}
                  <div className="col-span-2 flex justify-center">
                    <div className={`px-3 py-1 rounded-full border ${difficultyColor} ${difficultyBg}`}>
                      <span className={`${difficultyTextColor} text-xs font-medium`}>{question.difficulty}</span>
                    </div>
                  </div>

                  {/* Answer Result */}
                  <div className="col-span-2 flex justify-center">
                    {isCorrect ? (
                      <div className="bg-green-900/20 w-8 h-8 rounded-full flex items-center justify-center">
                        <Check className="text-green-500 w-5 h-5" />
                      </div>
                    ) : (
                      <div className="bg-red-900/20 w-8 h-8 rounded-full flex items-center justify-center">
                        <X className="text-red-500 w-5 h-5" />
                      </div>
                    )}
                  </div>

                  {/* Confidence Level */}
                  <div className="col-span-2 flex justify-center">
                    {/* Display confidence if available */}
                    {confidence !== undefined ? (
                      <span className="text-sm font-medium text-gray-300 bg-gray-800/70 px-3 py-1 rounded-full">{confidence}</span>
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Subdomain;