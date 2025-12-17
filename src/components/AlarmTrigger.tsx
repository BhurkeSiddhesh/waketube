import React, { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { Alarm } from '../types';
import { X, Volume2, Volume1, VolumeX, AlertCircle, Loader2 } from 'lucide-react';

interface AlarmTriggerProps {
  alarm: Alarm;
  onDismiss: () => void;
}

const AlarmTrigger: React.FC<AlarmTriggerProps> = ({ alarm, onDismiss }) => {
  const [showButton, setShowButton] = useState(false);
  const [volume, setVolume] = useState(1.0);

  // Delay the dismiss button slightly to force wake up attention
  useEffect(() => {
    const timer = setTimeout(() => setShowButton(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX size={24} className="text-gray-400" />;
    if (volume < 0.5) return <Volume1 size={24} className="text-white" />;
    return <Volume2 size={24} className="text-primary animate-pulse" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden">
      
      {/* Full Screen Video Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         {/* Wrapper to help simulate object-cover behavior for iframe */}
         <div className="w-full h-full relative">
            <ReactPlayer
              url={alarm.videoUrl || 'https://www.youtube.com/watch?v=7GlsxNI4LVI'} // Default Toccata and Fugue
              playing={true}
              loop={true}
              controls={false}
              width="100%"
              height="100%"
              volume={volume}
              muted={false}
              config={{
                youtube: {
                  playerVars: { 
                    showinfo: 0, 
                    autoplay: 1,
                    playsinline: 1,
                    modestbranding: 1,
                    controls: 0,
                    disablekb: 1,
                    fs: 0,
                    rel: 0,
                    mute: 0,
                    origin: window.location.origin
                  },
                },
                file: {
                  attributes: {
                    autoPlay: true,
                    muted: false,
                    style: { objectFit: 'cover', width: '100%', height: '100%' }
                  }
                }
              }}
              style={{ position: 'absolute', top: 0, left: 0 }}
            />
         </div>
      </div>

      {/* Translucent Overlay */}
      <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-sm"></div>

      {/* UI Content */}
      <div className="z-20 flex flex-col items-center text-center space-y-8 px-4 w-full max-w-lg relative animate-in zoom-in duration-500">
        
        {/* Title & Song Info */}
        <div className="space-y-2">
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter drop-shadow-2xl animate-pulse">
                WAKE UP!
            </h1>
            <p className="text-xl md:text-2xl text-primary font-bold drop-shadow-lg max-w-md mx-auto truncate">
                {alarm.label}
            </p>
        </div>
          
        {/* Volume Control */}
        <div className="w-full bg-black/40 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-xl transition-all hover:bg-black/50">
            <div className="flex items-center gap-4">
                <div className="shrink-0 text-white">
                {getVolumeIcon()}
                </div>
                <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-primary hover:accent-rose-400 transition-all"
                />
                <span className="text-xs font-mono text-white/80 w-8 text-right">
                {Math.round(volume * 100)}%
                </span>
            </div>
        </div>

        {/* Dismiss Button Area */}
        <div className="pt-4 w-full flex justify-center h-20 items-center">
            {showButton ? (
            <button
                onClick={onDismiss}
                className="group relative px-10 py-5 bg-white text-black font-black text-xl tracking-widest uppercase rounded-full hover:bg-primary hover:text-white transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-[0_0_50px_rgba(255,255,255,0.2)] hover:shadow-[0_0_50px_rgba(244,63,94,0.6)] w-full sm:w-auto flex items-center justify-center gap-3"
            >
                <X className="group-hover:rotate-90 transition-transform duration-300" size={24} />
                <span>Dismiss</span>
            </button>
            ) : (
            <div className="flex flex-col items-center gap-3 text-white/50 animate-pulse">
                <Loader2 className="animate-spin" size={24} />
                <span className="text-xs font-bold tracking-[0.2em] uppercase">Locked</span>
            </div>
            )}
        </div>
        
        {/* No Snooze Badge */}
        <div className="flex items-center gap-2 text-red-400 font-bold bg-black/40 px-5 py-2 rounded-full border border-red-500/30 backdrop-blur-md mt-4">
          <AlertCircle size={18} />
          <span className="text-sm tracking-wide">NO SNOOZE AVAILABLE</span>
        </div>
      </div>
    </div>
  );
};

export default AlarmTrigger;