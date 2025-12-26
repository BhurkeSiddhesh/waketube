import React, { useState, useMemo } from 'react';
import { Alarm, DayOfWeek, DAYS_LABELS } from '../types';
import { X, Youtube, Music2, Clock } from 'lucide-react';
import YouTubeSearchModal from './YouTubeSearchModal';
import clsx from 'clsx';

interface AddAlarmModalProps {
  onClose: () => void;
  onSave: (alarm: Omit<Alarm, 'id'>) => void;
}

// Get time-based label suggestions
const getTimeBasedSuggestion = (hour: number): string => {
  if (hour >= 5 && hour < 7) return "Early Bird Rise";
  if (hour >= 7 && hour < 9) return "Morning Energy";
  if (hour >= 9 && hour < 12) return "Mid-Morning Focus";
  if (hour >= 12 && hour < 14) return "Lunch Break";
  if (hour >= 14 && hour < 17) return "Afternoon Power";
  if (hour >= 17 && hour < 20) return "Evening Wind Down";
  if (hour >= 20 && hour < 23) return "Night Mode";
  return "Late Night Vibes";
};

// Get suggested YouTube searches based on time
const getTimeSuggestions = (hour: number): string[] => {
  if (hour >= 5 && hour < 9) return ["morning music", "wake up songs", "energetic playlist"];
  if (hour >= 9 && hour < 12) return ["focus music", "productivity", "instrumental"];
  if (hour >= 12 && hour < 17) return ["lo-fi beats", "chill music", "afternoon vibes"];
  if (hour >= 17 && hour < 21) return ["relaxing music", "acoustic", "evening chill"];
  return ["calm music", "sleep sounds", "ambient"];
};

const AddAlarmModal: React.FC<AddAlarmModalProps> = ({ onClose, onSave }) => {
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  });

  const currentHour = new Date().getHours();
  const suggestedLabel = useMemo(() => getTimeBasedSuggestion(currentHour), [currentHour]);
  const timeSuggestions = useMemo(() => getTimeSuggestions(currentHour), [currentHour]);

  const [label, setLabel] = useState('');
  const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/watch?v=7GlsxNI4LVI');
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(() => {
    const today = new Date().getDay() as DayOfWeek;
    return [today];
  });
  const [showYouTubeSearch, setShowYouTubeSearch] = useState(false);

  const toggleDay = (day: DayOfWeek) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  const handleYouTubeSelect = (url: string, title: string) => {
    setVideoUrl(url);
    if (!label) {
      setLabel(title.substring(0, 40));
    }
    setShowYouTubeSearch(false);
  };

  const handleSave = () => {
    onSave({
      time,
      days: selectedDays,
      enabled: true,
      videoUrl,
      label: label || suggestedLabel,
    });
    onClose();
  };

  if (showYouTubeSearch) {
    return (
      <YouTubeSearchModal
        onClose={() => setShowYouTubeSearch(false)}
        onSelect={handleYouTubeSelect}
        initialQuery={timeSuggestions[0]}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-0 animate-in fade-in duration-200">
      <div className="glass-strong w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300">

        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-borderDim">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Clock size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-body">New Alarm</h2>
              <p className="text-xs text-gray-500">{suggestedLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-body hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto no-scrollbar">

          {/* Time Input */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full glass text-5xl font-mono p-4 rounded-xl border border-borderDim focus:border-primary focus:outline-none text-center text-body"
            />
          </div>

          {/* Days Selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Repeats</label>
            <div className="flex justify-between gap-1.5">
              {DAYS_LABELS.map((dayLabel, idx) => (
                <button
                  key={idx}
                  onClick={() => toggleDay(idx as DayOfWeek)}
                  className={clsx(
                    "flex-1 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all",
                    selectedDays.includes(idx as DayOfWeek)
                      ? "bg-primary text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-body"
                  )}
                >
                  {dayLabel}
                </button>
              ))}
            </div>
          </div>

          {/* YouTube Search Section */}
          <div className="space-y-3">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Wake-Up Sound</label>

            <button
              onClick={() => setShowYouTubeSearch(true)}
              className="w-full glass p-4 rounded-xl border border-borderDim hover:border-primary/50 transition-all flex items-center gap-4 group"
            >
              <div className="w-11 h-11 rounded-lg bg-danger flex items-center justify-center group-hover:scale-105 transition-transform">
                <Youtube size={22} className="text-white" />
              </div>
              <div className="text-left flex-1">
                <p className="font-medium text-body">Browse YouTube</p>
                <p className="text-xs text-gray-500">Search and select a video</p>
              </div>
            </button>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-2">
              {timeSuggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => setShowYouTubeSearch(true)}
                  className="text-xs px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-primary hover:bg-primary/5 transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Video URL Display */}
          <div className="space-y-2 pt-4 border-t border-borderDim">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Music2 size={12} />
              Selected Video
            </label>
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Paste YouTube URL or search above"
              className="w-full glass text-sm p-3 rounded-lg border border-borderDim focus:border-primary focus:outline-none text-gray-500"
            />
          </div>

          {/* Label Input */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={suggestedLabel}
              className="w-full glass text-sm p-3 rounded-lg border border-borderDim focus:border-primary focus:outline-none text-body placeholder:text-gray-400"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 pt-4 border-t border-borderDim">
          <button
            onClick={handleSave}
            className="w-full bg-primary hover:bg-primary-light text-white font-medium py-3.5 rounded-xl shadow-md shadow-primary/20 transition-all active:scale-[0.98]"
          >
            Set Alarm
          </button>
        </div>

      </div>
    </div>
  );
};

export default AddAlarmModal;