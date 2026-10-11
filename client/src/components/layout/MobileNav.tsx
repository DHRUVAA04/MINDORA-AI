import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  Timer,
  Bot,
  Menu,
  X,
  Target,
  Sparkles,
  AlertCircle,
  BookOpen,
  FileText,
  CheckSquare,
  TrendingUp,
  Calendar,
  UserCheck,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface MobileNavProps {
  isDrawerOpen: boolean;
  onCloseDrawer: () => void;
  onOpenDrawer: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  isDrawerOpen,
  onCloseDrawer,
  onOpenDrawer,
}) => {
  const { logout, user } = useAuthStore();

  const mainBottomTabs = [
    { to: '/', label: 'Home', icon: <LayoutDashboard className="w-5 h-5" /> },
    { to: '/roadmap', label: 'Roadmap', icon: <Map className="w-5 h-5" /> },
    { to: '/timer', label: 'Timer', icon: <Timer className="w-5 h-5" /> },
    { to: '/ai-mentor', label: 'AI Mentor', icon: <Bot className="w-5 h-5" /> },
  ];

  const drawerItems = [
    { to: '/goals', label: 'Goals', icon: <Target className="w-5 h-5" /> },
    { to: '/diagnostic', label: 'Diagnostic Assessment', icon: <Sparkles className="w-5 h-5" /> },
    { to: '/skill-gaps', label: 'Skill Gaps', icon: <AlertCircle className="w-5 h-5" /> },
    { to: '/resources', label: 'Resources', icon: <BookOpen className="w-5 h-5" /> },
    { to: '/pdf-notes', label: 'PDF Notes', icon: <FileText className="w-5 h-5" /> },
    { to: '/practice', label: 'Practice / Quizzes', icon: <CheckSquare className="w-5 h-5" /> },
    { to: '/progress', label: 'Progress & Analytics', icon: <TrendingUp className="w-5 h-5" /> },
    { to: '/timetable', label: 'Timetable', icon: <Calendar className="w-5 h-5" /> },
    { to: '/profile', label: 'Profile & Privacy', icon: <UserCheck className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Fixed Bottom Navigation Bar for Mobile (screen width < 768px) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-16 bg-white/95 dark:bg-[#0F0D24]/95 backdrop-blur-xl border-t border-brand-violet/10 dark:border-brand-violet/25 px-2 flex items-center justify-around"
        aria-label="Mobile Navigation"
      >
        {mainBottomTabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 w-14 py-1 rounded-xl text-[10px] font-medium transition-all ${
                isActive
                  ? 'text-brand-violet dark:text-brand-cyan font-bold scale-105'
                  : 'text-brand-slate/70 dark:text-gray-400 hover:text-brand-violet'
              }`
            }
          >
            {tab.icon}
            <span>{tab.label}</span>
          </NavLink>
        ))}

        {/* More Drawer Button */}
        <button
          onClick={onOpenDrawer}
          className="flex flex-col items-center justify-center gap-1 w-14 py-1 rounded-xl text-[10px] font-medium text-brand-slate/70 dark:text-gray-400 hover:text-brand-violet focus-visible:ring-2 focus-visible:ring-brand-cyan"
          aria-label="Open more navigation options"
        >
          <Menu className="w-5 h-5" />
          <span>More</span>
        </button>
      </nav>

      {/* Slide-in Mobile Drawer */}
      {isDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseDrawer}
            aria-hidden="true"
          />

          {/* Drawer content */}
          <div className="relative w-4/5 max-w-xs bg-white dark:bg-[#151231] h-full shadow-2xl flex flex-col p-4 border-r border-brand-violet/20 z-10 animate-in slide-in-from-left duration-250">
            <div className="flex items-center justify-between pb-4 border-b border-brand-violet/10 dark:border-brand-violet/20">
              <span className="font-extrabold text-base bg-gradient-to-r from-brand-violet to-brand-cyan bg-clip-text text-transparent">
                MINDORA AI
              </span>
              <button
                onClick={onCloseDrawer}
                className="p-1.5 rounded-lg text-brand-slate/60 hover:text-brand-slate dark:text-gray-400 dark:hover:text-white"
                aria-label="Close navigation drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User profile summary in drawer */}
            {user && (
              <div className="my-3 p-3 rounded-xl bg-brand-violet/5 dark:bg-brand-violet/15 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-violet to-brand-cyan text-white text-xs font-bold flex items-center justify-center">
                  {user.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate text-brand-slate dark:text-white">{user.name}</p>
                  <p className="text-[10px] text-brand-slate/60 dark:text-gray-400 truncate">{user.email}</p>
                </div>
              </div>
            )}

            {/* Drawer links */}
            <div className="flex-1 overflow-y-auto py-2 space-y-1">
              {drawerItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onCloseDrawer}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-brand-royal to-brand-violet text-white font-bold'
                        : 'text-brand-slate/80 dark:text-gray-300 hover:bg-brand-violet/10'
                    }`
                  }
                >
                  <span className="text-brand-violet dark:text-brand-cyan">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>

            {/* Logout button */}
            <div className="pt-3 border-t border-brand-violet/10 dark:border-brand-violet/20">
              <button
                onClick={() => {
                  onCloseDrawer();
                  logout();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-brand-coral hover:bg-brand-coral/10"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

