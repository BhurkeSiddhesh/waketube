import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Alarm } from '../types';
import { X, Volume2, Volume1, VolumeX, AlertCircle, Loader2 } from 'lucide-react';

interface AlarmTriggerProps {
  alarm: Alarm;
  onDismiss: () => void;
}

// Extract YouTube video ID from URL
const getYouTubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const AlarmTrigger: React.FC<AlarmTriggerProps> = ({ alarm, onDismiss }) => {
  const [showButton, setShowButton] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const playerRef = useRef<YT.Player | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract video ID from alarm URL
  const videoId = useMemo(() => {
    const id = getYouTubeVideoId(alarm.videoUrl || '');
    return id || '7GlsxNI4LVI'; // Default Toccata and Fugue
  }, [alarm.videoUrl]);

  // Delay the dismiss button slightly to force wake up attention
  useEffect(() => {
    const timer = setTimeout(() => setShowButton(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Load YouTube IFrame API
  useEffect(() => {
    // Check if API is already loaded
    if ((window as any).YT && (window as any).YT.Player) {
      initPlayer();
      return;
    }

    // Load the API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Wait for API to be ready
    (window as any).onYouTubeIframeAPIReady = () => {
      initPlayer();
    };

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  const initPlayer = () => {
    if (!containerRef.current) return;

    playerRef.current = new (window as any).YT.Player(containerRef.current, {
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        loop: 1,
        playlist: videoId,
        controls: 0,
        showinfo: 0,
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
        mute: 0,
        origin: window.location.origin,
      },
      events: {
        onReady: (event: any) => {
          event.target.setVolume(volume * 100);
          event.target.playVideo();
        },
        onError: (event: any) => {
          console.error('YouTube player error:', event.data);
        }
      }
    });
  };

  // Update volume when slider changes
  useEffect(() => {
    if (playerRef.current && playerRef.current.setVolume) {
      playerRef.current.setVolume(volume * 100);
    }
  }, [volume]);

  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX size={24} className="text-gray-400" />;
    if (volume < 0.5) return <Volume1 size={24} className="text-white" />;
    return <Volume2 size={24} className="text-primary animate-pulse" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden">

      {/* Full Screen Video Background */}
      <div className="absolute inset-0 z-0">
        {/* YouTube player container */}
        <div className="w-full h-full relative overflow-hidden">
          <div
            ref={containerRef}
            className="absolute"
            style={{
              width: '150%',
              height: '150%',
              top: '-25%',
              left: '-25%',
            }}
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