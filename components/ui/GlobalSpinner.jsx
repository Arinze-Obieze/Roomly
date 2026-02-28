import React from 'react';

export default function GlobalSpinner({ 
  size = 'md', 
  color = 'primary',
  className = '' 
}) {
  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  const gapClasses = {
    sm: 'gap-1',
    md: 'gap-1.5',
    lg: 'gap-2',
  };

  // The RoomFind "Signature Dot" principle
  const colorClasses = {
    primary: 'bg-terracotta-500',
    white: 'bg-white',
    slate: 'bg-navy-950',
    teal: 'bg-teal-500', // For matches/success
  };

  const dotClass = `rounded-full ${sizeClasses[size] || sizeClasses.md} ${colorClasses[color] || colorClasses.primary}`;

  return (
    <div className={`flex items-center justify-center ${gapClasses[size] || gapClasses.md} ${className}`}>
      <div className={`${dotClass} animate-bounce`} style={{ animationDelay: '0ms' }} />
      <div className={`${dotClass} animate-bounce`} style={{ animationDelay: '150ms' }} />
      <div className={`${dotClass} animate-bounce`} style={{ animationDelay: '300ms' }} />
    </div>
  );
}
