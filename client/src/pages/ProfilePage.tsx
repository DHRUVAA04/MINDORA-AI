import React from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../theme/themeStore';
import {
  UserCheck,
  Moon,
  Sun,
  Clock,
  Shield,
  Trash2,
  Download,
  CheckCircle2,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const { theme, setTheme, clockFormat, setClockFormat } = useThemeStore();

  const handleClearLocalLogs = () => {
    if (confirm('Clear local study timer logs from browser cache?')) {
      localStorage.removeItem('mindora_timer_state');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-midnight dark:text-white tracking-tight flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-brand-violet" />
          Profile & Application Settings
        </h2>
        <p className="text-xs sm:text-sm text-brand-slate/70 dark:text-gray-300 mt-1">
          Customize your display preferences, persistent clock configuration, and manage study data privacy.
        </p>
      </div>

      {/* User Info Card */}
      <Card padding="md" className="space-y-4">
        <h3 className="text-base font-bold text-brand-midnight dark:text-white flex items-center gap-2">
          Student Profile
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-[10px] font-bold uppercase text-brand-slate/50 dark:text-gray-400">
              Full Name
            </label>
            <p className="font-semibold text-sm text-brand-midnight dark:text-white mt-0.5">
              {user?.name || 'Alex Chen'}
            </p>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-brand-slate/50 dark:text-gray-400">
              Email Address
            </label>
            <p className="font-semibold text-sm text-brand-midnight dark:text-white mt-0.5">
              {user?.email || 'student@mindora.ai'}
            </p>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-brand-slate/50 dark:text-gray-400">
              Academic Goal Track
            </label>
            <p className="font-semibold text-sm text-brand-violet dark:text-brand-cyan mt-0.5">
              {user?.target_exam || 'GATE / Semester Exam 2026'}
            </p>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-brand-slate/50 dark:text-gray-400">
              Weekly Target Hours
            </label>
            <p className="font-semibold text-sm text-brand-midnight dark:text-white mt-0.5">
              {user?.weekly_target_hours || 20} hrs / week
            </p>
          </div>
        </div>
      </Card>

      {/* Display & Clock Settings */}
      <Card padding="md" className="space-y-6">
        <h3 className="text-base font-bold text-brand-midnight dark:text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-brand-cyan" />
          Display & Real-Time Clock Preferences
        </h3>

        {/* 12h vs 24h Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-brand-violet/10 dark:border-brand-violet/20">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-brand-midnight dark:text-white">
              Clock Time Display Format
            </h4>
            <p className="text-xs text-brand-slate/60 dark:text-gray-400">
              Choose how the persistent top-bar clock renders current device time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setClockFormat('12h')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                clockFormat === '12h'
                  ? 'bg-gradient-to-r from-brand-violet to-brand-orchid text-white shadow-violet-glow'
                  : 'bg-brand-violet/10 text-brand-slate dark:text-gray-300 hover:bg-brand-violet/20'
              }`}
            >
              12-Hour (e.g. 11:30 PM)
            </button>
            <button
              onClick={() => setClockFormat('24h')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                clockFormat === '24h'
                  ? 'bg-gradient-to-r from-brand-violet to-brand-orchid text-white shadow-violet-glow'
                  : 'bg-brand-violet/10 text-brand-slate dark:text-gray-300 hover:bg-brand-violet/20'
              }`}
            >
              24-Hour (e.g. 23:30)
            </button>
          </div>
        </div>

        {/* Theme Mode Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-brand-midnight dark:text-white">
              Theme Palette
            </h4>
            <p className="text-xs text-brand-slate/60 dark:text-gray-400">
              Toggle between Lavender Mist (Light) and Aurora Deep Space (Dark).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                theme === 'light'
                  ? 'bg-brand-midnight text-white shadow-sm'
                  : 'bg-brand-violet/10 text-brand-slate hover:bg-brand-violet/20'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-brand-amber" />
              Lavender Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-brand-violet to-brand-cyan text-white shadow-violet-glow'
                  : 'bg-brand-violet/10 text-gray-300 hover:bg-brand-violet/20'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-brand-cyan" />
              Deep Space Dark
            </button>
          </div>
        </div>
      </Card>

      {/* Privacy & Local Data Management */}
      <Card padding="md" className="space-y-4">
        <h3 className="text-base font-bold text-brand-midnight dark:text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-brand-mint" />
          Privacy & Storage Controls
        </h3>
        <p className="text-xs text-brand-slate/70 dark:text-gray-300">
          Mindora AI respects student data autonomy. You may download your complete session history or reset local browser state at any moment.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const data = localStorage.getItem('mindora_timer_state');
              const blob = new Blob([data || '{}'], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `mindora-study-export-${Date.now()}.json`;
              a.click();
            }}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export Local Focus Logs
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={handleClearLocalLogs}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Clear Browser Study Cache
          </Button>
        </div>
      </Card>
    </div>
  );
};

