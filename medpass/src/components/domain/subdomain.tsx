import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SubdomainType } from './domain';
import { ChevronDown, ChevronRight, Check, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useSession } from 'next-auth/react';

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
  const router = useRouter();
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [generatingAIQuestions, setGeneratingAIQuestions] = useState(false);
  const { data: session } = useSession();
  const [questions, setQuestions] = useState<subdomainQuestion[]>(subdomain.questions || []);
  const [additionalContext, setAdditionalContext] = useState('');
  
  const fetchQuestions = async () => {
    if (!session?.accessToken) return;
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/practice-questions/?domain=${encodeURIComponent(domainName)}&subdomain=${encodeURIComponent(subdomain.title)}`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data.questions)) {
        const formattedQuestions = data.questions.map((q: any) => ({
          id: q.id,
          text: q.text,
          difficulty: q.difficulty === 'medium' ? 'med' : q.difficulty,
          points: 5,
          isChecked: false
        }));
        
        setQuestions(formattedQuestions);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  useEffect(() => {
    setQuestions(subdomain.questions || []);
    
    if (isExpanded && session?.accessToken) {
      fetchQuestions();
    }
  }, [subdomain, isExpanded, session?.accessToken]);

  const generateAIQuestions = async () => {
    if (!session?.accessToken) return;
    
    setGeneratingAIQuestions(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/practice-questions/generate?domain=${encodeURIComponent(domainName)}&subdomain=${encodeURIComponent(subdomain.title)}&count=5&rag=true&additional_context=${encodeURIComponent(additionalContext)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.accessToken}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      await fetchQuestions();
    } catch (error) {
      console.error('Error generating AI questions:', error);
    } finally {
      setGeneratingAIQuestions(false);
    }
  };
  
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
    if (selectedQuestions.size === questions.length) {
      // Deselect all
      setSelectedQuestions(new Set());
      
      // Notify parent if needed
      if (onQuestionToggle) {
        questions.forEach(q => onQuestionToggle(q.id, false));
      }
    } else {
      // Select all
      const allIds = new Set(questions.map(q => q.id));
      setSelectedQuestions(allIds);
      
      // Notify parent if needed
      if (onQuestionToggle) {
        questions.forEach(q => onQuestionToggle(q.id, true));
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
        
        <div className="flex items-center gap-2 mr-4">
          <Button
            size="sm"
            variant="outline"
            className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border-blue-600/30"
            onClick={(e) => {
              e.stopPropagation();
              generateAIQuestions();
            }}
            disabled={generatingAIQuestions}
          >
            {generatingAIQuestions ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                Generating...
              </>
            ) : (
              "Generate AI Questions"
            )}
          </Button>
          
          <Button
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={(e) => {
              e.stopPropagation();
              router.push(
                `/dashboard/review?domain=${encodeURIComponent(domainName)}&subdomain=${encodeURIComponent(subdomain.title)}&practice=true`
              );
            }}
          >
            Practice Questions
          </Button>
        </div>

        <div className="flex items-center gap-8 ml-auto">
          <div className="flex items-center">
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>
      </button>
      
      {isExpanded && (
        <div className="p-4 bg-gray-800/30 rounded-b">
          <div className="mb-4">
            <label htmlFor={`additionalContext-${subdomain.id}`} className="block text-sm font-medium text-gray-400 mb-1">
              Additional Context (optional)
            </label>
            <div className="flex gap-2">
              <textarea
                id={`additionalContext-${subdomain.id}`}
                value={additionalContext}
                onChange={e => setAdditionalContext(e.target.value)}
                className="flex-grow bg-gray-800 text-gray-300 border border-gray-700 rounded-md p-2"
                placeholder="Any specific topics or areas you'd like to focus on"
                rows={2}
              />
              <Button
                onClick={generateAIQuestions}
                disabled={generatingAIQuestions}
                className="bg-blue-600 hover:bg-blue-700 text-white self-end"
              >
                {generatingAIQuestions ? 'Generating...' : 'Generate More'}
              </Button>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-4">
              Questions ({questions.length})
            </h3>
            <div className="space-y-2">
              {questions.length > 0 ? (
                questions.map(question => (
                  <div key={question.id} className="flex items-center gap-3 text-gray-300 text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${
                      question.difficulty === 'easy' 
                        ? 'bg-green-900/30 text-green-400' 
                        : question.difficulty === 'med' 
                          ? 'bg-yellow-900/30 text-yellow-400' 
                          : 'bg-red-900/30 text-red-400'
                    }`}>
                      {question.difficulty}
                    </span>
                    <span>{question.text}</span>
                  </div>
                ))
              ) : (
                <div className="text-gray-400 text-sm italic">
                  No questions yet. Click "Generate AI Questions" to generate some.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subdomain;