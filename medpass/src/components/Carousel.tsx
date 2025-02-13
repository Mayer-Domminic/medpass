import React, { useState } from 'react';
import { ChevronLeft, ChevronRight} from 'lucide-react';
import CircularProgress, { CircularProgressProps } from './ProgressCircle';
import TopicMasteryOverview from './TopicMastery';

const Carousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const mockTopicData: CircularProgressProps = {
    score: 78,
    segments: [
      { 
        value: 35, 
        color: 'stroke-green-500', 
        category: 'mastered',
        displayName: 'Mastered' 
      },
      { 
        value: 45, 
        color: 'stroke-yellow-500', 
        category: 'learning', 
        displayName: 'Learning' 
      },
      { 
        value: 20, 
        color: 'stroke-red-500', 
        category: 'needs_review', 
        displayName: 'Needs Review' 
      }
    ],
    questions: [
      { id: "1.1", correct: true, category: 'mastered' },
      { id: "1.2", correct: true, category: 'mastered' },
      { id: "1.3", correct: false, category: 'needs_review' },
      { id: "1.4", correct: true, category: 'learning' }
    ]
  };

  const arcData = {
    segments: [
      { value: 75, color: 'stroke-green-500' },
      { value: 25, color: 'stroke-red-500' }
    ],
    label: "Progress",
    sublabel: "Last 30 days",
    total: 100 
  };


  const slides = [
      // Slide 1: Progress Overview
      <div key="progress" className="h-full pt-2">
      <h3 className="text-xl font-semibold text-white mb-3">Progress Overview</h3>
      <div className="flex items-center justify-around">
        <div className="flex-1">
          <CircularProgress {...mockTopicData} />
        </div>
        <div className="flex-1 space-y-4">
          <div className="text-gray-300">
            <h4 className="font-medium mb-2">Key Insights:</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Strong performance in Cardiac Physiology
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                Currently working on Neural Pathways
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                Review needed for Endocrine System
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>,

    // Slide 2: Study Plan
    <TopicMasteryOverview key="mastery" />,

    // Slide 3: Resource Recommendations
    <div key="resources" className="h-full pt-2">
      <h3 className="text-xl font-semibold text-white mb-3">Personalized Resources</h3>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <h4 className="text-white font-medium mb-2">High-Yield Topics</h4>
            <ul className="space-y-2 text-gray-300">
              <li>1. Cardiac Cycle Mechanics</li>
              <li>2. Action Potential Pathways</li>
              <li>3. Hormone Regulation</li>
            </ul>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <h4 className="text-white font-medium mb-2">Recommended Resources</h4>
            <ul className="space-y-2 text-gray-300">
              <li>• First Aid: Chapters 3, 4, 7</li>
              <li>• Pathoma: Sections 1.2, 2.1</li>
              <li>• UWorld: 2 blocks (Cardio)</li>
            </ul>
          </div>
        </div>
        <div className="bg-gray-800/50 p-4 rounded-lg">
          <h4 className="text-white font-medium mb-2">Weekly Goals</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm text-gray-300 mb-1">
                <span>Questions Completed</span>
                <span>280/300</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full">
                <div className="h-2 bg-blue-500 rounded-full" style={{ width: '93%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm text-gray-300 mb-1">
                <span>Study Hours</span>
                <span>24/30</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full">
                <div className="h-2 bg-green-500 rounded-full" style={{ width: '80%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm text-gray-300 mb-1">
                <span>Review Sessions</span>
                <span>8/10</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full">
                <div className="h-2 bg-purple-500 rounded-full" style={{ width: '80%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="relative h-[calc(100%-2rem)] bg-gray-800 rounded-lg">
      <div className="absolute inset-0 px-16">
        {slides[currentSlide]}
      </div>
      
      <button 
        onClick={prevSlide}
        className="absolute -left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors z-10"
      >
        <ChevronLeft className="h-6 w-6 text-gray-300" />
      </button>
      
      <button 
        onClick={nextSlide}
        className="absolute -right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors z-10"
      >
        <ChevronRight className="h-6 w-6 text-gray-300" />
      </button>
      
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <div 
            key={index}
            className={`h-2 w-2 rounded-full transition-colors ${
              currentSlide === index ? 'bg-blue-400' : 'bg-gray-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default Carousel;