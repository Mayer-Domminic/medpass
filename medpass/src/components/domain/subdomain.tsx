import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Check, X } from 'lucide-react';
import { SubdomainType, Question } from '@/types/domain'; 

interface SubdomainProps {
  subdomain: SubdomainType;
  isExpanded: boolean;
  onToggle: () => void;
  onQuestionToggle?: (questionId: string, isChecked: boolean) => void;
}

const Subdomain: React.FC<SubdomainProps> = ({
  subdomain,
  isExpanded,
  onToggle,
  onQuestionToggle,
}) => {
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set<string>());

  const handleQuestionToggle = (questionId: string) => {
    setSelectedQuestions(prev => {
      const newSelected = new Set<string>(prev);
      if (newSelected.has(questionId)) {
        newSelected.delete(questionId);
      } else {
        newSelected.add(questionId);
      }
      if (onQuestionToggle) {
        onQuestionToggle(questionId, newSelected.has(questionId));
      }
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    if (selectedQuestions.size === subdomain.questions.length) {
      setSelectedQuestions(new Set<string>());
      if (onQuestionToggle) {
        subdomain.questions.forEach((q: Question) => onQuestionToggle(q.id, false));
      }
    } else {
      const allIds = new Set<string>(subdomain.questions.map((q: Question) => q.id));
      setSelectedQuestions(allIds);
      if (onQuestionToggle) {
        subdomain.questions.forEach((q: Question) => onQuestionToggle(q.id, true));
      }
    }
  };

  return (
    <div className="border border-gray-700 rounded bg-gray-800/50">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-2 text-left hover:bg-gray-700/50 transition-colors rounded"
      >
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-300">{subdomain.title}</span>
          {subdomain.isLatestConf && <span className="ml-2 text-gray-400">- Latest Conf.</span>}
        </div>
        <div className="flex items-center">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-3 py-2 bg-gray-800/30 rounded-b">
          <div className="grid grid-cols-12 gap-1 mb-4 items-center">
            <div className="col-span-4">
              <button
                onClick={handleSelectAll}
                className="px-3 py-1 bg-gray-700/50 hover:bg-gray-700 rounded-full text-xs font-medium text-gray-300 transition-colors"
              >
                SELECT ALL
              </button>
            </div>
            <div className="col-span-2"></div>
            <div className="col-span-2 text-center text-xs font-medium text-gray-400">DIFFICULTY<div className="h-px bg-gray-600 mt-1"></div></div>
            <div className="col-span-2 text-center text-xs font-medium text-gray-400">ANSWER<div className="h-px bg-gray-600 mt-1"></div></div>
            <div className="col-span-2 text-center text-xs font-medium text-gray-400">CONF.<div className="h-px bg-gray-600 mt-1"></div></div>
          </div>

          <div className="space-y-2">
            {subdomain.questions.map((question: Question) => {
              const isSelected = selectedQuestions.has(question.id);

              let difficultyColor = "border-green-500";
              let difficultyTextColor = "text-green-500";
              let difficultyBg = "bg-green-500/10";

              if (question.difficulty === 'med') {
                difficultyColor = "border-yellow-500";
                difficultyTextColor = "text-yellow-500";
                difficultyBg = "bg-yellow-500/10";
              } else if (question.difficulty === 'hard') {
                difficultyColor = "border-red-500";
                difficultyTextColor = "text-red-500";
                difficultyBg = "bg-red-500/10";
              }

              return (
                <div key={question.id} className="grid grid-cols-12 gap-1 items-center">
                  <div className="col-span-6">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleQuestionToggle(question.id)}
                        className="hidden"
                      />
                      <div className="w-5 h-5 mr-2 flex items-center justify-center border border-gray-500 rounded">
                        {isSelected && <span className="w-3 h-3 bg-white rounded-sm"></span>}
                      </div>
                      <span className="text-xs text-gray-300">{question.text}</span>
                    </label>
                  </div>

                  <div className="col-span-2 flex justify-center">
                    <div className={`px-2 py-1 rounded-full border ${difficultyColor} ${difficultyBg}`}>
                      <span className={`${difficultyTextColor} text-xs`}>{question.difficulty}</span>
                    </div>
                  </div>

                  <div className="col-span-2 flex justify-center">
                    {question.isCorrect ? (
                      <Check className="text-green-500 w-5 h-5" />
                    ) : (
                      <X className="text-red-500 w-5 h-5" />
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
