import React from 'react';

interface AnimatedProgressBarProps {
  value: number;
  color: string;
  label?: string;
  size?: 'sm' | 'md';
  isAnimated?: boolean;
  animationDelay?: string;
  animationKey?: number;
  className?: string;
}

const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  value,
  color,
  label,
  size = 'md',
  isAnimated = false,
  animationDelay = '0s',
  animationKey,
  className = '',
}) => {
  const barHeight = size === 'sm' ? 'h-1.5' : 'h-2';
  const labelSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const width = size === 'sm' ? 'w-full' : 'w-32';

  // Determine the initial width based on whether it's animated
  const initialWidth = isAnimated ? '0%' : `${value}%`;
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && (
        <span className={`${labelSize} text-gray-500 ${size === 'sm' ? 'w-8' : ''}`}>
          {label}
        </span>
      )}
      <div className={`${width} ${barHeight} bg-gray-100 rounded-full overflow-hidden`}>
        <div
          className={`${barHeight} ${color} rounded-full`}
          style={isAnimated ? {
            width: initialWidth,
            animationName: 'growWidth',
            animationDuration: '0.6s',
            animationTimingFunction: 'ease-out',
            animationDelay,
            animationFillMode: 'forwards',
            '--final-width': `${value}%`,
          } as React.CSSProperties : {
            width: initialWidth,
            transition: 'width 0.6s ease-out',
          } as React.CSSProperties}
          key={animationKey}
        />
      </div>
      {!label && <span className={`${labelSize} text-gray-500`}>{value}%</span>}
    </div>
  );
};

export default AnimatedProgressBar;