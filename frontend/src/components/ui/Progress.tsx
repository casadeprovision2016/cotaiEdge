'use client';

import React from 'react';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
}

export const Progress: React.FC<ProgressProps> = ({ 
  value, 
  max = 100, 
  className = '',
  indicatorClassName = ''
}) => {
  const percentage = Math.min(Math.max(value, 0), max);
  
  return (
    <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${className}`}>
      <div 
        className={`h-full bg-blue-600 rounded-full transition-all duration-500 ease-out ${indicatorClassName}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};