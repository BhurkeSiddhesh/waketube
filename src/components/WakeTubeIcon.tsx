import React from 'react';

export const WakeTubeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 40 40" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
  >
    {/* Background Gradient Container */}
    <rect width="40" height="40" rx="10" fill="url(#gradient_waketube)" />
    
    {/* Play Button Triangle */}
    <path 
      d="M26 20L16 13V27L26 20Z" 
      fill="white" 
      stroke="white" 
      strokeWidth="2" 
      strokeLinejoin="round" 
    />
    
    {/* Alarm Ringing / Sun Ray Lines */}
    <path d="M10 10C8 13 8 16 9 19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6" />
    <path d="M30 10C32 13 32 16 31 19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6" />
    <path d="M20 7V5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.8" />
    
    <defs>
      <linearGradient id="gradient_waketube" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f43f5e" /> {/* Primary Rose */}
        <stop offset="1" stopColor="#6366f1" /> {/* Secondary Indigo */}
      </linearGradient>
    </defs>
  </svg>
);

export default WakeTubeIcon;