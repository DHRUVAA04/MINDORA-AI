import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  Sparkles,
  Target,
  Timer,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  BookOpen,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTimerStore } from '../store/timerStore';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../api/client';

interface DashboardData {
  is_empty: boolean;
  has_sample_data: boolean;
  user_name: string;
  target_exam: string;
  mastered_count: number;
  in_progress_count: number;
  weak_count: number;
  unassessed_count: number;
  prioritized_topics: Array<{
    id: string;
    subject: string;
    title: string;
    status: 'mastered' | 'inProgress' | 'weak' | 'unassessed';
    estimated_hours?: number;
    score?: number;
  }>;
  weekly_target_hours: number;
  self_timed_hours: number;
  goals_count: number;
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { startTimer, setMode } = useTimerStore();
  const { user } = useAuthStore();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    apiClient<DashboardData>('/api/user/dashboard')
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Could not load dashboard data from API:', err);
        if (isMounted) {
          // Fallback to initial zeros / empty state
          setData({
            is_empty: true,
            has_sample_data: false,
            user_name: user?.name || 'Student',
            target_exam: 'GATE / University Track 2026',
            mastered_count: 0,
            in_progress_count: 0,
            weak_count: 0,
            unassessed_count: 0,
            prioritized_topics: [],
            weekly_target_hours: 20,
            self_timed_hours: 0,
            goals_count: 0,
          });
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleQuickFocus = () => {
    setMode('pomodoro');
    startTimer();
    navigate('/timer');
  };

  const displayName = user?.name || data?.user_name || 'Student';
  const firstName = displayName.split(' ')[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Nebula Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-brand-midnight via-[#4C1D95] to-brand-violet text-white shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-brand-cyan text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome back, {firstName} • {data?.target_exam || 'Active Track'}</span>
          </div>

          {data?.has_sample_data && (
            <div className="mb-3 inline-block px-2.5 py-0.5 rounded-full bg-brand-amber/20 border border-brand-amber/40 text-brand-amber text-[11px] font-bold">
              Sample data — take a quiz to replace
            </div>
          )}

          <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Elevate Your Mastery with <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan via-brand-orchid to-brand-mint">Mindora AI</span>
          </h2>

          <p className="mt-2 text-xs sm:text-sm text-gray-200 leading-relaxed">
            {data?.is_empty
              ? 'Your personalized study nebula is ready. Take your first diagnostic quiz to uncover strengths and configure your learning path.'
              : `${data?.weak_count || 0} weak areas identified for review. Your personalized focus blocks and AI mentor are prepared.`}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              variant="mastery"
              size="md"
              onClick={handleQuickFocus}
              leftIcon={<Timer className="w-4 h-4" />}
            >
              Start 25m Focus Block
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate('/diagnostic')}
              className="bg-white/20 text-white border-white/30 hover:bg-white/30"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {data?.is_empty ? 'Start First Diagnostic' : 'Diagnostic Assessment'}
            </Button>
          </div>
        </div>

        {/* Ambient background glow decoration */}
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-brand-orchid/30 blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-20 w-64 h-64 rounded-full bg-brand-cyan/20 blur-2xl pointer-events-none" />
      </div>

      {/* Semantic Mastery Status Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Mastered (Mint) */}
        <Card status="mastered" padding="md" onClick={() => navigate('/skill-gaps')}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-mint flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Mastered
            </span>
            <span className="font-mono text-2xl font-black text-brand-midnight dark:text-white">
              {loading ? '-' : data?.mastered_count ?? 0}
            </span>
          </div>
          <p className="text-xs text-brand-slate/60 dark:text-gray-400 mt-2">Score ≥ 80%</p>
        </Card>

        {/* In Progress / Needs Revision (Amber) */}
        <Card status="inProgress" padding="md" onClick={() => navigate('/skill-gaps')}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-amber flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" /> In Progress
            </span>
            <span className="font-mono text-2xl font-black text-brand-midnight dark:text-white">
              {loading ? '-' : data?.in_progress_count ?? 0}
            </span>
          </div>
          <p className="text-xs text-brand-slate/60 dark:text-gray-400 mt-2">Active revision required</p>
        </Card>

        {/* Weak Topic (Coral) */}
        <Card status="weak" padding="md" onClick={() => navigate('/skill-gaps')}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-coral flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Weak Areas
            </span>
            <span className="font-mono text-2xl font-black text-brand-midnight dark:text-white">
              {loading ? '-' : data?.weak_count ?? 0}
            </span>
          </div>
          <p className="text-xs text-brand-slate/60 dark:text-gray-400 mt-2">Score &lt; 50%</p>
        </Card>

        {/* Unassessed / Info (Cyan) */}
        <Card status="unassessed" padding="md" onClick={() => navigate('/diagnostic')}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-cyan flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" /> Unassessed
            </span>
            <span className="font-mono text-2xl font-black text-brand-midnight dark:text-white">
              {loading ? '-' : data?.unassessed_count ?? 0}
            </span>
          </div>
          <p className="text-xs text-brand-slate/60 dark:text-gray-400 mt-2">Not yet tested</p>
        </Card>
      </div>

      {/* Empty State Banner if student has not taken any diagnostic */}
      {data?.is_empty && !loading && (
        <Card padding="lg" className="border-dashed border-2 border-brand-violet/30 bg-brand-violet/5 dark:bg-brand-violet/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-violet dark:text-brand-cyan uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /> Getting Started
              </div>
              <h3 className="text-base sm:text-lg font-bold text-brand-midnight dark:text-white">
                Take your first diagnostic quiz to build your learning path
              </h3>
              <p className="text-xs sm:text-sm text-brand-slate/70 dark:text-gray-300">
                Your diagnostic takes about 5 minutes and evaluates key concepts to calibrate your study plan and AI Mentor.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/diagnostic')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="flex-shrink-0"
            >
              Start Diagnostic
            </Button>
          </div>
        </Card>
      )}

      {/* Two Column Section: Prioritized Topics + Study Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Prioritized Topics (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-brand-midnight dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-violet" />
              Prioritized Study Roadmap
            </h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/skill-gaps')}>
              View All Topics
            </Button>
          </div>

          <div className="space-y-3">
            {data && data.prioritized_topics && data.prioritized_topics.length > 0 ? (
              data.prioritized_topics.map((t) => (
                <Card
                  key={t.id}
                  padding="md"
                  status={t.status}
                  onClick={() => navigate('/practice')}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            t.status === 'weak'
                              ? 'bg-brand-coral/15 text-brand-coral'
                              : 'bg-brand-amber/15 text-brand-amber'
                          }`}
                        >
                          {t.status === 'weak' ? 'Critical Weak Gap' : 'In Revision'}
                        </span>
                        <span className="text-xs font-semibold text-brand-slate/60 dark:text-gray-400">
                          {t.subject}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-brand-midnight dark:text-white mt-1">
                        {t.title}
                      </h4>
                      <p className="text-xs text-brand-slate/70 dark:text-gray-300 mt-0.5">
                        Estimated: {t.estimated_hours || 2} hrs • {t.score !== undefined ? `Current accuracy: ${t.score}%` : 'Practice quiz available'}
                      </p>
                    </div>
                    <Button variant={t.status === 'weak' ? 'primary' : 'secondary'} size="sm">
                      Practice Now
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <Card padding="md" className="text-center py-8">
                <BookOpen className="w-8 h-8 mx-auto text-brand-violet/40 mb-2" />
                <p className="text-sm font-semibold text-brand-midnight dark:text-white">
                  No active prioritized topics
                </p>
                <p className="text-xs text-brand-slate/60 dark:text-gray-400 mt-1">
                  Complete a diagnostic quiz to automatically generate prioritized practice recommendations.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/diagnostic')}
                  className="mt-3"
                >
                  Take Diagnostic
                </Button>
              </Card>
            )}
          </div>
        </div>

        {/* Right Quick Actions & Habit Goals (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-base sm:text-lg font-bold text-brand-midnight dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-brand-cyan" />
            Weekly Habit Goals
          </h3>

          <Card padding="md">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-brand-slate dark:text-gray-200 mb-1">
                  <span>Self-timed Study Time</span>
                  <span className="font-mono text-brand-violet dark:text-brand-cyan">
                    {data?.self_timed_hours ?? 0} / {data?.weekly_target_hours ?? 20} hrs
                  </span>
                </div>
                <div className="w-full bg-brand-violet/10 dark:bg-brand-violet/20 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-brand-violet to-brand-cyan h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(((data?.self_timed_hours || 0) / (data?.weekly_target_hours || 20)) * 100)
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-brand-slate dark:text-gray-200 mb-1">
                  <span>Active Goals</span>
                  <span className="font-mono text-brand-mint">
                    {data?.goals_count ?? 0} active
                  </span>
                </div>
                <div className="w-full bg-brand-violet/10 dark:bg-brand-violet/20 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-brand-mint to-brand-cyan h-full rounded-full"
                    style={{ width: data?.goals_count ? '100%' : '15%' }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-brand-violet/10 dark:border-brand-violet/20 space-y-2">
                <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/goals')}>
                  Manage Academic Goals
                </Button>
                <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate('/timetable')}>
                  View Study Timetable
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
