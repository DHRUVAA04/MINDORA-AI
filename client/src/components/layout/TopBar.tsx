import React from 'react';
import { RealTimeClock } from '../common/RealTimeClock';
import { MiniTimer } from '../common/MiniTimer';
import { useThemeStore } from '../../theme/themeStore';
import { Sun, Moon, Menu, Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface TopBarProps {
  onOpenMobileMenu: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenMobileMenu }) => {
  const { theme, toggleTheme } = useThemeStore();
  const location = useLocation();

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/':
        return 'Study Nebula Dashboard';
      case '/goals':
        return 'Learning Goals';
      case '/diagnostic':
        return 'Diagnostic Assessment';
      case '/skill-gaps':
        return 'Skill Gaps & Knowledge Map';
      case '/roadmap':
        return 'Personalized Roadmap';
      case '/ai-mentor':
        return 'Mindora AI Mentor';
      case '/resources':
        return 'Curated Resources';
      case '/pdf-notes':
        return 'AI Annotated PDF Notes';
      case '/practice':
        return 'Practice & Mastery Quizzes';
      case '/progress':
        return 'Academic Analytics & Progress';
      case '/timetable':
        return 'Smart Timetable';
      case '/timer':
        return 'Focus Studio & Pomodoro Timer';
      case '/profile':
        return 'Student Profile & Privacy';
      default:
        return 'Mindora AI';
    }
  };

  return (
    <header
      className="sticky top-0 z-20 h-16 border-b border-brand-violet/10 dark:border-brand-violet/25 bg-white/80 dark:bg-[#0F0D24]/85 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 transition-colors"
      aria-label="Top Application Bar"
    >
      {/* Left: Mobile hamburger menu & Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-xl text-brand-slate/80 dark:text-gray-200 hover:bg-brand-violet/10 focus-visible:ring-2 focus-visible:ring-brand-cyan"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 truncate">
          <Sparkles className="w-4 h-4 text-brand-cyan hidden sm:block flex-shrink-0" aria-hidden="true" />
          <h1 className="text-sm sm:text-base font-bold text-brand-midnight dark:text-white truncate">
            {getPageTitle(location.pathname)}
          </h1>
        </div>
      </div>

      {/* Right: Persistent Clock, Mini Timer, Theme Toggle */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Mini Timer (persists and shows running timer on all pages) */}
        <MiniTimer />

        {/* Real-time Persistent Clock (lives in top bar, never unmounts during route changes) */}
        <RealTimeClock />

        {/* Theme Toggle Button (Light <-> Deep Space Dark) */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-brand-slate/80 dark:text-gray-200 hover:bg-brand-violet/10 dark:hover:bg-brand-violet/20 hover:text-brand-violet dark:hover:text-brand-cyan transition-all duration-200 focus-visible:ring-2 focus-visible:ring-brand-cyan"
          aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Deep Space Dark'} theme`}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Deep Space Dark'} theme`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-brand-amber animate-pulse-subtle" />
          ) : (
            <Moon className="w-4 h-4 text-brand-violet" />
          )}
        </button>
      </div>
    </header>
  );
};

