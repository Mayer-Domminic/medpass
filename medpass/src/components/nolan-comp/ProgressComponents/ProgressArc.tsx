import React, { useState, useEffect } from 'react';

interface Segment {
  value: number;
  color: string;
}

interface ProgressArcProps {
  segments: Segment[];
  label: string;
  sublabel: string;
  total?: number;
}

const ProgressArc = ({ 
  segments = [],
  label = '',
  sublabel = '',
  total = 100
}: ProgressArcProps) => {
  const [mounted, setMounted] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const radius = 80;
  const strokeWidth = 12;

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 180) * Math.PI / 180.0;
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
    
    for (const segment of segments) {
      const angleSize = (segment.value / (total || totalValue)) * 180;
      segmentAngles.push({
        start: currentAngle,
        end: currentAngle + angleSize,
        color: segment.color
      });
      currentAngle += angleSize;
    }
    
    return segmentAngles;
  };

  const totalValue = segments.reduce((sum, segment) => sum + segment.value, 0);

  return (
    <div className="relative w-64 h-48 flex flex-col items-center">
      <svg className="w-full h-full" viewBox="0 0 200 150">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.15"/>
          </filter>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feFlood floodColor="white" floodOpacity="0.8"/>
            <feComposite in2="blur" operator="in"/>
            <feComposite in="SourceGraphic"/>
          </filter>
        </defs>

        {/* Outer shadow for depth */}
        <path
          d="M 20 100 A 80 80 0 1 1 180 100"
          fill="none"
          className="stroke-gray-100"
          strokeWidth={strokeWidth + 2}
          filter="url(#shadow)"
        />

        {/* White background glow */}
        <path
          d="M 20 100 A 80 80 0 1 1 180 100"
          fill="none"
          className="stroke-white"
          strokeWidth={strokeWidth}
          filter="url(#glow)"
        />
        
        {/* Background Arc */}
        <path
          d="M 20 100 A 80 80 0 1 1 180 100"
          fill="none"
          className="stroke-gray-100"
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
        />
        
        {/* Segments */}
        {calculateSegmentAngles().map((segment, index) => (
          <path
            key={index}
            d={createArcPath(segment.start, segment.end)}
            fill="none"
            className={`
              ${segment.color}
              cursor-pointer 
              transition-all
              duration-200
              hover:stroke-[14px]
              hover:brightness-90
            `}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{
              transition: mounted ? 'all 0.6s ease-out' : 'none'
            }}
          />
        ))}

        {/* Center Background */}
        <circle
          cx="100"
          cy="100"
          r="45"
          className="fill-white"
        />

        {/* Value Text */}
        <text
          x="100"
          y="95"
          textAnchor="middle"
          className="text-5xl font-extrabold fill-gray-900"
        >
          {Math.round(totalValue)}
        </text>
        
        {/* Label */}
        <text
          x="100"
          y="115"
          textAnchor="middle"
          className="text-sm font-bold fill-gray-600"
        >
          {label}
        </text>
        
        {/* Sublabel */}
        <text
          x="100"
          y="130"
          textAnchor="middle"
          className="text-xs font-bold fill-gray-500"
        >
          {sublabel}
        </text>
      </svg>
    </div>
  );
};

export default ProgressArc;