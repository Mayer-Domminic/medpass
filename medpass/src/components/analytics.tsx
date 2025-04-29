import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Area, AreaChart } from 'recharts';
import { Brain, Clock, Target, Book, ArrowUp, ArrowDown } from 'lucide-react';
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
  exam_dates?: Array<{
    examresultsid: number;
    timestamp: string;
    score: number;
  }>;
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

const generateChartData = (stats: StudentStatistics) => {
  const baseQuestions = parseInt(stats.total_questions_answered) / stats.total_exams_taken;
  const correctPercentage = parseFloat(stats.correct_answer_percentage);
  
  if (stats.exam_dates && stats.exam_dates.length > 0) {
    const sortedDates = [...stats.exam_dates].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    return sortedDates.map((exam, index) => {
      const examLabel = `Exam ${index + 1}`;
      const date = new Date(exam.timestamp);
      const formattedDate = date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      // Weird string issues with the API added type checking
      const examScore = typeof exam.score === 'number' ? exam.score : parseInt(exam.score as unknown as string, 10);
      
      return {
        date: examLabel,
        displayDate: formattedDate,
        timestamp: exam.timestamp,
        score: examScore,
        questions: Math.round(baseQuestions),
        correctPercentage: correctPercentage
      };
    });
  }
  
  // Just in case database decides to blow up
  const data = [];
  const baseScore = parseFloat(stats.average_score);
  
  for (let i = 0; i < stats.total_exams_taken; i++) {
    data.push({
      date: `Exam ${i + 1}`,
      displayDate: "Date not available",
      score: baseScore,
      questions: Math.round(baseQuestions),
      correctPercentage: correctPercentage
    });
  }
  
  return data;
};

const StudyAnalytics = () => {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated: () => redirect('/auth/login'),
  });
  
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
      return generateChartData({
        total_exams_taken: 6,
        average_score: "41.67",
        total_questions_answered: "18",
        correct_answer_percentage: "11.11",
        exam_dates: Array(6).fill(0).map((_, i) => ({
          examresultsid: i + 1,
          timestamp: "1970-01-01T00:00:05Z",
          score: (i + 1) * 10 
        }))
      });
    }
    
    console.log("Statistics data:", statistics);
    const chartData = generateChartData(statistics);
    console.log("Generated chart data:", chartData);
    return chartData;
  }, [statistics]);

  const stats = useMemo(() => {
    if (!statistics) return [];

    return [
      {
        title: "Quizzes Taken",
        value: statistics.total_exams_taken.toString(),
        subtitle: "Total Quizzes",
        icon: <Book className="w-6 h-6 text-blue-400" />,
      },
      {
        title: "Average Score",
        value: `${statistics.average_score}%`,
        subtitle: "All Quizzes",
        icon: <Target className="w-6 h-6 text-blue-400" />,
      },
      {
        title: "Questions Answered",
        value: statistics.total_questions_answered,
        subtitle: "All Quizzes",
        icon: <Brain className="w-6 h-6 text-blue-400" />,
      },
      {
        title: "Correct Answer Rate",
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
            <CardTitle className="text-white">Exam Performance History</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={studyData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
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
                  tick={true}  
                  axisLine={true}  
                  tickLine={false}
                  domain={[0, 'dataMax']}
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#E5E7EB' }}
                  itemStyle={{ color: '#E5E7EB' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length > 0) {
                      return (
                        <div className="p-2 bg-gray-800 border border-gray-700 rounded shadow-lg">
                          <p className="text-gray-200 font-medium">
                            {`${label} (Date taken: ${payload[0].payload.displayDate})`}
                          </p>
                          <p className="text-blue-400">
                            Score: {payload[0].payload.score}%
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  name="Score"
                  stroke="#3B82F6"
                  fillOpacity={1}
                  fill="url(#colorScore)"
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