import React from 'react';

export const WakeTubeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Background with Google gradient */}
    <rect width="40" height="40" rx="10" fill="url(#gradient_waketube)" />

    {/* Play Button Triangle */}
    <path
      d="M26 20L16 13V27L26 20Z"
      fill="white"
      stroke="white"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />

    {/* Alarm Ringing Lines */}
    <path d="M10 10C8 13 8 16 9 19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.7" />
    <path d="M30 10C32 13 32 16 31 19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.7" />
    <path d="M20 7V5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.9" />

    <defs>
      <linearGradient id="gradient_waketube" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4285F4" /> {/* Google Blue */}
        <stop offset="1" stopColor="#34A853" /> {/* Google Green */}
      </linearGradient>
    </defs>
  </svg>
);

export default WakeTubeIcon;