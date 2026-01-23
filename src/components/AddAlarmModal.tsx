import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Alarm, DayOfWeek, DAYS_LABELS } from '../types';
import { X, Youtube, Clock, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { useVideoHistory } from '../hooks/useVideoHistory';
import { fetchYouTubeTitle } from '../utils/youtube';

interface AddAlarmModalProps {
  onClose: () => void;
  onSave: (alarm: Omit<Alarm, 'id'>) => void;
  onUpdate?: (alarm: Alarm) => void;
  alarm?: Alarm; // If provided, we're editing this alarm
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

const AddAlarmModal: React.FC<AddAlarmModalProps> = ({ onClose, onSave, onUpdate, alarm: editingAlarm }) => {
  const isEditing = !!editingAlarm;

  const [time, setTime] = useState(() => {
    if (editingAlarm) return editingAlarm.time;
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  });

  const currentHour = new Date().getHours();
  const suggestedLabel = useMemo(() => getTimeBasedSuggestion(currentHour), [currentHour]);

  const [label, setLabel] = useState(editingAlarm?.label || '');
  const [videoUrl, setVideoUrl] = useState(editingAlarm?.videoUrl || 'https://www.youtube.com/watch?v=7GlsxNI4LVI');
  const [videoTitle, setVideoTitle] = useState<string | null>(null);
  const [isFetchingTitle, setIsFetchingTitle] = useState(false);
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(() => {
    if (editingAlarm) return editingAlarm.days;
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
    // Always save video to history if URL is valid (use title or fallback)
    if (videoUrl && (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be'))) {
      addVideo(videoUrl, videoTitle || 'YouTube Video');
    }

    const alarmData = {
      time,
      days: selectedDays,
      enabled: editingAlarm?.enabled ?? true,
      videoUrl,
      label: label || suggestedLabel,
    };

    if (isEditing && editingAlarm && onUpdate) {
      onUpdate({ ...alarmData, id: editingAlarm.id });
    } else {
      onSave(alarmData);
    }
    onClose();
  };

  const selectFromHistory = (url: string, title: string) => {
    setVideoUrl(url);
    setVideoTitle(title);
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
              <h2 className="text-lg font-semibold text-body">{isEditing ? 'Edit Alarm' : 'New Alarm'}</h2>
              <p className="text-xs text-gray-500">{isEditing ? editingAlarm?.label || 'Modify your alarm' : suggestedLabel}</p>
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

          {/* Time Input - Custom Dropdowns */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Time</label>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <select
                  value={time.split(':')[0]}
                  onChange={(e) => setTime(`${e.target.value}:${time.split(':')[1]}`)}
                  className="w-full glass text-4xl sm:text-5xl font-mono p-4 rounded-xl border border-borderDim focus:border-primary focus:outline-none text-center text-body appearance-none bg-transparent cursor-pointer"
                  style={{ textAlignLast: 'center' }}
                >
                  {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(hour => (
                    <option key={hour} value={hour} className="text-body bg-white dark:bg-gray-800">{hour}</option>
                  ))}
                </select>
                <div className="absolute top-1/2 -translate-y-1/2 right-2 pointer-events-none text-gray-400 text-xs font-bold">HR</div>
              </div>
              <div className="text-4xl sm:text-5xl font-mono flex items-center text-gray-400">:</div>
              <div className="flex-1 relative">
                <select
                  value={time.split(':')[1]}
                  onChange={(e) => setTime(`${time.split(':')[0]}:${e.target.value}`)}
                  className="w-full glass text-4xl sm:text-5xl font-mono p-4 rounded-xl border border-borderDim focus:border-primary focus:outline-none text-center text-body appearance-none bg-transparent cursor-pointer"
                  style={{ textAlignLast: 'center' }}
                >
                  {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map(minute => (
                    <option key={minute} value={minute} className="text-body bg-white dark:bg-gray-800">{minute}</option>
                  ))}
                </select>
                <div className="absolute top-1/2 -translate-y-1/2 right-2 pointer-events-none text-gray-400 text-xs font-bold">MIN</div>
              </div>
            </div>
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
          <div className="space-y-3">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Youtube size={14} className="text-danger" />
              YouTube Video
            </label>

            {/* Saved Videos Dropdown - Always visible for debugging/verification */}
            <div className="space-y-2">
              <select
                value=""
                onChange={(e) => {
                  const video = videos.find(v => v.url === e.target.value);
                  if (video) {
                    selectFromHistory(video.url, video.title);
                  }
                }}
                className="w-full glass text-sm p-3 rounded-lg border border-borderDim focus:border-primary focus:outline-none text-body bg-white dark:bg-gray-800 cursor-pointer"
                data-testid="video-select"
                disabled={videos.length === 0}
              >
                <option value="" disabled hidden className="bg-white dark:bg-gray-800 text-body">
                  {videos.length > 0 ? `📹 Recent Videos (${videos.length})` : "ℹ️ No saved videos yet"}
                </option>
                {videos.map((video) => (
                  <option key={video.url} value={video.url} className="bg-white dark:bg-gray-800 text-body">
                    {video.title}
                  </option>
                ))}
              </select>
            </div>

            {/* URL Input */}
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder={videos.length > 0 ? "Or paste a new YouTube URL" : "Paste YouTube video URL"}
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
            {isEditing ? 'Save Changes' : 'Set Alarm'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AddAlarmModal;