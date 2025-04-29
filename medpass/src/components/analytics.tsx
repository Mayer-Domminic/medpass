import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Area, AreaChart } from 'recharts';
import { Brain, Clock, Target, Book, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

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

interface StudentStatistics {
  total_exams_taken: number;
  average_score: string;
  total_questions_answered: string;
  correct_answer_percentage: string;
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


const generateHistoricalData = (days: number, baseStats: StudentStatistics) => {
  const data = [];
  const baseScore = parseFloat(baseStats.average_score);
  const baseQuestions = parseInt(baseStats.total_questions_answered) / baseStats.total_exams_taken;
  
  for (let i = 0; i < days; i++) {
    const scoreVariation = (Math.random() * 20) - 10; 
    const questionsVariation = (Math.random() * 2) - 1; 
    
    data.push({
      date: `Day ${i + 1}`,
      score: Math.max(0, Math.min(100, baseScore + scoreVariation)),
      questions: Math.max(1, Math.round(baseQuestions + questionsVariation)),
      exams: i % 3 === 0 ? 1 : 0,
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

const metricLabels = {
  score: 'Score (%)',
  questions: 'Questions Completed',
  exams: 'Exams Taken'
};

const StudyAnalytics = () => {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated: () => redirect('/auth/login'),
  });
  
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('1M');
  const [selectedMetric, setSelectedMetric] = useState<'score' | 'questions' | 'exams'>('score');
  const [statistics, setStatistics] = useState<StudentStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  
  const fetchStatistics = async () => {
    if (!session?.accessToken) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${apiBase}/statistics-average-report`, {
        headers: { 
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setStatistics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
      console.error('Error fetching statistics:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (session?.accessToken) {
      fetchStatistics();
    }
  }, [session?.accessToken]);
  
  const studyData = useMemo(() => {
    if (!statistics) {
      return generateHistoricalData(timeRangeMap[selectedTimeRange], {
        total_exams_taken: 6,
        average_score: "41.67",
        total_questions_answered: "18",
        correct_answer_percentage: "11.11"
      });
    }
    
    return generateHistoricalData(timeRangeMap[selectedTimeRange], statistics);
  }, [selectedTimeRange, statistics]);

  const stats = useMemo(() => {
    if (!statistics) return [];

    return [
      {
        title: "Exams Taken",
        value: statistics.total_exams_taken.toString(),
        subtitle: "Total exams",
        icon: <Book className="w-6 h-6 text-blue-400" />,
      },
      {
        title: "Average Score",
        value: `${statistics.average_score}%`,
        subtitle: "On All Quizzes",
        icon: <Target className="w-6 h-6 text-blue-400" />,
      },
      {
        title: "Questions Answered",
        value: statistics.total_questions_answered,
        subtitle: "On All Quizzes",
        icon: <Brain className="w-6 h-6 text-blue-400" />,
      },
      {
        title: "Question Answer Rate",
        value: `${statistics.correct_answer_percentage}%`,
        subtitle: "Accuracy rate",
        icon: <Clock className="w-6 h-6 text-blue-400" />,
      }
    ];
  }, [statistics]);

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <p className="text-gray-400">Loading statistics...</p>
    </div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-64">
      <p className="text-red-400">Error loading statistics. Please try again later.</p>
    </div>;
  }

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
                onChange={(e) => setSelectedMetric(e.target.value as 'score' | 'questions' | 'exams')}
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