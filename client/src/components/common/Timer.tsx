import React, { useEffect } from 'react';
import { Clock } from 'lucide-react';
import { sound } from '../../services/sound';

interface TimerProps {
  seconds: number;
  totalSeconds?: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Timer: React.FC<TimerProps> = ({
  seconds,
  totalSeconds = 30,
  label = 'Time Left',
  size = 'md',
}) => {
  const isUrgent = seconds <= 5 && seconds > 0;

  useEffect(() => {
    if (isUrgent) {
      sound.playTick();
    }
  }, [seconds, isUrgent]);

  const percentage = Math.max(0, Math.min(100, (seconds / totalSeconds) * 100));

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono transition-all duration-300 ${
        isUrgent
          ? 'bg-rose-950/60 border-rose-500/60 text-rose-300 shadow-lg shadow-rose-500/30 animate-pulse'
          : 'bg-surface/80 border-purple-500/30 text-purple-200'
      }`}
    >
      <Clock className={`w-4 h-4 ${isUrgent ? 'text-rose-400 animate-spin' : 'text-purple-400'}`} />
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:inline">
        {label}:
      </span>
      <span className={`font-black ${size === 'lg' ? 'text-xl' : size === 'sm' ? 'text-sm' : 'text-base'}`}>
        {seconds}s
      </span>
    </div>
  );
};

