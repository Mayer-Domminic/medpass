import React from 'react';

const ProgressBar = ({ 
  value = 50, 
  max = 100, 
  color = "bg-blue-500",
  className = "",
  showPercentage = true
}) => {
  const progressPercentage = Math.min(Math.max(value, 0), max);
  const percentageDisplay = Math.round((progressPercentage / max) * 100);

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 ${className}`}>
        <div 
          className={`h-2.5 rounded-full ${color}`} 
          style={{ width: `${percentageDisplay}%` }}
        ></div>
      </div>
      {showPercentage && (
        <span className="text-sm text-gray-500">{`${percentageDisplay}%`}</span>
      )}
    </div>
  );
};

export default ProgressBar;