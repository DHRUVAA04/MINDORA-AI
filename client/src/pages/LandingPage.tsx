import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Brain, Sparkles, Timer, Bot, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F5F3FF] dark:bg-[#0B0A1A] text-brand-slate dark:text-gray-100 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-brand-violet/10 dark:border-brand-violet/20 bg-white/70 dark:bg-[#0F0D24]/70 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-midnight via-brand-violet to-brand-orchid flex items-center justify-center shadow-violet-glow">
            <Brain className="w-6 h-6 text-brand-cyan" />
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-brand-violet via-brand-orchid to-brand-cyan bg-clip-text text-transparent">
            MINDORA AI
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
            Log in
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/register')} rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
            Get started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 sm:py-20 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-violet/10 dark:bg-brand-violet/25 text-brand-violet dark:text-brand-cyan text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Generation Adaptive Study Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-brand-midnight dark:text-white max-w-3xl leading-tight">
          Master Complex Subjects with{' '}
          <span className="bg-gradient-to-r from-brand-violet via-brand-orchid to-brand-cyan bg-clip-text text-transparent">
            Your Aurora Study Mentor
          </span>
        </h1>

        <p className="mt-4 text-sm sm:text-base text-brand-slate/70 dark:text-gray-300 max-w-2xl leading-relaxed">
          Mindora AI pairs personalized diagnostic knowledge mapping with deep Pomodoro focus cycles, 
          honest study tracking, and a friendly Socratic AI teacher.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/register')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="px-8 shadow-violet-glow"
          >
            Get Started Free
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate('/login')}
          >
            I already have an account
          </Button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-16 sm:mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#151231] border border-brand-violet/15 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-brand-mint/15 text-brand-mint flex items-center justify-center mb-4">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-brand-midnight dark:text-white">
              Adaptive Knowledge Mapping
            </h3>
            <p className="mt-1 text-xs text-brand-slate/70 dark:text-gray-300 leading-relaxed">
              Diagnostic assessments pinpoint weak conceptual gaps without fake scores, prioritizing high-yield revision topics.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#151231] border border-brand-violet/15 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-brand-cyan/15 text-brand-cyan flex items-center justify-center mb-4">
              <Timer className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-brand-midnight dark:text-white">
              Aurora Focus Studio
            </h3>
            <p className="mt-1 text-xs text-brand-slate/70 dark:text-gray-300 leading-relaxed">
              Drift-free, timestamp-accurate Pomodoro sessions that keep running seamlessly across browser tabs and device reloads.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#151231] border border-brand-violet/15 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-brand-orchid/15 text-brand-orchid flex items-center justify-center mb-4">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-brand-midnight dark:text-white">
              Socratic AI Mentor
            </h3>
            <p className="mt-1 text-xs text-brand-slate/70 dark:text-gray-300 leading-relaxed">
              A kind, patient mentor that teaches with intuitive hints first, verifies arithmetic, and references your lecture notes.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-brand-violet/10 dark:border-brand-violet/20 text-center text-xs text-brand-slate/60 dark:text-gray-400">
        <p>© 2026 Mindora AI. Designed with Aurora Study Nebula design tokens. WCAG AA compliant.</p>
      </footer>
    </div>
  );
};

