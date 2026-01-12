import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Alarm, DayOfWeek, DAYS_LABELS } from '../types';
import { X, Youtube, Clock, Loader2, History, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { useVideoHistory } from '../hooks/useVideoHistory';
import { fetchYouTubeTitle } from '../utils/youtube';

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

const AddAlarmModal: React.FC<AddAlarmModalProps> = ({ onClose, onSave }) => {
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  });

  const currentHour = new Date().getHours();
  const suggestedLabel = useMemo(() => getTimeBasedSuggestion(currentHour), [currentHour]);

  const [label, setLabel] = useState('');
  const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/watch?v=7GlsxNI4LVI');
  const [videoTitle, setVideoTitle] = useState<string | null>(null);
  const [isFetchingTitle, setIsFetchingTitle] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(() => {
    const today = new Date().getDay() as DayOfWeek;
    return [today];
  });

  const { videos, addVideo, removeVideo } = useVideoHistory();

  // Fetch title when URL changes (debounced)
  const fetchTitle = useCallback(async (url: string) => {
    if (!url || (!url.includes('youtube.com') && !url.includes('youtu.be'))) {
      setVideoTitle(null);
      return;
    }

    setIsFetchingTitle(true);
    const title = await fetchYouTubeTitle(url);
    setVideoTitle(title);
    setIsFetchingTitle(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTitle(videoUrl);
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [videoUrl, fetchTitle]);

  const toggleDay = (day: DayOfWeek) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  const handleSave = () => {
    // Save video to history if we have a title
    if (videoTitle && videoUrl) {
      addVideo(videoUrl, videoTitle);
    }

    onSave({
      time,
      days: selectedDays,
      enabled: true,
      videoUrl,
      label: label || suggestedLabel,
    });
    onClose();
  };

  const selectFromHistory = (url: string, title: string) => {
    setVideoUrl(url);
    setVideoTitle(title);
    setShowHistory(false);
  };

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
                  data-testid={`day-toggle-${idx}`}
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

          {/* YouTube URL Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Youtube size={14} className="text-danger" />
                YouTube URL
              </label>
              {videos.length > 0 && (
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className={clsx(
                    "text-xs flex items-center gap-1 px-2 py-1 rounded-md transition-all",
                    showHistory
                      ? "bg-primary text-white"
                      : "text-gray-500 hover:text-body hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                  data-testid="history-toggle"
                >
                  <History size={12} />
                  Recent
                </button>
              )}
            </div>

            {/* Recently Used Videos Dropdown */}
            {showHistory && videos.length > 0 && (
              <div className="glass rounded-lg border border-borderDim max-h-32 overflow-y-auto" data-testid="video-history">
                {videos.map((video) => (
                  <div
                    key={video.url}
                    className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer group"
                  >
                    <button
                      onClick={() => selectFromHistory(video.url, video.title)}
                      className="flex-1 text-left text-sm text-body truncate pr-2"
                      data-testid="history-item"
                    >
                      {video.title}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeVideo(video.url);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-danger transition-all p-1 rounded"
                      data-testid="remove-history-item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Paste YouTube video URL"
              className="w-full glass text-sm p-3 rounded-lg border border-borderDim focus:border-primary focus:outline-none text-body placeholder:text-gray-400"
            />

            {/* Title Display */}
            <div className="flex items-center gap-2 min-h-[20px]">
              {isFetchingTitle ? (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Loader2 size={12} className="animate-spin" />
                  Fetching title...
                </div>
              ) : videoTitle ? (
                <p className="text-xs text-primary truncate" data-testid="video-title">
                  📺 {videoTitle}
                </p>
              ) : (
                <p className="text-xs text-gray-400">
                  Paste any YouTube video link to use as your alarm sound
                </p>
              )}
            </div>
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