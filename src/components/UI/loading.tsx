import React, { useState, useEffect } from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  text?: string;
  showText?: boolean;
  duration?: number;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'blue',
  text = 'Loading...',
  showText = true,
  duration = 1500,
}) => {
  const [dots, setDots] = useState('');
  
  // Size mapping
  const sizeMap = {
    sm: {
      spinner: 'h-8 w-8',
      text: 'text-sm',
      container: 'gap-2',
    },
    md: {
      spinner: 'h-12 w-12',
      text: 'text-base',
      container: 'gap-3',
    },
    lg: {
      spinner: 'h-16 w-16',
      text: 'text-lg',
      container: 'gap-4',
    },
  };
  
  // Color mapping
  const colorMap: Record<string, string> = {
    blue: 'border-blue-500',
    red: 'border-red-500',
    green: 'border-green-500',
    yellow: 'border-yellow-500',
    purple: 'border-purple-500',
    gray: 'border-gray-500',
  };
  
  // Border color
  const borderColor = colorMap[color] || colorMap.blue;
  
  // Animate dots for the loading text
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  // Animated progress bar
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    let animationFrame: number;
    let startTime: number;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsedTime = timestamp - startTime;
      const newProgress = Math.min(elapsedTime / duration, 1);
      
      setProgress(newProgress);
      
      if (newProgress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        // Reset the animation when it completes
        startTime = timestamp;
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [duration]);
  
  return (
    <div className="flex flex-col items-center justify-center my-40">
      <div className={`flex flex-col items-center ${sizeMap[size].container}`}>
        {/* Spinner */}
        <div className="relative">
          <div className={`${sizeMap[size].spinner} rounded-full border-2 border-gray-200`}></div>
          <div 
            className={`absolute top-0 left-0 ${sizeMap[size].spinner} rounded-full border-t-2 ${borderColor} animate-spin`}
          ></div>
        </div>
        
        {/* Loading text */}
        {showText && (
          <div className={`${sizeMap[size].text} font-medium text-gray-700`}>
            {text.split('.')[0]}{dots}
          </div>
        )}
      </div>
      
      {/* Progress bar */}
      <div className="w-full mt-4 bg-gray-200 rounded-full h-1 max-w-xs">
        <div 
          className={`h-1 rounded-full ${color === 'blue' ? 'bg-blue-500' : `bg-${color}-500`}`}
          style={{ width: `${progress * 100}%` }}
        ></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;