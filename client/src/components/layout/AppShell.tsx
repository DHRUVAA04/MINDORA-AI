import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';
import { FloatingMentorButton } from '../common/FloatingMentorButton';
import { useTimerStore } from '../../store/timerStore';
import { PartyPopper, CheckCircle, X } from 'lucide-react';
import { Button } from '../ui/Button';

export const AppShell: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Global Timer background ticking: runs regardless of current route
  const {
    tick,
    showCompletionModal,
    closeCompletionModal,
    lastCompletedSession,
  } = useTimerStore();

  useEffect(() => {
    // Run timer tick at 1 second intervals
    const intervalId = setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(intervalId);
  }, [tick]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F5F3FF] dark:bg-[#0B0A1A] text-brand-slate dark:text-gray-100 transition-colors duration-200">
      {/* Persistent Left Sidebar (Desktop / Tablet) */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* TopBar with persistent clock and mini timer */}
        <TopBar onOpenMobileMenu={() => setIsMobileDrawerOpen(true)} />

        {/* Routed Page Content */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* Mobile Navigation bar & Drawer */}
      <MobileNav
        isDrawerOpen={isMobileDrawerOpen}
        onCloseDrawer={() => setIsMobileDrawerOpen(false)}
        onOpenDrawer={() => setIsMobileDrawerOpen(true)}
      />

      {/* Floating Contextual AI Mentor Button */}
      <FloatingMentorButton />

      {/* Global Session Completion Modal */}
      {showCompletionModal && lastCompletedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-[#151231] rounded-3xl p-6 sm:p-8 shadow-2xl border border-brand-violet/30 text-center">
            <button
              onClick={closeCompletionModal}
              className="absolute top-4 right-4 p-1.5 rounded-full text-brand-slate/50 hover:text-brand-slate dark:text-gray-400 dark:hover:text-white"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-brand-violet via-brand-orchid to-brand-cyan flex items-center justify-center shadow-violet-glow">
              <PartyPopper className="w-8 h-8 text-white" />
            </div>

            <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-brand-violet to-brand-cyan bg-clip-text text-transparent">
              Focus Session Completed!
            </h3>

            <p className="mt-2 text-xs sm:text-sm text-brand-slate/70 dark:text-gray-300">
              {lastCompletedSession.activityTitle
                ? `You dedicated quality time to "${lastCompletedSession.activityTitle}".`
                : 'Great work maintaining deep focus! Your session has been recorded.'}
            </p>

            <div className="mt-4 p-3 rounded-xl bg-brand-violet/5 dark:bg-brand-violet/10 border border-brand-violet/15 flex items-center justify-around text-xs">
              <div>
                <span className="block text-[10px] uppercase font-semibold text-brand-slate/50 dark:text-gray-400">Duration</span>
                <span className="font-mono font-bold text-sm text-brand-violet dark:text-brand-cyan">
                  {Math.round(lastCompletedSession.actualSeconds / 60)} mins
                </span>
              </div>
              <div className="border-l border-brand-violet/20 h-6" />
              <div>
                <span className="block text-[10px] uppercase font-semibold text-brand-slate/50 dark:text-gray-400">Tracking</span>
                <span className="font-semibold text-brand-mint flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Self-timed
                </span>
              </div>
            </div>

            <p className="mt-3 text-[11px] text-brand-slate/50 dark:text-gray-400 italic">
              Note: Self-timed study time is recorded for your personal habit tracking. Actual mastery is determined by quiz assessments.
            </p>

            <div className="mt-6 flex justify-center">
              <Button
                variant="primary"
                size="md"
                onClick={closeCompletionModal}
                className="w-full sm:w-auto px-8"
              >
                Continue Studying
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

