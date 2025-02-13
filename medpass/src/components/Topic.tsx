import React, { useState, useEffect, ReactElement } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import AnimatedProgressBar from './ProgressComponents/AnimatedProgressBar';

interface TopicProps {
  number: string;
  title: string;
  confidence: number;
  proficiency: number;
  children?: ReactElement<QuestionListProps>;
}

interface QuestionListProps {
  isExpanded: boolean;
}

const QuestionList: React.FC<QuestionListProps> = ({ isExpanded }) => {
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (!isExpanded) {
      setAnimationKey(prev => prev + 1);
    }
  }, [isExpanded]);

  return (
    <div className="space-y-4" style={{ opacity: isExpanded ? 1 : 0 }}>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">1.1</span>
          <span className="text-xs text-gray-400">Last attempted: 2 days ago</span>
        </div>
        <p className="text-sm">Question 1</p>
        <div className="space-y-1">
          <AnimatedProgressBar
            value={75}
            color="bg-blue-400"
            label="Conf."
            size="sm"
            isAnimated={isExpanded}
            animationDelay="0.1s"
            animationKey={animationKey}
          />
          <AnimatedProgressBar
            value={66}
            color="bg-green-400"
            label="Prof."
            size="sm"
            isAnimated={isExpanded}
            animationDelay="0.2s"
            animationKey={animationKey}
          />
        </div>
      </div>
    </div>
  );
};

const styles = `
  @keyframes growWidth {
    0% { width: 0%; }
    100% { width: var(--final-width); }
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

const Topic: React.FC<TopicProps> = ({ 
  number, 
  title, 
  confidence, 
  proficiency,
  children 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-full">
      <div 
        className="flex items-center gap-4 cursor-pointer py-2 select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="transition-transform duration-300">
          {isExpanded ? (
            <ChevronDown className="text-gray-400 flex-shrink-0" size={20} />
          ) : (
            <ChevronRight className="text-gray-400 flex-shrink-0" size={20} />
          )}
        </div>
        <span className="text-sm text-gray-600">{number}</span>
        <span className="text-base font-bold flex-grow">{title}</span>

        <div className="flex items-center gap-8 ml-auto">
          <AnimatedProgressBar
            value={confidence}
            color="bg-blue-400"
            size="md"
          />
          <AnimatedProgressBar
            value={proficiency}
            color="bg-green-400"
            size="md"
          />
        </div>
      </div>

      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-96' : 'max-h-0'
        }`}
      >
        <div 
          className={`pl-10 py-2 transition-opacity duration-300 ${
            isExpanded ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {children && React.cloneElement(children, { isExpanded })}
        </div>
      </div>
    </div>
  );
};

//Mocked Example for 'Topic' Component

const TopicExample: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-2">
      <Topic 
        number="6.1"
        title="Subtopic 6.1"
        confidence={85}
        proficiency={80}
      >
        <QuestionList isExpanded={false} />
      </Topic>
      <Topic 
        number="6.2"
        title="Subtopic 6.2"
        confidence={90}
        proficiency={85}
      >
        <QuestionList isExpanded={false} />
      </Topic>
      <Topic 
        number="6.3"
        title="Subtopic 6.3"
        confidence={95}
        proficiency={90}
      >
        <QuestionList isExpanded={false} />
      </Topic>
    </div>
  );
};

export default TopicExample;