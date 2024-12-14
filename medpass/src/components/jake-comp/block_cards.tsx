import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { Brain, Heart, Pill } from 'lucide-react';

const blockProgressData = {
  A: [
    [
      { name: 'P1', value: 65 },
      { name: 'P2', value: 85 },
      { name: 'P3', value: 70 },
      { name: 'P4', value: 90 },
      { name: 'P5', value: 81 }
    ],
    [
      { name: 'P1', value: 60 },
      { name: 'P2', value: 80 },
      { name: 'P3', value: 65 },
      { name: 'P4', value: 85 },
      { name: 'P5', value: 77 }
    ],
    [
      { name: 'P1', value: 55 },
      { name: 'P2', value: 75 },
      { name: 'P3', value: 60 },
      { name: 'P4', value: 80 },
      { name: 'P5', value: 75 }
    ]
  ],
  B: [
    [
      { name: 'P1', value: 70 },
      { name: 'P2', value: 90 },
      { name: 'P3', value: 75 },
      { name: 'P4', value: 95 },
      { name: 'P5', value: 83 }
    ],
    [
      { name: 'P1', value: 55 },
      { name: 'P2', value: 85 },
      { name: 'P3', value: 60 },
      { name: 'P4', value: 80 },
      { name: 'P5', value: 74 }
    ],
    [
      { name: 'P1', value: 60 },
      { name: 'P2', value: 80 },
      { name: 'P3', value: 65 },
      { name: 'P4', value: 85 },
      { name: 'P5', value: 75 }
    ]
  ],
  C: [
    [
      { name: 'P1', value: 75 },
      { name: 'P2', value: 95 },
      { name: 'P3', value: 80 },
      { name: 'P4', value: 100 },
      { name: 'P5', value: 89 }
    ],
    [
      { name: 'P1', value: 70 },
      { name: 'P2', value: 90 },
      { name: 'P3', value: 75 },
      { name: 'P4', value: 95 },
      { name: 'P5', value: 87 }
    ],
    [
      { name: 'P1', value: 65 },
      { name: 'P2', value: 85 },
      { name: 'P3', value: 70 },
      { name: 'P4', value: 90 },
      { name: 'P5', value: 84 }
    ]
  ]
};

interface BlockData {
  name: string;
  value: number;
}

interface BlockCardProps {
  title: string;
  completion: number;
  color: string;
  icon: React.ReactNode;
  data: BlockData[];
}

const BlockCard = ({ title, completion, color, icon, data }: BlockCardProps) => (
  <Card className="bg-gray-800/50 border-gray-700">
    <CardContent className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <span className="text-sm font-medium text-gray-200">{title}</span>
      </div>
      
      <div className="flex items-end justify-between mb-2">
        <div className="text-xl font-bold text-white">{completion}%</div>
        <span className="text-xs text-gray-400">completion</span>
      </div>

      <div className="h-12 mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line 
              type="monotone"
              dataKey="value"
              stroke={color.includes('blue') ? '#60A5FA' : color.includes('red') ? '#F87171' : '#5EEAD4'}
              strokeWidth={2}
              dot={{ strokeWidth: 1, r: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);

const StepOverview = () => {
  return (
    <div className="p-6 w-full">
      <h1 className="text-xl font-bold text-white mb-6">USMLE Step 1 Overview</h1>
      <div className="grid grid-cols-3 gap-4">
        {blockProgressData.A.map((data, index) => (
          <BlockCard
            key={`A${index}`}
            title="Block A"
            completion={data[data.length - 1].value}
            color="bg-blue-500/20"
            icon={<Brain className="w-4 h-4 text-blue-200" />}
            data={data}
          />
        ))}
        
        {blockProgressData.B.map((data, index) => (
          <BlockCard
            key={`B${index}`}
            title="Block B"
            completion={data[data.length - 1].value}
            color="bg-red-500/20"
            icon={<Heart className="w-4 h-4 text-red-200" />}
            data={data}
          />
        ))}
        
        {blockProgressData.C.map((data, index) => (
          <BlockCard
            key={`C${index}`}
            title="Block C"
            completion={data[data.length - 1].value}
            color="bg-teal-500/20"
            icon={<Pill className="w-4 h-4 text-teal-200" />}
            data={data}
          />
        ))}
      </div>
    </div>
  );
};

export default StepOverview;