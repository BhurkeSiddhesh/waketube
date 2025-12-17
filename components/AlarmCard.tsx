import React from 'react';
import { Alarm, DAYS_LABELS, DayOfWeek } from '../types';
import { Trash2, ExternalLink } from 'lucide-react';
import clsx from 'clsx';

interface AlarmCardProps {
  alarm: Alarm;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const AlarmCard: React.FC<AlarmCardProps> = ({ alarm, onToggle, onDelete }) => {
  const formatTime = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hours = h % 12 || 12;
    return {
      time: `${hours}:${m.toString().padStart(2, '0')}`,
      ampm
    };
  };

  const { time, ampm } = formatTime(alarm.time);

  return (
    <div className={clsx(
      "relative overflow-hidden rounded-2xl p-5 mb-4 transition-all duration-300 border",
      alarm.enabled 
        ? "bg-surface border-primary/30 shadow-lg shadow-primary/5" 
        : "bg-surface/50 border-borderDim opacity-70"
    )}>
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-baseline gap-2">
            <span className={clsx("text-4xl font-mono font-bold tracking-tighter transition-colors", alarm.enabled ? "text-body" : "text-gray-400")}>
              {time}
            </span>
            <span className={clsx("text-lg font-bold", alarm.enabled ? "text-primary" : "text-gray-500")}>
              {ampm}
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-1 truncate max-w-[200px]">{alarm.label || 'Alarm'}</p>
          {alarm.videoUrl && (
            <a 
              href={alarm.videoUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-secondary mt-1 hover:text-secondary/80"
              onClick={(e) => e.stopPropagation()}
              aria-label={`Open video: ${alarm.label || 'Alarm video'}`}
            >
              <ExternalLink size={10} />
              <span>Video Link</span>
            </a>
          )}
        </div>
        
        <div className="flex flex-col items-end gap-4">
           {/* Toggle Switch */}
           <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={alarm.enabled}
              onChange={() => onToggle(alarm.id)}
              aria-label={alarm.enabled ? "Disable alarm" : "Enable alarm"}
            />
            <div className="w-11 h-6 bg-gray-300 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
          
          <button 
            onClick={() => onDelete(alarm.id)}
            className="text-gray-400 hover:text-red-400 transition-colors p-2 -mr-2"
            aria-label="Delete alarm"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="flex gap-1 mt-4">
        {DAYS_LABELS.map((label, idx) => {
          const isSelected = alarm.days.includes(idx as DayOfWeek);
          return (
            <div 
              key={idx}
              className={clsx(
                "flex-1 h-8 flex items-center justify-center rounded-md text-xs font-bold transition-colors",
                isSelected 
                  ? "bg-body text-darker" // Inverted contrast: dark text on light, white text on dark
                  : "bg-darker/10 dark:bg-darker/50 text-gray-500"
              )}
            >
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AlarmCard;