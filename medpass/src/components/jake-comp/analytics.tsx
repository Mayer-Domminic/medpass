import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Area, AreaChart } from 'recharts';
import { Brain, Clock, Target, Book, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
}

const StatCard = ({ title, value, subtitle, icon, trend }: StatCardProps) => (
  <Card className="bg-white/5 border-gray-800 hover:bg-white/10 transition-colors">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <h3 className="text-2xl font-bold text-white mt-2">{value}</h3>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-lg bg-blue-500/10`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className={`mt-4 text-sm flex items-center gap-1 ${
          trend.value > 0 ? 'text-green-400' : 'text-red-400'
        }`}>
          {trend.value > 0 ? (
            <ArrowUp className="w-4 h-4" />
          ) : (
            <ArrowDown className="w-4 h-4" />
          )}
          {Math.abs(trend.value)}% {trend.label}
        </div>
      )}
    </CardContent>
  </Card>
);

const timeRanges = ['1W', '1M', '3M', '6M', 'ALL'] as const;
type TimeRange = typeof timeRanges[number];

const generateData = (days: number) => {
  const data = [];
  for (let i = 0; i < days; i++) {
    data.push({
      date: `Day ${i + 1}`,
      hours: Math.floor(Math.random() * 6) + 2,
      questions: Math.floor(Math.random() * 100) + 50,
      score: Math.floor(Math.random() * 30) + 70,
    });
  }
  return data;
};

const timeRangeMap = {
  '1W': 7,
  '1M': 30,
  '3M': 90,
  '6M': 180,
  'ALL': 365,
};

const StudyAnalytics = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('1W');
  const [selectedMetric, setSelectedMetric] = useState<'hours' | 'questions' | 'score'>('hours');

  const studyData = useMemo(() => 
    generateData(timeRangeMap[selectedTimeRange]), 
    [selectedTimeRange]
  );

  const metricLabels = {
    hours: 'Study Hours',
    questions: 'Questions Completed',
    score: 'Average Score (%)'
  };

  const calculateTrend = (data: any[], key: string) => {
    if (data.length < 2) return 0;
    const latest = data[data.length - 1][key];
    const previous = data[data.length - 2][key];
    return Number((((latest - previous) / previous) * 100).toFixed(1));
  };

  const stats = useMemo(() => {
    const totalHours = studyData.reduce((sum, day) => sum + day.hours, 0);
    const totalQuestions = studyData.reduce((sum, day) => sum + day.questions, 0);
    const avgScore = studyData.reduce((sum, day) => sum + day.score, 0) / studyData.length;

    return [
      {
        title: "Study Hours",
        value: `${totalHours}h`,
        subtitle: `Last ${timeRangeMap[selectedTimeRange]} days`,
        icon: <Clock className="w-6 h-6 text-blue-400" />,
        trend: { value: calculateTrend(studyData, 'hours'), label: "vs previous" }
      },
      {
        title: "Questions Completed",
        value: totalQuestions.toLocaleString(),
        subtitle: `Last ${timeRangeMap[selectedTimeRange]} days`,
        icon: <Brain className="w-6 h-6 text-blue-400" />,
        trend: { value: calculateTrend(studyData, 'questions'), label: "vs previous" }
      },
      {
        title: "Average Score",
        value: `${avgScore.toFixed(1)}%`,
        subtitle: "Practice tests",
        icon: <Target className="w-6 h-6 text-blue-400" />,
        trend: { value: calculateTrend(studyData, 'score'), label: "improvement" }
      },
      {
        title: "Study Sessions",
        value: `${studyData.length}`,
        subtitle: "Completed sessions",
        icon: <Book className="w-6 h-6 text-blue-400" />
      }
    ];
  }, [studyData, selectedTimeRange]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <Card className="bg-white/5 border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Performance Analytics</CardTitle>
            <div className="flex items-center gap-2">
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as 'hours' | 'questions' | 'score')}
                className="bg-gray-800 text-white text-sm rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(metricLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <div className="flex gap-1">
                {timeRanges.map((range) => (
                  <button
                    key={range}
                    onClick={() => setSelectedTimeRange(range)}
                    className={`px-3 py-1 text-sm rounded-lg ${
                      selectedTimeRange === range
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={studyData}>
                <defs>
                  <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  stroke="#6B7280"
                  tick={{ fill: '#6B7280' }}
                />
                <YAxis 
                  stroke="#6B7280"
                  tick={{ fill: '#6B7280' }}
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#E5E7EB' }}
                  itemStyle={{ color: '#E5E7EB' }}
                />
                <Area
                  type="monotone"
                  dataKey={selectedMetric}
                  stroke="#3B82F6"
                  fillOpacity={1}
                  fill="url(#colorMetric)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudyAnalytics;