import React, { useState, useEffect } from 'react';
import { BatteryCharging, AlertTriangle, Smartphone } from 'lucide-react';

interface ClockDisplayProps {
  isNativeMode: boolean;
}

const ClockDisplay: React.FC<ClockDisplayProps> = ({ isNativeMode }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="glass-strong rounded-3xl p-8 mb-6 flex flex-col items-center justify-center shadow-xl">
      <div className="text-[5rem] sm:text-[7rem] font-black font-mono leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-body via-body to-gray-500/50 select-none">
        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
      </div>
      <div className="text-lg font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-2">
        {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-green-500 bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20 backdrop-blur-sm">
          <BatteryCharging size={14} />
          <span>Active & Monitoring</span>
        </div>

        {isNativeMode ? (
          <div className="flex items-center gap-2 text-xs font-medium text-blue-400 bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20 backdrop-blur-sm">
            <Smartphone size={14} />
            <span>Background alarms enabled</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-medium text-orange-400 bg-orange-500/10 px-4 py-2 rounded-full border border-orange-500/20 backdrop-blur-sm">
            <AlertTriangle size={14} />
            <span>Keep tab open</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClockDisplay;
