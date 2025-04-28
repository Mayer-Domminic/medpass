import React, { useState } from 'react';
import { SubdomainType } from './domain';
import { ChevronDown, ChevronRight, Check, X } from 'lucide-react';
import DomainQuestions from './DomainQuestions';

// Updated types to include difficulty and points
export type subdomainQuestion = {
  id: string;
  text: string;
  difficulty: 'easy' | 'med' | 'hard';
  points: number;
  isChecked: boolean;
};

interface SubdomainProps {
  subdomain: SubdomainType;
  isExpanded: boolean;
  onToggle: () => void;
  onQuestionToggle?: (questionId: string, isChecked: boolean) => void;
  domainName: string;
}

const Subdomain: React.FC<SubdomainProps> = ({ 
  subdomain, 
  isExpanded, 
  onToggle, 
  onQuestionToggle,
  domainName
}) => {
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  
  const handleQuestionToggle = (questionId: string) => {
    const newSelected = new Set(selectedQuestions);
    
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    
    setSelectedQuestions(newSelected);
    
    if (onQuestionToggle) {
      onQuestionToggle(questionId, newSelected.has(questionId));
    }
  };

  const handleSelectAll = () => {
    if (selectedQuestions.size === subdomain.questions.length) {
      // Deselect all
      setSelectedQuestions(new Set());
      
      // Notify parent if needed
      if (onQuestionToggle) {
        subdomain.questions.forEach(q => onQuestionToggle(q.id, false));
      }
    } else {
      // Select all
      const allIds = new Set(subdomain.questions.map(q => q.id));
      setSelectedQuestions(allIds);
      
      // Notify parent if needed
      if (onQuestionToggle) {
        subdomain.questions.forEach(q => onQuestionToggle(q.id, true));
      }
    }
  };
  
  return (
    <div className="border border-gray-700 rounded bg-gray-800/50">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-700/50 transition-colors rounded"
      >
        <div className="flex items-center">
          <span className="text-large font-semibold text-gray-300">{subdomain.title}</span>
          {subdomain.isLatestConf && <span className="ml-2 text-gray-400">- Latest Conf.</span>}
        </div>
        <div className="flex items-center">
          {isExpanded && <Check className="h-5 w-5 text-green-500 mr-2" />}
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>
      
      {isExpanded && (
        <div className="p-4 bg-gray-800/30 rounded-b">
          {/* Grid layout with 12 columns */}
          <div className="grid grid-cols-12 gap-2 mb-6 items-center">
            {/* SELECT ALL button takes 4 columns */}
            <div className="col-span-4">
              <button 
                onClick={handleSelectAll}
                className="px-4 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-full text-xs font-medium text-gray-300 transition-colors"
              >
                SELECT ALL
              </button>
            </div>
            
            {/* Empty space takes 2 columns */}
            <div className="col-span-2"></div>
            
            {/* Column headers take 2 columns each */}
            <div className="col-span-2 text-center text-xs font-medium text-gray-400">
              <span>DIFFICULTY</span>
              <div className="h-px bg-gray-600 mt-1"></div>
            </div>
            <div className="col-span-2 text-center text-xs font-medium text-gray-400">
              <span>ANSWER</span>
              <div className="h-px bg-gray-600 mt-1"></div>
            </div>
            <div className="col-span-2 text-center text-xs font-medium text-gray-400">
              <span>CONF.</span>
              <div className="h-px bg-gray-600 mt-1"></div>
            </div>
          </div>
          
          {/* Questions */}
          <div className="space-y-3">
            {subdomain.questions.map((question) => {
              const isSelected = selectedQuestions.has(question.id);
              
              // Determine difficulty color
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
                <div key={question.id} className="grid grid-cols-12 gap-2 items-center">
                  {/* Question column - 6 columns */}
                  <div className="col-span-6">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleQuestionToggle(question.id)}
                        className="hidden"
                      />
                      <div className="w-5 h-5 mr-3 flex items-center justify-center border border-gray-500 rounded">
                        {isSelected && <span className="w-3 h-3 bg-white rounded-sm"></span>}
                      </div>
                      <span className="text-xs text-gray-300">{question.text}</span>
                    </label>
                  </div>
                  
                  {/* Metadata columns - each 2 columns */}
                  <div className="col-span-2 flex justify-center">
                    <div className={`px-3 py-1 rounded-full border ${difficultyColor} ${difficultyBg}`}>
                      <span className={`${difficultyTextColor} text-xs`}>{question.difficulty}</span>
                    </div>
                  </div>
                  
                  <div className="col-span-2 flex justify-center">
                    {question.difficulty === 'hard' ? (
                      <X className="text-red-500 w-5 h-5" />
                    ) : (
                      <Check className="text-green-500 w-5 h-5" />
                    )}
                  </div>
                  
                  <div className="col-span-2 flex justify-center">
                    <span className="font-medium text-lg text-gray-300">{question.points}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add the Practice Questions section */}
          <div className="mt-8 pt-6 border-t border-gray-700">
            <h3 className="text-lg font-semibold text-gray-300 mb-4">Practice Questions</h3>
            <DomainQuestions 
              domain={domainName}
              subdomain={subdomain.title}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Subdomain;