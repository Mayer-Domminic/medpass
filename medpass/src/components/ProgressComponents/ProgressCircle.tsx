import React, { useState, useEffect } from 'react';

interface TopicQuestion {
  id: string;
  correct: boolean;
  category: 'mastered' | 'learning' | 'needs_review';
}

interface Segment {
  value: number;
  color: string;
  category: 'mastered' | 'learning' | 'needs_review';
  displayName: string;
}

interface TopicQuestion {
  id: string;
  correct: boolean;
  category: 'mastered' | 'learning' | 'needs_review';
}

export interface CircularProgressProps {
  score: number;
  segments: Segment[];
  questions: TopicQuestion[];
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  score,
  segments,
  questions
}) => {
  const [hoveredSegment, setHoveredSegment] = useState<Segment | null>(null);
  const [mounted, setMounted] = useState(false);
  const radius = 85;
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const getQuestionsForCategory = (category: 'mastered' | 'learning' | 'needs_review'): TopicQuestion[] => {
    return questions.filter((q: TopicQuestion) => q.category === category);
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  const createArcPath = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(100, 100, radius, endAngle);
    const end = polarToCartesian(100, 100, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
    
    return [
      'M', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(' ');
  };

  const calculateSegmentAngles = () => {
    if (!segments || segments.length === 0) return [];
    
    let currentAngle = 0;
    const segmentAngles = [];
    const totalValue = segments.reduce((sum, segment) => sum + segment.value, 0);
    
    // Sort segments for consistent color order
    const sortedSegments = [...segments].sort((a, b) => {
      const order = { learning: 0, mastered: 1, needs_review: 2 };
      return order[a.category] - order[b.category];
    });
    
    for (const segment of sortedSegments) {
      const angleSize = (segment.value / totalValue) * 360;
      segmentAngles.push({
        start: currentAngle,
        end: currentAngle + angleSize,
        segment
      });
      currentAngle += angleSize;
    }
    
    return segmentAngles;
  };

  return (
    <div className="relative group">
      <div className="w-64 h-64 relative">
        <svg className="w-full h-full" viewBox="0 0 200 200">
          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.15"/>
            </filter>
          </defs>

          {/* Outer shadow/depth effect */}
          <circle
            cx="100"
            cy="100"
            r={radius + 5}
            className="fill-white shadow-lg"
            filter="url(#shadow)"
          />
          
          {/* Background Circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            className="stroke-gray-100 fill-white"
            strokeWidth="12"
          />
          
          {/* Segments - drawn as one continuous path */}
          {calculateSegmentAngles().map(({start, end, segment}, index) => (
            <path
              key={index}
              d={createArcPath(start, end)}
              fill="none"
              className={`
                ${segment.color} 
                cursor-pointer 
                transition-all
                duration-200
                hover:stroke-[14px]
                hover:brightness-90
              `}
              strokeWidth="12"
              strokeLinecap="butt"
              onMouseEnter={() => setHoveredSegment(segment)}
              onMouseLeave={() => setHoveredSegment(null)}
              style={{
                transition: mounted ? 'all 0.6s ease-out' : 'none'
              }}
            />
          ))}

          {/* Center Text */}
          <text
            x="100"
            y="110"
            textAnchor="middle"
            className="text-6xl font-extrabold fill-gray-900"
          >
            {score}
          </text>
          <text
            x="100"
            y="135"
            textAnchor="middle"
            className="text-sm font-bold fill-gray-600"
          >
            SCORE
          </text>
        </svg>

        {/* Hover Tooltip */}
        {hoveredSegment && (
          <div className={`
            absolute -right-4 top-0 transform translate-x-full 
            bg-white rounded-lg shadow-xl p-4 w-56
            transition-all duration-300 ease-in-out
            border border-gray-100
            backdrop-blur-sm bg-white/90
            z-50
          `}>
            <div className="border-b pb-2 mb-3">
              <div className="font-bold text-lg text-gray-800">
                {hoveredSegment.displayName}
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-gray-500">Coverage</span>
                <span className="text-sm font-semibold text-gray-700">
                  {Math.round((getQuestionsForCategory(hoveredSegment.category).length / questions.length) * 100)}%
                </span>
              </div>
            </div>
            <div className="space-y-2.5">
              {getQuestionsForCategory(hoveredSegment.category).map((question: TopicQuestion, index: number) => (
                <div 
                  key={index} 
                  className={`
                    flex justify-between items-center p-2 rounded-md
                    ${question.correct ? 'bg-green-50' : 'bg-red-50'}
                    transition-colors duration-200
                  `}
                >
                  <span className="text-sm font-medium text-gray-700">Q{question.id}</span>
                  {question.correct ? (
                    <span className="text-green-600">✓</span>
                  ) : (
                    <span className="text-red-600">✗</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CircularProgress;