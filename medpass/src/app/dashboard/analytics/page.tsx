'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StudyAnalytics from '@/components/analytics';
import Sidebar from '@/components/navbar';
import MiniMetric from '@/components/TrendCard';
import QuestionPerformance from '@/components/results/QuestionHistory';

const MedalliaAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<string>('Last 7 Days');


  //returns an array of objects with random values for the trend data
  const generateTrendData = (points = 20) => {
    return Array.from({ length: points }, (_, i) => ({
      date: `Day ${i + 1}`,
      value: Math.random() * 2 + 4
    }));
  };

  //mocked metrics for demo purposes
  const metrics = [
    {
      title: "Average Session Length",
      value: "3.5 Hours",
      trend: 0.5,
      color: "#60A5FA",
      data: generateTrendData()
    },
    {
      title: "Average Quiz Score (%)",
      value: "78.5%",
      trend: -1.5,
      color: "#FBBF24",
      data: generateTrendData()
    },
    {
      title: "Lessons Completed ",
      value: "12",
      trend: 2.1,
      color: "#34D399",
      data: generateTrendData()
    },
    {
      title: "Ranking Among Similar Users",
      value: "4,567th",
      trend: 5.3,
      color: "#818CF8",
      data: generateTrendData()
    }
  ];

  const timeRanges = ['Last 7 Days', 'Last 30 Days', 'Last 90 Days'];

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar />
      <div className="pl-[100px] p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">How Are We Doing Overall?</h2>
            <select
              className="bg-gray-800 text-gray-200 border border-gray-700 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              {timeRanges.map(range => (
                <option key={range} value={range}>{range}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric, index) => (
              <MiniMetric
                key={index}
                title={metric.title}
                value={metric.value}
                trend={metric.trend}
                color={metric.color}
                data={metric.data}
              />
            ))}
          </div>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">USER Scores over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <StudyAnalytics />
            </CardContent>
          </Card>

          <div className="mt-8">
            <QuestionPerformance />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedalliaAnalytics;