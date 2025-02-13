import React, { useState } from 'react';
import { LineChart, Line, ResponsiveContainer, Area } from 'recharts';
import { 
  Brain, 
  Heart, 
  Pill, 
  FlaskConical, 
  Stethoscope, 
  Activity,
  X,
  LucideIcon,
  CircleOff,
  BookOpen
} from 'lucide-react';
import { default as CustomCarousel } from './Carousel';

interface BlockCardProps {
  id: string;
  title: string;
  subtitle: string;
  completion: number;
  color: string;
  icon: React.ReactElement;
  data: { name: string; value: number }[];
  insight: {
    type: 'progress' | 'time' | 'assignment';
    value: string;
    detail: string;
  };
  isExpanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
}

// Action buttons component
const ActionButtons = () => {
  const buttons = [
    { label: 'Study', onClick: () => console.log('Study clicked') },
    { label: 'Plan', onClick: () => console.log('Plan clicked') },
    { label: 'Review', onClick: () => console.log('Review clicked') },
    { label: 'Resources', onClick: () => console.log('Resources clicked') },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {buttons.map((button) => (
        <button
          key={button.label}
          onClick={button.onClick}
          className="py-4 px-6 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors text-lg"
        >
          {button.label}
        </button>
      ))}
    </div>
  );
};

const BlockCard = ({ 
  id, 
  title, 
  subtitle,
  completion, 
  color, 
  icon, 
  data,
  insight,
  isExpanded,
  onExpand,
  onCollapse 
}: BlockCardProps) => {
  if (isExpanded) {
    return (
      <div className="w-full">
        <div className="h-full w-full rounded-xl bg-gray-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={color}>
                {icon}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{title}</h3>
                <p className="text-sm text-gray-400">{subtitle}</p>
              </div>
            </div>
            <button 
              onClick={onCollapse}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="h-[calc(100vh-200px)] flex flex-col">
            <div className="flex-1 mb-6">
              <CustomCarousel />
            </div>
            <div className="mb-2">
              <ActionButtons />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={onExpand}
      className="h-[180px] w-full bg-gray-800 rounded-xl p-4 hover:bg-gray-800/90 transition-colors cursor-pointer flex flex-col"
    >
      {/* Header with Icon and Title */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`${color} p-2 rounded-lg bg-gray-700/50`}>
          <div className="h-6 w-6">
            {icon}
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white">{title}</h3>
          <p className="text-sm text-gray-400">{subtitle}</p>
        </div>
      </div>
  
      {/* Progress Bar */}
      <div className="mb-auto">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-400">Block Progress</span>
          <span className="text-gray-300">{completion}%</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full">
          <div 
            className={`h-2 rounded-full ${
              completion >= 80 ? 'bg-green-500' :
              completion >= 60 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${completion}%` }}
          />
        </div>
      </div>
  
      {/* Have to fix this
      Block Insight
      <div className="bg-gray-700/50 rounded-lg p-3 mt-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-300 text-sm">{insight.detail}</span>
          <span className="text-white font-medium">{insight.value}</span>
        </div>
      </div> */}
    </div>
  );
}

const blockData = {
  A: [
    { name: 'P1', value: 0 },
    { name: 'P2', value: 85 },
    { name: 'P3', value: 70 },
    { name: 'P4', value: 65 },
    { name: 'P5', value: 81 }
  ],
  B: [
    { name: 'P1', value: 0 },
    { name: 'P2', value: 90 },
    { name: 'P3', value: 75 },
    { name: 'P4', value: 70 },
    { name: 'P5', value: 83 }
  ],
  C: [
    { name: 'P1', value: 0 },
    { name: 'P2', value: 78 },
    { name: 'P3', value: 82 },
    { name: 'P4', value: 68 },
    { name: 'P5', value: 75 }
  ],
  D: [
    { name: 'P1', value: 0 },
    { name: 'P2', value: 88 },
    { name: 'P3', value: 72 },
    { name: 'P4', value: 85 },
    { name: 'P5', value: 83 }
  ],
  E: [
    { name: 'P1', value: 0 },
    { name: 'P2', value: 92 },
    { name: 'P3', value: 85 },
    { name: 'P4', value: 78 },
    { name: 'P5', value: 89 }
  ],
  F: [
    { name: 'P1', value: 0 },
    { name: 'P2', value: 85 },
    { name: 'P3', value: 80 },
    { name: 'P4', value: 75 },
    { name: 'P5', value: 85 }
  ]
};

const StepOverview = () => {
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);

  const blocks = [
    { 
      id: 'A', 
      title: 'Block 1', 
      subtitle: 'Neuroscience',
      icon: <Brain className="h-6 w-6" />, 
      color: 'text-blue-400', 
      completion: 81,
      insight: {
        type: 'progress' as const,
        value: '36/42',
        detail: 'Topics Mastered'
      }
    },
    { 
      id: 'B', 
      title: 'Block 2', 
      subtitle: 'Cardiovascular',
      icon: <Heart className="h-6 w-6" />, 
      color: 'text-rose-400', 
      completion: 83,
      insight: {
        type: 'time' as const,
        value: '2 weeks',
        detail: 'Time Remaining'
      }
    },
    { 
      id: 'C', 
      title: 'Block 3', 
      subtitle: 'Respiratory',
      icon: <Activity className="h-6 w-6" />, 
      color: 'text-teal-400', 
      completion: 75,
      insight: {
        type: 'assignment' as const,
        value: 'Tomorrow',
        detail: 'Quiz Due'
      }
    },
    { 
      id: 'D', 
      title: 'Block 4', 
      subtitle: 'Renal',
      icon: <CircleOff className="h-6 w-6" />, 
      color: 'text-purple-400', 
      completion: 83,
      insight: {
        type: 'progress' as const,
        value: '28/35',
        detail: 'Topics Mastered'
      }
    },
    { 
      id: 'E', 
      title: 'Block 5', 
      subtitle: 'Clinical Sciences',
      icon: <Stethoscope className="h-6 w-6" />, 
      color: 'text-amber-400', 
      completion: 89,
      insight: {
        type: 'time' as const,
        value: '3 weeks',
        detail: 'Time Remaining'
      }
    },
    { 
      id: 'F', 
      title: 'Block 6', 
      subtitle: 'Pathology',
      icon: <BookOpen className="h-6 w-6" />, 
      color: 'text-emerald-400', 
      completion: 85,
      insight: {
        type: 'assignment' as const,
        value: '2 days',
        detail: 'Exam Due'
      }
    }
  ];

  if (expandedBlock) {
    const expandedBlockData = blocks.find(block => block.id === expandedBlock);
    if (expandedBlockData) {
      return (
        <BlockCard
          key={expandedBlockData.id}
          {...expandedBlockData}
          data={blockData[expandedBlockData.id as keyof typeof blockData]}
          isExpanded={true}
          onExpand={() => {}}
          onCollapse={() => setExpandedBlock(null)}
        />
      );
    }
  }

  return (
    <div className="grid grid-cols-3 gap-4 bg-gray-900">
      {blocks.map(block => (
        <BlockCard
          key={block.id}
          {...block}
          data={blockData[block.id as keyof typeof blockData]}
          isExpanded={false}
          onExpand={() => setExpandedBlock(block.id)}
          onCollapse={() => setExpandedBlock(null)}
        />
      ))}
    </div>
  );
};

export default StepOverview;