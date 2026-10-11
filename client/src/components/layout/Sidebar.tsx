import React from 'react';
import { NavItem } from '../ui/NavItem';
import {
  LayoutDashboard,
  Target,
  Sparkles,
  AlertCircle,
  Map,
  Bot,
  BookOpen,
  FileText,
  CheckSquare,
  TrendingUp,
  Calendar,
  Timer,
  UserCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Brain,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { to: '/goals', label: 'Goals', icon: <Target className="w-5 h-5" /> },
  { to: '/diagnostic', label: 'Diagnostic', icon: <Sparkles className="w-5 h-5" />, badge: 'New' },
  { to: '/skill-gaps', label: 'Skill Gaps', icon: <AlertCircle className="w-5 h-5" /> },
  { to: '/roadmap', label: 'Roadmap', icon: <Map className="w-5 h-5" /> },
  { to: '/ai-mentor', label: 'AI Mentor', icon: <Bot className="w-5 h-5" /> },
  { to: '/resources', label: 'Resources', icon: <BookOpen className="w-5 h-5" /> },
  { to: '/pdf-notes', label: 'PDF Notes', icon: <FileText className="w-5 h-5" /> },
  { to: '/practice', label: 'Practice / Quizzes', icon: <CheckSquare className="w-5 h-5" /> },
  { to: '/progress', label: 'Progress', icon: <TrendingUp className="w-5 h-5" /> },
  { to: '/timetable', label: 'Timetable', icon: <Calendar className="w-5 h-5" /> },
  { to: '/timer', label: 'Timer', icon: <Timer className="w-5 h-5" />, badge: 'Live' },
  { to: '/profile', label: 'Profile & Privacy', icon: <UserCheck className="w-5 h-5" /> },
];

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapse }) => {
  const { logout, user } = useAuthStore();

  return (
    <aside
      className={`relative hidden md:flex flex-col z-30 transition-all duration-300 ease-in-out border-r border-brand-violet/10 dark:border-brand-violet/25 bg-white/90 dark:bg-[#0F0D24]/90 backdrop-blur-xl ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
      aria-label="Main Navigation"
    >
      {/* Brand Logo Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-brand-violet/10 dark:border-brand-violet/20">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-midnight via-brand-violet to-brand-orchid flex items-center justify-center shadow-violet-glow">
            <Brain className="w-6 h-6 text-brand-cyan" aria-hidden="true" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-brand-violet via-brand-orchid to-brand-cyan bg-clip-text text-transparent">
                MINDORA AI
              </span>
              <span className="text-[10px] uppercase tracking-widest text-brand-slate/60 dark:text-gray-400 font-semibold">
                Study Nebula
              </span>
            </div>
          )}
        </div>

        {/* Toggle Collapse Button (Desktop) */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 rounded-lg text-brand-slate/60 hover:text-brand-violet dark:text-gray-400 dark:hover:text-brand-cyan hover:bg-brand-violet/10 focus-visible:ring-2 focus-visible:ring-brand-cyan"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links Scrollable Area */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-brand-violet/20">
        <nav className="space-y-1" aria-label="Sidebar Sections">
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              badge={item.badge}
              isCollapsed={isCollapsed}
            />
          ))}
        </nav>
      </div>

      {/* Bottom User & Logout Area */}
      <div className="p-3 border-t border-brand-violet/10 dark:border-brand-violet/20">
        {!isCollapsed && user && (
          <div className="px-3 py-2 mb-2 rounded-xl bg-brand-violet/5 dark:bg-brand-violet/10 border border-brand-violet/10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-orchid to-brand-cyan text-brand-midnight font-bold flex items-center justify-center text-xs">
              {user.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-brand-slate dark:text-gray-100 truncate">
                {user.name}
              </p>
              <p className="text-[11px] text-brand-slate/60 dark:text-gray-400 truncate">
                {user.email}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-brand-coral hover:bg-brand-coral/10 hover:text-red-500 transition-colors focus-visible:ring-2 focus-visible:ring-brand-coral ${
            isCollapsed ? 'justify-center px-2' : ''
          }`}
          aria-label="Log out of Mindora AI"
          title="Log out"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

