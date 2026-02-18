import React, { useState, useEffect } from 'react';
import { Plus, BatteryCharging, AlertTriangle, Moon, Sun, Sparkles } from 'lucide-react';
import { Alarm, DayOfWeek } from './types';
import AlarmCard from './components/AlarmCard';
import AddAlarmModal from './components/AddAlarmModal';
import AlarmTrigger from './components/AlarmTrigger';
import WakeTubeIcon from './components/WakeTubeIcon';
import { v4 as uuidv4 } from 'uuid';

const generateId = () => uuidv4();

const App: React.FC = () => {
  const [alarms, setAlarms] = useState<Alarm[]>(() => {
    const saved = localStorage.getItem('waketube-alarms');
    return saved ? JSON.parse(saved) : [];
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);
  const [activeAlarms, setActiveAlarms] = useState<Alarm[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const savedTheme = localStorage.getItem('waketube-theme');
    return (savedTheme as 'dark' | 'light') || 'dark';
  });

  // Track alarms that have already rung this minute
  const [triggeredThisMinute, setTriggeredThisMinute] = useState<string[]>([]);

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

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

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
      setCurrentTime(now);

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

  const addAlarm = (newAlarmData: Omit<Alarm, 'id'>) => {
    const newAlarm: Alarm = { ...newAlarmData, id: generateId() };
    setAlarms([...alarms, newAlarm]);
  };

  const toggleAlarm = (id: string) => {
    setAlarms(alarms.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const deleteAlarm = (id: string) => {
    setAlarms(alarms.filter(a => a.id !== id));
  };

  const dismissAlarm = (id: string) => {
    setActiveAlarms(prev => prev.filter(a => a.id !== id));
  };

  const updateAlarm = (updatedAlarm: Alarm) => {
    setAlarms(alarms.map(a => a.id === updatedAlarm.id ? updatedAlarm : a));
  };

  const openEditModal = (alarm: Alarm) => {
    setEditingAlarm(alarm);
    setIsAddModalOpen(true);
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingAlarm(null);
  };

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
            className="glass w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:text-body hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </header>

        {/* Hero Clock - Glass Card */}
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

            <div className="flex items-center gap-2 text-xs font-medium text-orange-400 bg-orange-500/10 px-4 py-2 rounded-full border border-orange-500/20 backdrop-blur-sm">
              <AlertTriangle size={14} />
              <span>Keep tab open</span>
            </div>
          </div>
        </div>

        {/* Alarms List Section */}
        <div className="flex-1 pb-24">
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
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primary-light text-white rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-30"
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