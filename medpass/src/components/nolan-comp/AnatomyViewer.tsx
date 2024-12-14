import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

interface OrganData {
  id: string;
  name: string;
  proficiency: number;
  color: string;
  path: string;
  position: { x: number; y: number };
}

const organData: OrganData[] = [
  {
    id: 'heart',
    name: 'Heart',
    proficiency: 85,
    color: '#F87171',
    path: 'M50,50 C50,50 80,20 80,60 C80,100 50,120 50,120 C50,120 20,100 20,60 C20,20 50,50 50,50 Z',
    position: { x: 50, y: 40 }
  },
  {
    id: 'lungs',
    name: 'Lungs',
    proficiency: 78,
    color: '#60A5FA',
    path: 'M90,40 Q100,50 90,60 L75,70 Q65,60 75,50 Z',
    position: { x: 75, y: 35 }
  },
  {
    id: 'liver',
    name: 'Liver',
    proficiency: 92,
    color: '#34D399',
    path: 'M40,80 Q60,70 80,80 Q70,100 50,100 Q30,90 40,80 Z',
    position: { x: 60, y: 70 }
  }
];

const AnatomyViewer = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('lastWeek');
  const [selectedOrgan, setSelectedOrgan] = useState<string | null>(null);
  const [proficiency, setProficiency] = useState(98.8);

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium text-white">MedPASS Usage</CardTitle>
        <Select defaultValue={selectedTimeframe} onValueChange={setSelectedTimeframe}>
          <SelectTrigger className="w-32 bg-gray-700 border-gray-600 text-white">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lastWeek">Last Week</SelectItem>
            <SelectItem value="lastMonth">Last Month</SelectItem>
            <SelectItem value="last3Months">Last 3 Months</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Current Proficiency Level</span>
            <span className="text-lg font-bold text-white">{proficiency}%</span>
          </div>
          <Progress value={proficiency} className="h-2" 
            indicatorClassName="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0</span>
            <span>25</span>
            <span>50</span>
            <span>75</span>
            <span>100</span>
          </div>
        </div>

        <div className="relative aspect-square w-full max-w-md mx-auto bg-gray-900/50 rounded-lg p-4">
          <div className="text-sm text-gray-400 absolute top-2 left-2">
            USMLE Step 1
          </div>
          <div className="text-xs text-gray-500 absolute top-6 left-2">
            Last checked 2 Days Ago
          </div>
          
          <svg
            viewBox="0 0 100 120"
            className="w-full h-full"
            style={{ filter: 'drop-shadow(0px 0px 10px rgba(0,0,0,0.3))' }}
          >
            {/* Transparent human body outline */}
            <path
              d="M50,10 Q65,10 65,25 Q65,35 60,40 L60,80 Q60,90 50,95 Q40,90 40,80 L40,40 Q35,35 35,25 Q35,10 50,10"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="0.5"
            />
            
            {/* Interactive organs */}
            {organData.map((organ) => (
              <g key={organ.id}>
                <path
                  d={organ.path}
                  fill={selectedOrgan === organ.id ? organ.color : `${organ.color}80`}
                  stroke={organ.color}
                  strokeWidth="0.5"
                  className="transition-colors duration-200 cursor-pointer"
                  onClick={() => setSelectedOrgan(organ.id)}
                />
                {selectedOrgan === organ.id && (
                  <text
                    x={organ.position.x}
                    y={organ.position.y - 5}
                    fill="white"
                    fontSize="4"
                    textAnchor="middle"
                  >
                    {organ.name}: {organ.proficiency}%
                  </text>
                )}
              </g>
            ))}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnatomyViewer;
