import React, { useState } from 'react';
import { LineChart, Line, ResponsiveContainer, Area } from 'recharts';
import { 
  Brain, 
  Heart, 
  Pill, 
  FlaskConical, 
  Stethoscope, 
  Activity,
  X 
} from 'lucide-react';

interface BlockCardProps {
  id: string;
  title: string;
  completion: number;
  color: string;
  icon: React.ReactElement;
  data: { name: string; value: number }[];
  isExpanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
}

const BlockCard = ({ 
  id, 
  title, 
  completion, 
  color, 
  icon, 
  data, 
  isExpanded,
  onExpand,
  onCollapse 
}: BlockCardProps) => {
  if (isExpanded) {
    return (
      <div className="w-full">
        <div className="h-full w-full rounded-xl bg-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={color}>
                {icon}
              </div>
              <span className="text-xl font-medium text-white">{title}</span>
            </div>
            <button 
              onClick={onCollapse}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          {/* Add your expanded view content here */}
          <div className="mt-6 h-[500px]">
            {/* Placeholder for expanded content */}
            <div className="h-full w-full flex items-center justify-center text-gray-400">
              Expanded view content will go here
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[180px] w-full">
      <button 
        onClick={onExpand}
        className="group relative h-full w-full [perspective:1000px]"
      >
        <div className="absolute inset-0 h-full w-full duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
          {/* Front of card */}
          <div className="absolute inset-0 h-full w-full rounded-xl bg-gray-800 p-4 [backface-visibility:hidden] hover:bg-gray-800/90 transition-colors">
            <div className="flex items-center gap-2">
              <div className={color}>
                {icon}
              </div>
              <span className="text-lg font-medium text-white">{title}</span>
            </div>
          </div>

          {/* Back of card */}
          <div className="absolute inset-0 h-full w-full rounded-xl bg-gray-800 p-4 [transform:rotateY(180deg)] [backface-visibility:hidden] hover:bg-gray-800/90 transition-colors">
            <div className="flex h-full flex-col">
              <div className="mb-2 flex items-end justify-between">
                <div className="text-2xl font-bold text-white">{completion}%</div>
                <span className="text-sm text-gray-400">completion</span>
              </div>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={getStrokeColor(color)}
                      fill={getStrokeColor(color)}
                      fillOpacity={0.1}
                    />
                    <Line 
                      type="monotone"
                      dataKey="value"
                      stroke={getStrokeColor(color)}
                      strokeWidth={2}
                      dot={{ strokeWidth: 1, r: 2, fill: getStrokeColor(color) }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
};

// Helper function to get the correct stroke color
const getStrokeColor = (colorClass: string) => {
  const colorMap = {
    'text-blue-400': '#60A5FA',
    'text-rose-400': '#FB7185',
    'text-teal-400': '#2DD4BF',
    'text-purple-400': '#C084FC',
    'text-amber-400': '#FCD34D',
    'text-emerald-400': '#34D399'
  };
  return colorMap[colorClass as keyof typeof colorMap] || '#60A5FA';
};

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
    { id: 'A', title: 'Block A', icon: <Brain className="h-5 w-5" />, color: 'text-blue-400', completion: 81 },
    { id: 'B', title: 'Block B', icon: <Heart className="h-5 w-5" />, color: 'text-rose-400', completion: 83 },
    { id: 'C', title: 'Block C', icon: <FlaskConical className="h-5 w-5" />, color: 'text-teal-400', completion: 75 },
    { id: 'D', title: 'Block D', icon: <Activity className="h-5 w-5" />, color: 'text-purple-400', completion: 83 },
    { id: 'E', title: 'Block E', icon: <Pill className="h-5 w-5" />, color: 'text-amber-400', completion: 89 },
    { id: 'F', title: 'Block F', icon: <Stethoscope className="h-5 w-5" />, color: 'text-emerald-400', completion: 85 }
  ];

  if (expandedBlock) {
    const expandedBlockData = blocks.find(block => block.id === expandedBlock);
    if (expandedBlockData) {
      return (
        <BlockCard
          key={expandedBlockData.id}
          id={expandedBlockData.id}
          title={expandedBlockData.title}
          completion={expandedBlockData.completion}
          color={expandedBlockData.color}
          icon={expandedBlockData.icon}
          data={blockData[expandedBlockData.id as keyof typeof blockData]}
          isExpanded={true}
          onExpand={() => {}}
          onCollapse={() => setExpandedBlock(null)}
        />
      );
    }
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {blocks.map(block => (
        <BlockCard
          key={block.id}
          id={block.id}
          title={block.title}
          completion={block.completion}
          color={block.color}
          icon={block.icon}
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