import React, { useState, useEffect } from 'react';
import { useTimerStore, TimerMode, LinkedActivity } from '../store/timerStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
  Bell,
  BellCheck,
  BookOpen,
  Calendar,
  Flame,
  Clock,
  Sparkles,
  Info,
  CheckCircle2,
  Tag,
  PenLine,
} from 'lucide-react';

export const SAMPLE_ACTIVITIES: LinkedActivity[] = [
  { id: 'act_101', title: 'Linear Algebra: Eigenvalues & Diagonalization', subject: 'Mathematics III', topicId: 'math_la' },
  { id: 'act_102', title: 'Data Structures: AVL Trees & Balance Factors', subject: 'Data Structures', topicId: 'cs_ds' },
  { id: 'act_103', title: 'OS: Virtual Memory & Page Replacement Algorithms', subject: 'Operating Systems', topicId: 'cs_os' },
  { id: 'act_104', title: 'DBMS: Normalization 3NF & BCNF Decomposition', subject: 'Database Systems', topicId: 'cs_db' },
  { id: 'act_105', title: 'Computer Networks: TCP 3-Way Handshake & Flow Control', subject: 'Networks', topicId: 'cs_cn' },
];

export const TimerPage: React.FC = () => {
  const {
    mode,
    isRunning,
    isPaused,
    remainingSeconds,
    elapsedSeconds,
    pomodoroDuration,
    shortBreakDuration,
    longBreakDuration,
    customDuration,
    sessionsCompletedCount,
    linkedActivity,
    sessionNotes,
    soundEnabled,
    notificationsEnabled,
    setMode,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    skipSession,
    setCustomDuration,
    setLinkedActivity,
    setSessionNotes,
    toggleSound,
    requestNotificationPermission,
  } = useTimerStore();

  const [customInputMins, setCustomInputMins] = useState(Math.round(customDuration / 60));
  const [sessionsHistory, setSessionsHistory] = useState<any[]>([]);
  const [stats, setStats] = useState({
    todayMinutes: 45,
    weeklyTotalMinutes: 285,
    sessionsCount: 3,
  });

  // Calculate total duration for the current mode
  const getTotalDuration = () => {
    switch (mode) {
      case 'pomodoro':
        return pomodoroDuration;
      case 'short_break':
        return shortBreakDuration;
      case 'long_break':
        return longBreakDuration;
      case 'custom':
        return customDuration;
      case 'activity':
        return 30 * 60;
      case 'stopwatch':
        return Math.max(1, elapsedSeconds);
    }
  };

  const totalSecs = getTotalDuration();
  const currentSecs = mode === 'stopwatch' ? elapsedSeconds : remainingSeconds;

  // Progress for SVG ring (1 -> 0 for countdown, 0 -> 1 for stopwatch)
  const progress = mode === 'stopwatch'
    ? Math.min(1, elapsedSeconds / 3600)
    : Math.max(0, Math.min(1, currentSecs / (totalSecs || 1)));

  // SVG parameters
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = (1 - progress) * circumference;

  const displayMins = Math.floor(currentSecs / 60).toString().padStart(2, '0');
  const displaySecs = (currentSecs % 60).toString().padStart(2, '0');

  // Fetch session history & stats from backend (or fallback to local)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('mindora_auth_token');
        const res = await fetch('http://localhost:5000/api/timer/stats', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setSessionsHistory(data.history || []);
        }
      } catch {
        // Mock fallback if backend is offline
        setSessionsHistory([
          {
            id: 'mock_1',
            mode: 'pomodoro',
            activity_title: 'Linear Algebra: Eigenvalues',
            actual_seconds: 1500,
            started_at: new Date(Date.now() - 3600000).toISOString(),
            completed: 1,
            notes: 'Reviewed characteristic polynomial theorem',
          },
          {
            id: 'mock_2',
            mode: 'pomodoro',
            activity_title: 'OS: Virtual Memory',
            actual_seconds: 1500,
            started_at: new Date(Date.now() - 7200000).toISOString(),
            completed: 1,
            notes: 'Solved LRU and FIFO page fault problems',
          },
        ]);
      }
    };
    fetchStats();
  }, [sessionsCompletedCount]);

  const handleCustomDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0 && val <= 180) {
      setCustomInputMins(val);
      setCustomDuration(val);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-violet dark:text-brand-cyan">
            <Sparkles className="w-4 h-4" />
            <span>Aurora Focus Studio</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-midnight dark:text-white tracking-tight mt-1">
            Focus & Pomodoro Timer
          </h2>
          <p className="text-xs sm:text-sm text-brand-slate/70 dark:text-gray-300 mt-1 max-w-2xl">
            Cultivate deep concentration sessions using evidence-based time blocks. 
            All focus intervals continue running across the application and persist across reloads.
          </p>
        </div>

        {/* Sound & Notification Quick Toggles */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleSound}
            aria-label={soundEnabled ? 'Disable audio chime' : 'Enable audio chime'}
            leftIcon={soundEnabled ? <Volume2 className="w-4 h-4 text-brand-cyan" /> : <VolumeX className="w-4 h-4 text-brand-coral" />}
          >
            {soundEnabled ? 'Sound On' : 'Muted'}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={requestNotificationPermission}
            aria-label="Browser notifications permission"
            leftIcon={notificationsEnabled ? <BellCheck className="w-4 h-4 text-brand-mint" /> : <Bell className="w-4 h-4 text-brand-slate/60" />}
          >
            {notificationsEnabled ? 'Notifs Active' : 'Allow Notifs'}
          </Button>
        </div>
      </div>

      {/* Main Grid: Timer on Left, Session Linking & Stats on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Timer Apparatus (7 cols) */}
        <Card className="lg:col-span-7 flex flex-col items-center p-6 sm:p-8" padding="lg">
          {/* Mode Selector Tabs */}
          <div className="w-full flex items-center justify-center gap-1.5 p-1.5 rounded-2xl bg-brand-violet/5 dark:bg-[#1C1742] border border-brand-violet/10 dark:border-brand-violet/30 overflow-x-auto max-w-full">
            <button
              onClick={() => setMode('pomodoro')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                mode === 'pomodoro'
                  ? 'bg-gradient-to-r from-brand-royal to-brand-violet text-white shadow-md'
                  : 'text-brand-slate/80 dark:text-gray-300 hover:text-brand-violet'
              }`}
            >
              Focus (25m)
            </button>
            <button
              onClick={() => setMode('short_break')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                mode === 'short_break'
                  ? 'bg-gradient-to-r from-brand-royal to-brand-violet text-white shadow-md'
                  : 'text-brand-slate/80 dark:text-gray-300 hover:text-brand-violet'
              }`}
            >
              Short Break (5m)
            </button>
            <button
              onClick={() => setMode('long_break')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                mode === 'long_break'
                  ? 'bg-gradient-to-r from-brand-royal to-brand-violet text-white shadow-md'
                  : 'text-brand-slate/80 dark:text-gray-300 hover:text-brand-violet'
              }`}
            >
              Long Break (15m)
            </button>
            <button
              onClick={() => setMode('custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                mode === 'custom'
                  ? 'bg-gradient-to-r from-brand-royal to-brand-violet text-white shadow-md'
                  : 'text-brand-slate/80 dark:text-gray-300 hover:text-brand-violet'
              }`}
            >
              Custom
            </button>
            <button
              onClick={() => setMode('stopwatch')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                mode === 'stopwatch'
                  ? 'bg-gradient-to-r from-brand-royal to-brand-violet text-white shadow-md'
                  : 'text-brand-slate/80 dark:text-gray-300 hover:text-brand-violet'
              }`}
            >
              Stopwatch
            </button>
          </div>

          {/* Custom Duration Slider if mode is custom */}
          {mode === 'custom' && (
            <div className="w-full mt-4 flex items-center justify-center gap-3 text-xs">
              <span className="text-brand-slate/70 dark:text-gray-300 font-medium">Duration:</span>
              <input
                type="number"
                min="1"
                max="180"
                value={customInputMins}
                onChange={handleCustomDurationChange}
                disabled={isRunning}
                className="w-16 px-2 py-1 text-center font-mono font-bold rounded-lg border border-brand-violet/30 bg-brand-violet/5 dark:bg-[#1C1742] text-brand-midnight dark:text-white"
              />
              <span className="text-brand-slate/70 dark:text-gray-300">minutes</span>
            </div>
          )}

          {/* Large Circular Progress Ring with Aurora Gradient */}
          <div className="relative my-8 sm:my-10 flex items-center justify-center">
            <svg
              className="w-64 h-64 sm:w-80 sm:h-80 -rotate-90 transform"
              viewBox="0 0 280 280"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="auroraTimerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7C3AED" />
                  <stop offset="50%" stopColor="#D946EF" />
                  <stop offset="100%" stopColor="#22D3EE" />
                </linearGradient>
              </defs>

              {/* Background Track Circle */}
              <circle
                cx="140"
                cy="140"
                r={radius}
                className="stroke-brand-violet/10 dark:stroke-brand-violet/20"
                strokeWidth="10"
                fill="none"
              />

              {/* Animated Aurora Progress Circle */}
              <circle
                cx="140"
                cy="140"
                r={radius}
                stroke="url(#auroraTimerGradient)"
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-300 ease-linear shadow-violet-glow"
              />
            </svg>

            {/* Inner Center Display */}
            <div className="absolute flex flex-col items-center justify-center text-center select-none">
              {/* Mode indicator */}
              <span className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-brand-orchid dark:text-brand-cyan mb-1">
                {mode === 'pomodoro' ? `Focus Block #${sessionsCompletedCount + 1}` : mode.replace('_', ' ')}
              </span>

              {/* Huge Monospaced Time Display */}
              <div className="font-mono tabular-nums text-5xl sm:text-6xl font-black tracking-tight text-brand-midnight dark:text-white drop-shadow-sm">
                <span>{displayMins}</span>
                <span className="text-brand-violet dark:text-brand-orchid animate-pulse-subtle mx-1">:</span>
                <span>{displaySecs}</span>
              </div>

              {/* Session status badge */}
              <span className="mt-2 text-xs font-medium px-2.5 py-0.5 rounded-full bg-brand-violet/10 dark:bg-brand-violet/25 text-brand-violet dark:text-brand-cyan">
                {isRunning ? 'Session Active' : isPaused ? 'Paused' : 'Ready to Start'}
              </span>

              {linkedActivity && (
                <span className="mt-2 text-[11px] text-brand-slate/60 dark:text-gray-400 max-w-[200px] truncate">
                  🎯 {linkedActivity.title}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons: Start / Pause / Resume / Reset / Skip */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center">
            {isRunning ? (
              <Button
                variant="primary"
                size="lg"
                onClick={pauseTimer}
                leftIcon={<Pause className="w-5 h-5 fill-current" />}
              >
                Pause
              </Button>
            ) : isPaused ? (
              <Button
                variant="primary"
                size="lg"
                onClick={resumeTimer}
                leftIcon={<Play className="w-5 h-5 fill-current" />}
              >
                Resume
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onClick={startTimer}
                leftIcon={<Play className="w-5 h-5 fill-current" />}
              >
                Start Focus
              </Button>
            )}

            <Button
              variant="secondary"
              size="lg"
              onClick={resetTimer}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Reset
            </Button>

            {mode === 'pomodoro' && (
              <Button
                variant="ghost"
                size="md"
                onClick={skipSession}
                leftIcon={<SkipForward className="w-4 h-4" />}
              >
                Skip Break
              </Button>
            )}
          </div>

          {/* Pomodoro Cycles Completed Tracker */}
          <div className="mt-8 flex items-center gap-2">
            <span className="text-xs text-brand-slate/60 dark:text-gray-400 font-medium">Completed cycles:</span>
            <div className="flex gap-1.5">
              {[0, 1, 2, 3].map((cycleIdx) => (
                <div
                  key={cycleIdx}
                  className={`w-3.5 h-3.5 rounded-full transition-all ${
                    sessionsCompletedCount % 4 > cycleIdx || (sessionsCompletedCount > 0 && sessionsCompletedCount % 4 === 0)
                      ? 'bg-gradient-to-r from-brand-mint to-brand-cyan shadow-sm scale-110'
                      : 'bg-brand-violet/20 dark:bg-brand-violet/40'
                  }`}
                  title={`Session ${cycleIdx + 1} of 4 before Long Break`}
                />
              ))}
            </div>
          </div>
        </Card>

        {/* Right Column: Link Learning Activity, Honest Tracking, & History (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Link Learning Activity Card */}
          <Card padding="md">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-brand-cyan" />
              <h3 className="font-bold text-sm text-brand-midnight dark:text-white">
                Link to Learning Activity
              </h3>
            </div>
            <p className="text-xs text-brand-slate/70 dark:text-gray-300 mb-3">
              Associate this session with a specific topic from your roadmap:
            </p>

            <select
              value={linkedActivity?.id || ''}
              onChange={(e) => {
                const found = SAMPLE_ACTIVITIES.find((a) => a.id === e.target.value);
                setLinkedActivity(found || null);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-brand-violet/20 bg-brand-violet/5 dark:bg-[#1C1742] text-brand-slate dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan"
            >
              <option value="">-- No specific activity (General study) --</option>
              {SAMPLE_ACTIVITIES.map((act) => (
                <option key={act.id} value={act.id}>
                  {act.subject}: {act.title}
                </option>
              ))}
            </select>

            {/* Session Notes */}
            <div className="mt-4">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-brand-slate/80 dark:text-gray-300 mb-1">
                <PenLine className="w-3.5 h-3.5 text-brand-violet" />
                Session Notes (Optional)
              </label>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="What did you solve or study during this session?"
                rows={2}
                className="w-full px-3 py-2 text-xs rounded-xl border border-brand-violet/20 bg-brand-violet/5 dark:bg-[#1C1742] text-brand-slate dark:text-white placeholder:text-brand-slate/40 focus:outline-none focus:ring-2 focus:ring-brand-cyan"
              />
            </div>
          </Card>

          {/* Honest Study Tracking Notice Card */}
          <Card padding="md" className="border-l-4 border-l-brand-cyan bg-brand-cyan/5 dark:bg-brand-cyan/5">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-brand-cyan flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-brand-midnight dark:text-white">
                  Honest Tracking Principle
                </h4>
                <p className="text-[11px] text-brand-slate/70 dark:text-gray-300 mt-1 leading-relaxed">
                  Mindora AI labels this as <strong>self-timed study time</strong>. Time logged on this timer 
                  helps you maintain study habits, but does not inherently claim true conceptual mastery. 
                  Mastery ratings are generated exclusively through diagnostic quizzes and retrieval tests.
                </p>
              </div>
            </div>
          </Card>

          {/* Today's Focus Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#151231] border border-brand-violet/15 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-violet/10 text-brand-violet dark:text-brand-cyan">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-slate/50 dark:text-gray-400">Today</span>
                <p className="font-mono font-bold text-lg text-brand-midnight dark:text-white">
                  {stats.todayMinutes} mins
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#151231] border border-brand-violet/15 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-orchid/10 text-brand-orchid">
                <Flame className="w-5 h-5 text-brand-amber" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-slate/50 dark:text-gray-400">This Week</span>
                <p className="font-mono font-bold text-lg text-brand-midnight dark:text-white">
                  {Math.round(stats.weeklyTotalMinutes / 60)} hrs
                </p>
              </div>
            </div>
          </div>

          {/* Session History List */}
          <Card padding="md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-brand-midnight dark:text-white flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-brand-violet" />
                Session History
              </h3>
              <span className="text-[10px] font-mono text-brand-slate/50 dark:text-gray-400">
                {sessionsHistory.length} recorded
              </span>
            </div>

            {sessionsHistory.length === 0 ? (
              <div className="py-8 text-center text-xs text-brand-slate/50 dark:text-gray-400">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No study sessions logged yet today.</p>
                <p className="text-[11px] text-brand-slate/40 mt-1">Start the timer to build your focus log!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {sessionsHistory.map((s, idx) => (
                  <div
                    key={s.id || idx}
                    className="p-2.5 rounded-xl bg-brand-violet/5 dark:bg-[#1C1742] border border-brand-violet/10 text-xs flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-semibold text-brand-midnight dark:text-white truncate">
                        {s.activity_title || `${s.mode.toUpperCase()} Session`}
                      </p>
                      {s.notes && (
                        <p className="text-[11px] text-brand-slate/60 dark:text-gray-400 italic truncate">
                          "{s.notes}"
                        </p>
                      )}
                      <span className="text-[10px] text-brand-slate/40 dark:text-gray-400">
                        {new Date(s.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="font-mono font-bold text-brand-violet dark:text-brand-cyan">
                        {Math.round(s.actual_seconds / 60)}m
                      </span>
                      <span className="block text-[10px] text-brand-mint font-medium flex items-center gap-0.5 justify-end">
                        <CheckCircle2 className="w-3 h-3" /> Done
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

