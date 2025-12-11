import React, { useState, useEffect } from 'react';
import { Plus, BatteryCharging, AlertTriangle, Moon, Sun } from 'lucide-react';
import { Alarm, DayOfWeek } from './types';
import AlarmCard from './components/AlarmCard';
import AddAlarmModal from './components/AddAlarmModal';
import AlarmTrigger from './components/AlarmTrigger';
import WakeTubeIcon from './components/WakeTubeIcon';
import { v4 as uuidv4 } from 'uuid'; // Using uuid for unique IDs
import { GoogleGenAI } from "@google/genai";

const generateId = () => uuidv4();

const App: React.FC = () => {
  const [alarms, setAlarms] = useState<Alarm[]>(() => {
    const saved = localStorage.getItem('waketube-alarms');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeAlarm, setActiveAlarm] = useState<Alarm | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const savedTheme = localStorage.getItem('waketube-theme');
    return (savedTheme as 'dark' | 'light') || 'dark';
  });

  // Track alarms that have already rung this minute to prevent loops
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
      // Feature detection
      if (!navigator.wakeLock) return;

      try {
        await navigator.wakeLock.request('screen');
        console.debug('Screen Wake Lock active');
      } catch (err: any) {
        // Specific handling for policy errors reported by users in iframe environments
        const msg = err.message || '';
        const isPolicyError = msg.includes('permissions policy') || err.name === 'NotAllowedError';
        
        if (isPolicyError) {
           // Silently fail if blocked by environment policy to prevent console noise
           // This is expected behavior in some sandboxed iframes
           return;
        } 
        
        if (err.name !== 'AbortError') {
           console.warn('Wake Lock request failed:', err);
        }
      }
    };
    
    // Request on mount and whenever visibility changes (e.g. tab switching)
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
      // ONLY check if no alarm is currently active (no overlapping alarms support for simplicity)
      if (!activeAlarm) {
        const matchingAlarm = alarms.find(a => {
          return (
            a.enabled &&
            a.time === timeString &&
            a.days.includes(currentDay) &&
            !triggeredThisMinute.includes(a.id)
          );
        });

        if (matchingAlarm) {
          setActiveAlarm(matchingAlarm);
          setTriggeredThisMinute(prev => [...prev, matchingAlarm.id]);
        }
      }

    }, 1000);

    return () => clearInterval(timer);
  }, [alarms, activeAlarm, triggeredThisMinute]);

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

  const dismissAlarm = () => {
    setActiveAlarm(null);
    // Note: We've already added it to triggeredThisMinute, so it won't ring again immediately.
  };

  return (
    <div className="min-h-screen bg-darker text-body font-sans relative flex flex-col transition-colors duration-300">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col p-6 max-w-2xl mx-auto w-full">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <WakeTubeIcon className="w-10 h-10 shadow-lg shadow-primary/20" />
            <h1 className="text-2xl font-black tracking-tight text-body">WakeTube</h1>
          </div>
          
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-surface text-gray-500 hover:text-body transition-colors border border-transparent hover:border-borderDim"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </header>

        {/* Hero Clock */}
        <div className="mb-12 flex flex-col items-center justify-center py-10">
          <div className="text-[6rem] sm:text-[8rem] font-black font-mono leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-body to-gray-500/50 select-none">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
          </div>
          <div className="text-xl font-bold text-gray-400 uppercase tracking-widest mt-2">
            {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          
          <div className="mt-8 flex items-center gap-2 text-xs font-medium text-green-500 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
             <BatteryCharging size={12} />
             <span>Active & Monitoring</span>
          </div>
          
          <div className="mt-2 flex items-center gap-2 text-xs font-medium text-orange-400">
             <AlertTriangle size={12} />
             <span>Keep tab open to ring</span>
          </div>
        </div>

        {/* Alarms List */}
        <div className="flex-1 space-y-4 pb-24">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider">Your Alarms</h3>
            <span className="text-gray-400 text-xs">{alarms.filter(a => a.enabled).length} Active</span>
          </div>
          
          {alarms.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-borderDim rounded-2xl">
              <p className="text-gray-400 mb-2">No alarms set</p>
              <p className="text-gray-500 text-sm">Add one to wake up with style</p>
            </div>
          ) : (
            alarms.map(alarm => (
              <AlarmCard 
                key={alarm.id} 
                alarm={alarm} 
                onToggle={toggleAlarm} 
                onDelete={deleteAlarm}
              />
            ))
          )}
        </div>

        {/* FAB */}
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-primary hover:bg-rose-600 text-white rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-30"
        >
          <Plus size={32} />
        </button>

      </div>

      {/* Modals & Overlays */}
      {isAddModalOpen && (
        <AddAlarmModal 
          onClose={() => setIsAddModalOpen(false)} 
          onSave={addAlarm}
        />
      )}

      {activeAlarm && (
        <AlarmTrigger 
          alarm={activeAlarm} 
          onDismiss={dismissAlarm} 
        />
      )}
    </div>
  );
};

export default App;