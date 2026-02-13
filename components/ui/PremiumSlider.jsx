'use client';

import { useState, useRef, useEffect } from 'react';

export default function PremiumSlider({ 
  value, 
  onChange, 
  min = 1, 
  max = 3, 
  step = 1, 
  labels = {}, // { 1: 'Label 1', 2: 'Label 2' }
  icons = {}, // { 1: <Icon1 />, 2: <Icon2 /> }
  className = ''
}) {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const percentage = ((value - min) / (max - min)) * 100;

  const handleInteraction = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const rawValue = (x / rect.width) * (max - min) + min;
    const roundedValue = Math.round(rawValue / step) * step;
    const finalValue = Math.max(min, Math.min(max, roundedValue));
    
    if (finalValue !== value) {
      onChange(finalValue);
    }
  };

  const onMouseDown = (e) => {
    setIsDragging(true);
    handleInteraction(e.clientX);
  };

  const onTouchStart = (e) => {
    setIsDragging(true);
    handleInteraction(e.touches[0].clientX);
  };

  useEffect(() => {
    const onMouseMove = (e) => {
      if (isDragging) handleInteraction(e.clientX);
    };
    const onTouchMove = (e) => {
      if (isDragging) handleInteraction(e.touches[0].clientX);
    };
    const onEnd = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onEnd);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [isDragging]);

  return (
    <div className={`w-full py-2 ${className}`}>
      {/* Label Display */}
      <div className="flex justify-between items-end mb-3 h-8">
        <span className="text-xl transition-all duration-300 transform">
          {icons[value]}
        </span>
        <span className="font-medium text-slate-900 text-sm transition-all duration-300">
          {labels[value]}
        </span>
      </div>

      {/* Slider Track */}
      <div 
        ref={containerRef}
        className="relative h-2 bg-slate-100 rounded-full cursor-pointer touch-none group"
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        {/* Fill */}
        <div 
          className="absolute top-0 left-0 h-full bg-terracotta-500 rounded-full transition-[width] duration-150 ease-out"
          style={{ width: `${percentage}%` }}
        />

        {/* Thumb */}
        <div 
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white border-2 border-terracotta-500 rounded-full shadow-md transform transition-transform duration-150 ease-out flex items-center justify-center hover:scale-110 active:scale-95 z-10 ${isDragging ? 'scale-110' : ''}`}
          style={{ left: `${percentage}%` }}
        >
          <div className="w-1.5 h-1.5 bg-terracotta-500 rounded-full" />
        </div>

        {/* Step Markers */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full flex justify-between px-1 pointer-events-none">
          {Array.from({ length: (max - min) / step + 1 }).map((_, i) => (
            <div key={i} className="w-0.5 h-0.5 bg-slate-300 rounded-full" />
          ))}
        </div>
      </div>
      
      <div className="flex justify-between mt-2 text-xs text-slate-400 font-medium px-1">
        <span>{labels[min]}</span>
        <span>{labels[max]}</span>
      </div>
    </div>
  );
}
