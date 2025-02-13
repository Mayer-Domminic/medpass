import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface TrendCardProps {
  title: string;
  value: string;
  trend: number;
  color: string;
  data: Array<{ date: string; value: number; }>;
}

export default function TrendCard({ 
  title, 
  value, 
  trend, 
  color, 
  data 
}: TrendCardProps) {
  // Calculate padding based on min/max values | better scaling
  const minValue = Math.min(...data.map(d => d.value));
  const maxValue = Math.max(...data.map(d => d.value));
  const padding = (maxValue - minValue) * 0.2;

  return (
    <Card className="bg-gray-800/50 border-gray-700/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-m font-bold text-gray-400">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <p className={`text-xs ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend >= 0 ? '+' : ''}{trend}% from last month
            </p>
          </div>
          <div className="h-[40px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <YAxis 
                  domain={[minValue - padding, maxValue + padding]}
                  hide
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2.5}

                  //TODO: add cap for # of dots
                  dot={{ fill: color, strokeWidth: 0, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}