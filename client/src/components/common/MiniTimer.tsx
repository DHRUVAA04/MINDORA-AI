import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTimerStore } from '../../store/timerStore';
import { Play, Pause, RotateCcw, Timer as TimerIcon } from 'lucide-react';

export const MiniTimer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isTimerPage = location.pathname === '/timer';

  const {
    mode,
    isRunning,
    isPaused,
    remainingSeconds,
    elapsedSeconds,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
  } = useTimerStore();

  const secondsToDisplay = mode === 'stopwatch' ? elapsedSeconds : remainingSeconds;
  const mins = Math.floor(secondsToDisplay / 60).toString().padStart(2, '0');
  const secs = (secondsToDisplay % 60).toString().padStart(2, '0');

  const getModeLabel = () => {
    switch (mode) {
      case 'pomodoro':
        return 'Focus';
      case 'short_break':
        return 'Short Break';
      case 'long_break':
        return 'Long Break';
      case 'custom':
        return 'Custom';
      case 'stopwatch':
        return 'Stopwatch';
      case 'activity':
        return 'Activity';
      default:
        return 'Timer';
    }
  };

  // If on the Timer page itself, don't crowd the top bar or show a minimal link
  if (isTimerPage) {
    return null;
  }

  return (
    <div className="relative group inline-flex items-center">
      <div 
        className={`p-[1px] rounded-full transition-all duration-300 ${
          isRunning 
            ? 'bg-gradient-to-r from-brand-violet via-brand-orchid to-brand-cyan shadow-cyan-glow' 
            : 'bg-brand-violet/20 hover:bg-brand-violet/40'
        }`}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-white/95 dark:bg-[#151231]/95 backdrop-blur-md">
          {/* Clickable section to navigate to timer page */}
          <button
            onClick={() => navigate('/timer')}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-medium focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-cyan rounded-md"
            title="Open Timer Page"
            aria-label={`Open timer. Current state: ${getModeLabel()} ${mins}:${secs}`}
          >
            <TimerIcon 
              className={`w-3.5 h-3.5 transition-colors ${
                isRunning ? 'text-brand-cyan animate-pulse-subtle' : 'text-brand-slate/60 dark:text-gray-400'
              }`} 
              aria-hidden="true" 
            />
            <span className="hidden sm:inline-block text-[11px] font-medium text-brand-slate/70 dark:text-gray-300">
              {getModeLabel()}
            </span>
            <span className="font-mono tabular-nums font-bold text-brand-midnight dark:text-white tracking-tight">
              {mins}:{secs}
            </span>
          </button>

          {/* Quick Play/Pause/Reset actions */}
          <div className="flex items-center gap-0.5 border-l border-brand-violet/20 dark:border-brand-cyan/20 pl-1.5">
            {isRunning ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  pauseTimer();
                }}
                title="Pause Timer"
                aria-label="Pause Timer"
                className="p-1 rounded-full text-brand-slate hover:text-brand-violet dark:text-gray-300 dark:hover:text-brand-cyan hover:bg-brand-violet/10 focus-visible:ring-1 focus-visible:ring-brand-cyan"
              >
                <Pause className="w-3 h-3" />
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isPaused) {
                    resumeTimer();
                  } else {
                    startTimer();
                  }
                }}
                title={isPaused ? "Resume Timer" : "Start Timer"}
                aria-label={isPaused ? "Resume Timer" : "Start Timer"}
                className="p-1 rounded-full text-brand-slate hover:text-brand-violet dark:text-gray-300 dark:hover:text-brand-cyan hover:bg-brand-violet/10 focus-visible:ring-1 focus-visible:ring-brand-cyan"
              >
                <Play className="w-3 h-3 fill-current" />
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                resetTimer();
              }}
              title="Reset Timer"
              aria-label="Reset Timer"
              className="p-1 rounded-full text-brand-slate/60 hover:text-brand-coral dark:text-gray-400 dark:hover:text-brand-coral hover:bg-brand-coral/10 focus-visible:ring-1 focus-visible:ring-brand-coral"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

