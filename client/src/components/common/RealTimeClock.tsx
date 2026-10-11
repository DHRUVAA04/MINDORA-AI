import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useThemeStore } from '../../theme/themeStore';
import { Clock } from 'lucide-react';

interface RealTimeClockProps {
  compact?: boolean;
}

export const RealTimeClock: React.FC<RealTimeClockProps> = ({ compact = false }) => {
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const { clockFormat, toggleClockFormat } = useThemeStore();

  const syncTime = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | number;

    const scheduleNextTick = () => {
      const now = Date.now();
      const delay = 1000 - (now % 1000);
      timeoutId = setTimeout(() => {
        syncTime();
        scheduleNextTick();
      }, delay);
    };

    scheduleNextTick();

    // Re-sync immediately when tab becomes visible after backgrounding
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        syncTime();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [syncTime]);

  // Format time based on mode
  const timeFormatted = useMemo(() => {
    const hours = currentDate.getHours();
    const minutes = currentDate.getMinutes().toString().padStart(2, '0');
    const seconds = currentDate.getSeconds().toString().padStart(2, '0');

    if (clockFormat === '24h') {
      return {
        main: `${hours.toString().padStart(2, '0')}:${minutes}`,
        seconds,
        period: null,
      };
    } else {
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = (hours % 12 || 12).toString().padStart(2, '0');
      return {
        main: `${displayHours}:${minutes}`,
        seconds,
        period,
      };
    }
  }, [currentDate, clockFormat]);

  // Date format: "Sun, 11 Oct 2026"
  const dateFormatted = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayName = days[currentDate.getDay()];
    const dayNum = currentDate.getDate();
    const monthName = months[currentDate.getMonth()];
    const year = currentDate.getFullYear();
    return `${dayName}, ${dayNum} ${monthName} ${year}`;
  }, [currentDate]);

  // Accessible string (e.g. updated only when minute changes)
  const accessibleTimeString = useMemo(() => {
    const hours = currentDate.getHours();
    const minutes = currentDate.getMinutes().toString().padStart(2, '0');
    if (clockFormat === '24h') {
      return `${hours}:${minutes}`;
    }
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${period}`;
  }, [currentDate.getMinutes(), currentDate.getHours(), clockFormat]);

  return (
    <div
      role="timer"
      aria-label={`Current time: ${accessibleTimeString}, ${dateFormatted}. Click to toggle 12-hour or 24-hour format`}
      className="relative group cursor-pointer inline-flex items-center"
      onClick={toggleClockFormat}
      title={`Click to switch to ${clockFormat === '12h' ? '24-hour' : '12-hour'} format`}
    >
      {/* Outer gradient border wrapper */}
      <div className="p-[1px] rounded-full bg-gradient-to-r from-brand-violet via-brand-orchid to-brand-cyan shadow-sm transition-all duration-300 group-hover:shadow-violet-glow">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 dark:bg-[#151231]/90 backdrop-blur-md text-brand-slate dark:text-gray-100 text-xs sm:text-sm font-medium">
          <Clock className="w-3.5 h-3.5 text-brand-cyan flex-shrink-0" aria-hidden="true" />
          
          {/* Main Time Display */}
          <div className="flex items-baseline font-mono tabular-nums tracking-tight font-semibold text-brand-midnight dark:text-white">
            <span>{timeFormatted.main}</span>
            <span className="text-brand-violet dark:text-brand-orchid mx-[1px] animate-pulse-subtle">:</span>
            <span className="text-brand-violet dark:text-brand-cyan text-[11px] sm:text-xs">
              {timeFormatted.seconds}
            </span>
            {timeFormatted.period && (
              <span className="ml-1 text-[10px] font-sans font-bold text-brand-orchid dark:text-brand-cyan uppercase tracking-wider">
                {timeFormatted.period}
              </span>
            )}
          </div>

          {/* Date string (hidden on compact / mobile) */}
          {!compact && (
            <span className="hidden md:inline-flex items-center pl-2 border-l border-brand-violet/20 dark:border-brand-cyan/20 text-[11px] font-sans text-brand-slate/70 dark:text-gray-300 font-normal">
              {dateFormatted}
            </span>
          )}

          {/* Badge indicating 12h/24h toggle hint */}
          <span className="hidden lg:inline-block px-1 py-0.5 text-[9px] rounded bg-brand-violet/10 dark:bg-brand-violet/30 text-brand-violet dark:text-brand-cyan font-mono font-semibold">
            {clockFormat}
          </span>
        </div>
      </div>
    </div>
  );
};
