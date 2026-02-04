import React from 'react';
import { Alarm, DAYS_LABELS, DayOfWeek } from '../types';
import { Trash2, Play, Pencil } from 'lucide-react';
import clsx from 'clsx';

interface AlarmCardProps {
  alarm: Alarm;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (alarm: Alarm) => void;
}

const AlarmCard: React.FC<AlarmCardProps> = ({ alarm, onToggle, onDelete, onEdit }) => {
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
      "glass relative overflow-hidden rounded-2xl p-5 transition-all duration-300",
      alarm.enabled
        ? "shadow-lg shadow-primary/10 border-primary/20"
        : "opacity-60"
    )}>
      {/* Accent line */}
      <div className={clsx(
        "absolute top-0 left-0 w-1 h-full rounded-l-2xl transition-opacity",
        alarm.enabled
          ? "bg-primary opacity-100"
          : "opacity-0"
      )} />

      <div className="flex justify-between items-start pl-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className={clsx(
              "text-4xl font-mono font-bold tracking-tighter transition-colors",
              alarm.enabled ? "text-body" : "text-gray-400"
            )}>
              {time}
            </span>
            <span className={clsx(
              "text-lg font-medium",
              alarm.enabled ? "text-primary" : "text-gray-500"
            )}>
              {ampm}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1 truncate">{alarm.label || 'Alarm'}</p>
          {alarm.videoUrl && (
            <a
              href={alarm.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary mt-2 hover:text-primary-light transition-colors bg-primary/5 px-2.5 py-1 rounded-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
              onClick={(e) => e.stopPropagation()}
              aria-label="Preview video (opens in a new tab)"
            >
              <Play size={10} className="fill-current" />
              <span>Preview</span>
            </a>
          )}
        </div>

        <div className="flex flex-col items-end gap-3">
          {/* Toggle Switch */}
          <label
            className="relative inline-flex items-center cursor-pointer"
            title={alarm.enabled ? "Disable Alarm" : "Enable Alarm"}
          >
            <input
              type="checkbox"
              className="sr-only peer"
              checked={alarm.enabled}
              onChange={() => onToggle(alarm.id)}
              aria-label={`Toggle alarm for ${time} ${ampm}`}
            />
            <div className={clsx(
              "w-12 h-7 rounded-full peer transition-all duration-300 peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface",
              "after:content-[''] after:absolute after:top-[3px] after:left-[3px]",
              "after:bg-white after:rounded-full after:h-[22px] after:w-[22px] after:transition-all after:shadow-md",
              "peer-checked:after:translate-x-5",
              alarm.enabled
                ? "bg-primary shadow-md shadow-primary/20"
                : "bg-gray-300 dark:bg-gray-600"
            )}></div>
          </label>

          <div className="flex gap-1">
            <button
              onClick={() => onEdit(alarm)}
              className="text-gray-400 hover:text-primary hover:bg-primary/10 transition-all p-2 rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
              data-testid="edit-alarm"
              aria-label={`Edit alarm for ${time} ${ampm}`}
              title="Edit Alarm"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={() => onDelete(alarm.id)}
              className="text-gray-400 hover:text-danger hover:bg-danger/10 transition-all p-2 rounded-lg focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
              data-testid="delete-alarm"
              aria-label={`Delete alarm for ${time} ${ampm}`}
              title="Delete Alarm"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Days Row */}
      <div className="flex gap-1.5 mt-4 pl-3">
        {DAYS_LABELS.map((label, idx) => {
          const isSelected = alarm.days.includes(idx as DayOfWeek);
          return (
            <div
              key={idx}
              className={clsx(
                "flex-1 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-all",
                isSelected
                  ? "bg-primary text-white"
                  : "bg-gray-100 dark:bg-gray-800/50 text-gray-500"
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