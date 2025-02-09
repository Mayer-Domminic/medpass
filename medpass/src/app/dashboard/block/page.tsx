'use client';

import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight, Heart } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/navbar';
import AnimatedProgressBar from '@/components/nolan-comp/ProgressComponents/AnimatedProgressBar';

interface SubtopicListProps {
  isExpanded: boolean;
  subtopics: {
    id: string;
    title: string;
  }[];
}

const SubtopicList: React.FC<SubtopicListProps> = ({ isExpanded, subtopics }) => {
  return (
    <div className="space-y-4" style={{ opacity: isExpanded ? 1 : 0 }}>
      {subtopics.map((subtopic) => (
        <div key={subtopic.id} className="space-y-2">
          <span className="text-sm text-gray-400">{subtopic.id}</span>
          <p className="text-sm text-gray-300">{subtopic.title}</p>
        </div>
      ))}
    </div>
  );
};

interface TopicProps {
  number: string;
  title: string;
  confidence: number;
  proficiency: number;
  children?: React.ReactElement<SubtopicListProps>;
}

const Topic: React.FC<TopicProps> = ({ 
  number, 
  title, 
  confidence, 
  proficiency,
  children 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-full bg-gray-800 rounded-lg p-4">
      <div 
        className="flex items-center gap-4 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="transition-transform duration-300">
          {isExpanded ? (
            <ChevronDown className="text-gray-400 flex-shrink-0" size={20} />
          ) : (
            <ChevronRight className="text-gray-400 flex-shrink-0" size={20} />
          )}
        </div>
        <span className="text-sm text-gray-400">{number}</span>
        <span className="text-base font-bold text-white flex-grow">{title}</span>

        <div className="flex items-center gap-8 ml-auto">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-gray-400">Confidence</span>
            <AnimatedProgressBar
              value={confidence}
              color="bg-blue-400"
              size="md"
            />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-gray-400">Proficiency</span>
            <AnimatedProgressBar
              value={proficiency}
              color="bg-green-400"
              size="md"
            />
          </div>
        </div>
      </div>

      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[800px]' : 'max-h-0'
        }`}
      >
        <div 
          className={`pl-10 py-4 transition-opacity duration-300 ${
            isExpanded ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {children && React.cloneElement(children, { isExpanded })}
        </div>
      </div>
    </div>
  );
};
// Hard coded suptopics
export default function BlockPage() {
  const topics = [
    {
      number: "1.1",
      title: "Cardiac Anatomy",
      confidence: 85,
      proficiency: 80,
      subtopics: [
        {
          id: "1.1.1",
          title: "Heart Chambers and Walls"
        },
        {
          id: "1.1.2",
          title: "Cardiac Valves"
        },
        {
          id: "1.1.3",
          title: "Coronary Vessels"
        }
      ]
    },
    {
      number: "1.2",
      title: "Cardiac Physiology",
      confidence: 90,
      proficiency: 85,
      subtopics: [
        {
          id: "1.2.1",
          title: "Cardiac Action Potential"
        },
        {
          id: "1.2.2",
          title: "Cardiac Conduction System"
        },
        {
          id: "1.2.3",
          title: "Cardiac Cycle"
        }
      ]
    },
    {
      number: "1.3",
      title: "Cardiac Pathology",
      confidence: 95,
      proficiency: 90,
      subtopics: [
        {
          id: "1.3.1",
          title: "Coronary Artery Disease"
        },
        {
          id: "1.3.2",
          title: "Valvular Heart Disease"
        },
        {
          id: "1.3.3",
          title: "Cardiac Arrhythmias"
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar />
      <div className="pl-[100px] p-6">
        <div className="max-w-7xl mx-auto">
          {/* Block Title */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-rose-500/10">
                <Heart className="w-8 h-8 text-rose-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Block 1: Heart</h1>
                <p className="text-gray-400">Comprehensive study of cardiac systems</p>
              </div>
            </div>
          </div>

          {/* Topics List */}
          <div className="space-y-4">
            {topics.map((topic) => (
              <Topic 
                key={topic.number}
                number={topic.number}
                title={topic.title}
                confidence={topic.confidence}
                proficiency={topic.proficiency}
              >
                <SubtopicList isExpanded={false} subtopics={topic.subtopics} />
              </Topic>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}