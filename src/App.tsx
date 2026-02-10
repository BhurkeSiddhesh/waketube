import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Moon, Sun, Sparkles } from 'lucide-react';
import { Alarm, DayOfWeek } from './types';
import AlarmCard from './components/AlarmCard';
import ClockDisplay from './components/ClockDisplay';
import AddAlarmModal from './components/AddAlarmModal';
import AlarmTrigger from './components/AlarmTrigger';
import WakeTubeIcon from './components/WakeTubeIcon';
import { v4 as uuidv4 } from 'uuid';
import { AlarmScheduler, onAlarmTriggered } from './plugins/AlarmScheduler';

const generateId = () => uuidv4();

/**
 * Calculate the next trigger timestamp for an alarm
 */
const calculateNextTrigger = (time: string, days: DayOfWeek[]): number => {
  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();

  // Try each day starting from today
  for (let daysAhead = 0; daysAhead < 7; daysAhead++) {
    const target = new Date(now);
    target.setDate(target.getDate() + daysAhead);
    target.setHours(hours, minutes, 0, 0);

    const dayOfWeek = target.getDay() as DayOfWeek;

    // Check if this day is enabled and the time is in the future
    if (days.includes(dayOfWeek) && target.getTime() > now.getTime()) {
      return target.getTime();
    }
  }

  // If no valid day found within a week, schedule for next occurrence
  // (this shouldn't happen with valid input)
  return now.getTime() + 24 * 60 * 60 * 1000;
};

const App: React.FC = () => {
  const [alarms, setAlarms] = useState<Alarm[]>(() => {
    const saved = localStorage.getItem('waketube-alarms');
    return saved ? JSON.parse(saved) : [];
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);
  const [activeAlarms, setActiveAlarms] = useState<Alarm[]>([]);

  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const savedTheme = localStorage.getItem('waketube-theme');
    return (savedTheme as 'dark' | 'light') || 'dark';
  });

  // Track alarms that have already rung this minute
  const [triggeredThisMinute, setTriggeredThisMinute] = useState<string[]>([]);

  // Track if running in native mode (background alarms supported)
  const [isNativeMode, setIsNativeMode] = useState(false);

  // Initialize native mode detection (no permission requests on startup)
  useEffect(() => {
    const isNative = AlarmScheduler.isNativeMode();
    setIsNativeMode(isNative);
    console.log('[App] Native mode:', isNative, 'Platform:', AlarmScheduler.getPlatform());
  }, []);

  // Listen for native alarm triggers
  useEffect(() => {
    const cleanup = onAlarmTriggered((event) => {
      console.log('[App] Native alarm triggered:', event.alarmId);

      // Find the alarm and trigger it
      const alarm = alarms.find(a => a.id === event.alarmId);
      if (alarm && !activeAlarms.some(a => a.id === alarm.id)) {
        setActiveAlarms(prev => [...prev, alarm]);
      }
    });

    return cleanup;
  }, [alarms, activeAlarms]);

  // Persist alarms
  useEffect(() => {
    localStorage.setItem('waketube-alarms', JSON.stringify(alarms));
  }, [alarms]);

  // Persist and Apply Theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('waketube-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  // Wake Lock API
  useEffect(() => {
    const requestWakeLock = async () => {
      if (!navigator.wakeLock) return;

      try {
        await navigator.wakeLock.request('screen');
        console.debug('Screen Wake Lock active');
      } catch (err: any) {
        const msg = err.message || '';
        const isPolicyError = msg.includes('permissions policy') || err.name === 'NotAllowedError';

        if (isPolicyError) {
          return;
        }

        if (err.name !== 'AbortError') {
          console.warn('Wake Lock request failed:', err);
        }
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Clock & Alarm Checker
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();

      const currentDay = now.getDay() as DayOfWeek;
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;

      // Reset triggered list if minute changed
      const seconds = now.getSeconds();
      if (seconds === 0) {
        setTriggeredThisMinute([]);
      }

      // Check alarms
      const matchingAlarms = alarms.filter(a => {
        return (
          a.enabled &&
          a.time === timeString &&
          a.days.includes(currentDay) &&
          !triggeredThisMinute.includes(a.id) &&
          !activeAlarms.some(active => active.id === a.id)
        );
      });

      if (matchingAlarms.length > 0) {
        setActiveAlarms(prev => [...prev, ...matchingAlarms]);
        setTriggeredThisMinute(prev => [...prev, ...matchingAlarms.map(a => a.id)]);
      }

    }, 1000);

    return () => clearInterval(timer);
  }, [alarms, activeAlarms, triggeredThisMinute]);

  const addAlarm = useCallback(async (newAlarmData: Omit<Alarm, 'id'>) => {
    const id = generateId();
    const nextTriggerMs = newAlarmData.enabled
      ? calculateNextTrigger(newAlarmData.time, newAlarmData.days)
      : undefined;

    const newAlarm: Alarm = { ...newAlarmData, id, nextTriggerMs };
    setAlarms(prev => [...prev, newAlarm]);

    // Schedule with native alarm manager
    if (newAlarmData.enabled && nextTriggerMs) {
      await AlarmScheduler.scheduleAlarm({
        id,
        timestampMs: nextTriggerMs,
        label: newAlarmData.label,
        youtubeUrl: newAlarmData.videoUrl,
      });
    }
  }, []);

  const toggleAlarm = useCallback(async (alarm: Alarm) => {
    // No need to find the alarm, we have it
    const newEnabled = !alarm.enabled;
    const nextTriggerMs = newEnabled
      ? calculateNextTrigger(alarm.time, alarm.days)
      : undefined;

    setAlarms(prev => prev.map(a => a.id === alarm.id ? { ...a, enabled: newEnabled, nextTriggerMs } : a));

    if (newEnabled && nextTriggerMs) {
      await AlarmScheduler.scheduleAlarm({
        id: alarm.id,
        timestampMs: nextTriggerMs,
        label: alarm.label,
        youtubeUrl: alarm.videoUrl,
      });
    } else {
      await AlarmScheduler.cancelAlarm(alarm.id);
    }
  }, []);

  const deleteAlarm = useCallback(async (id: string) => {
    setAlarms(prev => prev.filter(a => a.id !== id));
    await AlarmScheduler.cancelAlarm(id);
  }, []);

  const dismissAlarm = useCallback((id: string) => {
    setActiveAlarms(prev => prev.filter(a => a.id !== id));
  }, []);

  const updateAlarm = useCallback(async (updatedAlarm: Alarm) => {
    const nextTriggerMs = updatedAlarm.enabled
      ? calculateNextTrigger(updatedAlarm.time, updatedAlarm.days)
      : undefined;

    const alarmWithTrigger = { ...updatedAlarm, nextTriggerMs };
    setAlarms(prev => prev.map(a => a.id === updatedAlarm.id ? alarmWithTrigger : a));

    // Cancel old alarm and schedule new one if enabled
    await AlarmScheduler.cancelAlarm(updatedAlarm.id);

    if (updatedAlarm.enabled && nextTriggerMs) {
      await AlarmScheduler.scheduleAlarm({
        id: updatedAlarm.id,
        timestampMs: nextTriggerMs,
        label: updatedAlarm.label,
        youtubeUrl: updatedAlarm.videoUrl,
      });
    }
  }, []);

  const openEditModal = useCallback((alarm: Alarm) => {
    setEditingAlarm(alarm);
    setIsAddModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsAddModalOpen(false);
    setEditingAlarm(null);
  }, []);

  return (
    <div className="min-h-screen bg-transparent text-body font-sans relative flex flex-col">

      {/* Floating Orbs Background - Subtle */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-[100px] animate-float"></div>
        <div className="absolute bottom-40 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: '-3s' }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col p-4 sm:p-6 max-w-2xl mx-auto w-full">

        {/* Header - Glass Effect */}
        <header className="glass rounded-2xl px-5 py-4 mb-6 flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-3">
            <WakeTubeIcon className="w-10 h-10 drop-shadow-lg" />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-body">WakeTube</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">YouTube Alarm Clock</p>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="glass w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:text-body hover:scale-105 active:scale-95"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </header>

        {/* Hero Clock - Isolated Component */}
        <ClockDisplay isNativeMode={isNativeMode} />

        {/* Alarms List Section */}
        <div className="flex-1 pb-[calc(6rem+env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-primary" />
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider">Your Alarms</h3>
            </div>
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              {alarms.filter(a => a.enabled).length} Active
            </span>
          </div>

          <div className="space-y-3">
            {alarms.length === 0 ? (
              <div className="glass rounded-2xl text-center py-12 px-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <Plus size={28} className="text-primary/60" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">No alarms set</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">Tap the + button to create one</p>
              </div>
            ) : (
              alarms.map(alarm => (
                <AlarmCard
                  key={alarm.id}
                  alarm={alarm}
                  onToggle={toggleAlarm}
                  onDelete={deleteAlarm}
                  onEdit={openEditModal}
                />
              ))
            )}
          </div>
        </div>

        {/* FAB - Floating Action Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-[calc(1.5rem+env(safe-area-inset-right))] w-14 h-14 bg-primary hover:bg-primary-light text-white rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-30"
          aria-label="Add new alarm"
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>

      </div>

      {/* Modals & Overlays */}
      {isAddModalOpen && (
        <AddAlarmModal
          onClose={closeModal}
          onSave={addAlarm}
          onUpdate={updateAlarm}
          alarm={editingAlarm || undefined}
        />
      )}

      {activeAlarms.map(alarm => (
        <AlarmTrigger
          key={alarm.id}
          alarm={alarm}
          onDismiss={() => dismissAlarm(alarm.id)}
        />
      ))}
    </div>
  );
};

export default App;
