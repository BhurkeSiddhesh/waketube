import React, { useState } from 'react';
import { Alarm, DayOfWeek, DAYS_LABELS } from '../types';
import { X, Search, Sparkles, Loader2, Music2 } from 'lucide-react';
import { suggestMusicVideo } from '../services/geminiService';
import clsx from 'clsx';

interface AddAlarmModalProps {
  onClose: () => void;
  onSave: (alarm: Omit<Alarm, 'id'>) => void;
}

const AddAlarmModal: React.FC<AddAlarmModalProps> = ({ onClose, onSave }) => {
  const [time, setTime] = useState('07:00');
  const [label, setLabel] = useState('Toccata and Fugue - Bach');
  const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/watch?v=7GlsxNI4LVI'); // Default Toccata and Fugue
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([0, 1, 2, 3, 4, 5, 6]); // Every day default
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const toggleDay = (day: DayOfWeek) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  const handleAISearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const result = await suggestMusicVideo(searchQuery);
    setIsSearching(false);

    if (result) {
      setVideoUrl(result.url);
      setLabel(result.title.substring(0, 30)); // Update label to song name
    } else {
      // If result is null, it might be due to missing API key or no results.
      // We can optionally alert the user or just do nothing (letting them paste manually).
      // For now, let's just log a warning to console and maybe clear the query to indicate failure visually?
      // Or better, set a placeholder message in the search box?
      // Given the requirement for "free mode", failing silently or with a log is safer than crashing.
      console.warn("AI Search returned no results or is disabled (missing API key).");
      alert("AI Search is unavailable (requires API Key). Please paste a YouTube URL below.");
    }
  };

  const handleSave = () => {
    onSave({
      time,
      days: selectedDays,
      enabled: true,
      videoUrl,
      label,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-0 animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-md rounded-2xl border border-borderDim shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-borderDim bg-darker/5">
          <h2 className="text-xl font-bold text-body">New Alarm</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-body transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto no-scrollbar">
          
          {/* Time Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Time</label>
            <input 
              type="time" 
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-darker text-4xl sm:text-5xl font-mono p-4 rounded-xl border-2 border-borderDim focus:border-primary focus:outline-none text-center text-body transition-colors"
            />
          </div>

          {/* Days Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Repeats</label>
            <div className="flex justify-between gap-1">
              {DAYS_LABELS.map((label, idx) => (
                <button
                  key={idx}
                  onClick={() => toggleDay(idx as DayOfWeek)}
                  className={clsx(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                    selectedDays.includes(idx as DayOfWeek)
                      ? "bg-secondary text-white shadow-lg shadow-secondary/20 scale-105"
                      : "bg-darker text-gray-500 hover:bg-black/5 dark:hover:bg-white/5"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Music Finder */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={12} />
              AI Music Finder
            </label>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="e.g. 'Epic Hans Zimmer' or '90s Rock'" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAISearch(e)}
                className="flex-1 bg-darker text-sm p-3 rounded-lg border border-borderDim focus:border-secondary focus:outline-none text-body placeholder:text-gray-500"
              />
              <button 
                onClick={handleAISearch}
                disabled={isSearching || !searchQuery}
                className="bg-secondary/10 hover:bg-secondary/20 text-secondary p-3 rounded-lg border border-secondary/50 transition-colors disabled:opacity-50"
              >
                {isSearching ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
              </button>
            </div>
          </div>

          {/* Video URL & Label */}
          <div className="space-y-4 pt-4 border-t border-borderDim">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">YouTube URL</label>
              <div className="relative">
                <Music2 className="absolute left-3 top-3 text-gray-500" size={16} />
                <input 
                  type="text" 
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full bg-darker text-sm p-3 pl-10 rounded-lg border border-borderDim focus:border-primary focus:outline-none text-gray-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Label</label>
              <input 
                type="text" 
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full bg-darker text-sm p-3 rounded-lg border border-borderDim focus:border-primary focus:outline-none text-body"
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-borderDim bg-darker/5">
          <button 
            onClick={handleSave}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] uppercase tracking-widest text-sm"
          >
            Set Alarm
          </button>
        </div>

      </div>
    </div>
  );
};

export default AddAlarmModal;