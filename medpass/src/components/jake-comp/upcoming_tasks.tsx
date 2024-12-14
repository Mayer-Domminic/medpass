import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Timer, AlertCircle, CheckCircle2 } from "lucide-react";

interface TaskProps {
  title: string;
  date: string;
  type: 'exam' | 'quiz' | 'review' | 'practice';
  timeLeft: string;
  difficulty: 'easy' | 'medium' | 'hard';
  completed?: boolean;
}

const Task = ({ title, date, type, timeLeft, difficulty, completed }: TaskProps) => {
  const getTypeStyles = () => {
    const styles = {
      exam: "text-red-400 bg-red-500/10",
      quiz: "text-yellow-400 bg-yellow-500/10",
      review: "text-blue-400 bg-blue-500/10",
      practice: "text-green-400 bg-green-500/10"
    };
    return styles[type];
  };

  const getDifficultyColor = () => {
    const colors = {
      easy: "bg-green-500/20",
      medium: "bg-yellow-500/20",
      hard: "bg-red-500/20"
    };
    return colors[difficulty];
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
      <div className={`p-2 rounded-lg ${getTypeStyles()}`}>
        {type === 'exam' && <AlertCircle className="w-5 h-5" />}
        {type === 'quiz' && <Timer className="w-5 h-5" />}
        {type === 'review' && <CalendarDays className="w-5 h-5" />}
        {type === 'practice' && <CheckCircle2 className="w-5 h-5" />}
      </div>
      
      <div className="flex-1">
        <h3 className="text-sm font-medium text-white">{title}</h3>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-gray-400">{date}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800">{timeLeft}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor()}`}>
            {difficulty}
          </span>
        </div>
      </div>

      {completed !== undefined && (
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full ${completed ? 'bg-green-400' : 'bg-gray-600'}`} />
        </div>
      )}
    </div>
  );
};

const UpcomingTasks = () => {
  const tasks: TaskProps[] = [
    {
      title: "USMLE Step 1 Practice Exam Block 2",
      date: "Dec 15, 2024",
      type: "exam",
      timeLeft: "2 days left",
      difficulty: "hard"
    },
    {
      title: "Cardiovascular System Review",
      date: "Dec 16, 2024",
      type: "review",
      timeLeft: "3 days left",
      difficulty: "medium"
    },
    {
      title: "Pathology Quiz - Cell Injury",
      date: "Dec 17, 2024",
      type: "quiz",
      timeLeft: "4 days left",
      difficulty: "easy"
    },
    {
      title: "Practice Questions - Biochemistry",
      date: "Dec 18, 2024",
      type: "practice",
      timeLeft: "5 days left",
      difficulty: "medium",
      completed: true
    },
    {
      title: "Anatomy Lab Practical",
      date: "Dec 19, 2024",
      type: "exam",
      timeLeft: "6 days left",
      difficulty: "hard"
    }
  ];

  return (
    <Card className="bg-white/5 border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-white text-lg font-medium">Upcoming Assessments</CardTitle>
        <button className="text-sm text-blue-400 hover:text-blue-300">View All</button>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.map((task, index) => (
          <Task key={index} {...task} />
        ))}
      </CardContent>
    </Card>
  );
};

export default UpcomingTasks;