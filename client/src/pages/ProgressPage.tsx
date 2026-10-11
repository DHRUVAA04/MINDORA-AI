import React from 'react';
import { Card } from '../components/ui/Card';
import { TrendingUp, Clock, CheckCircle2, Flame, Award, Info, BarChart2 } from 'lucide-react';

export const ProgressPage: React.FC = () => {
  const weeklyData = [
    { day: 'Mon', focusMinutes: 60, quizzes: 3 },
    { day: 'Tue', focusMinutes: 45, quizzes: 2 },
    { day: 'Wed', focusMinutes: 90, quizzes: 4 },
    { day: 'Thu', focusMinutes: 75, quizzes: 3 },
    { day: 'Fri', focusMinutes: 30, quizzes: 1 },
    { day: 'Sat', focusMinutes: 120, quizzes: 5 },
    { day: 'Sun', focusMinutes: 80, quizzes: 2 },
  ];

  const maxMinutes = Math.max(...weeklyData.map((d) => d.focusMinutes));

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-midnight dark:text-white tracking-tight flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-brand-mint" />
          Analytics & Progress Dashboard
        </h2>
        <p className="text-xs sm:text-sm text-brand-slate/70 dark:text-gray-300 mt-1">
          Comprehensive breakdown of your study consistency, self-timed sessions, and diagnostic mastery.
        </p>
      </div>

      {/* Honest Tracking Banner */}
      <Card padding="md" className="border-l-4 border-l-brand-cyan bg-brand-cyan/5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-brand-cyan flex-shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <h3 className="font-bold text-brand-midnight dark:text-white">Honest Metrics Distinction</h3>
            <p className="text-brand-slate/70 dark:text-gray-300 mt-0.5">
              Self-timed focus minutes gauge consistency and cognitive stamina. Actual topic comprehension 
              is measured independently through accuracy on randomized retrieval quizzes.
            </p>
          </div>
        </div>
      </Card>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#151231] border border-brand-violet/15 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand-violet/10 text-brand-violet dark:text-brand-cyan">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-brand-slate/50 dark:text-gray-400">Total Focus</span>
            <p className="font-mono font-bold text-xl text-brand-midnight dark:text-white">8.3 hrs</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#151231] border border-brand-violet/15 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand-mint/10 text-brand-mint">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-brand-slate/50 dark:text-gray-400">Quiz Accuracy</span>
            <p className="font-mono font-bold text-xl text-brand-midnight dark:text-white">78.4%</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#151231] border border-brand-violet/15 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand-amber/10 text-brand-amber">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-brand-slate/50 dark:text-gray-400">Daily Streak</span>
            <p className="font-mono font-bold text-xl text-brand-midnight dark:text-white">6 Days</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#151231] border border-brand-violet/15 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand-orchid/10 text-brand-orchid">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-brand-slate/50 dark:text-gray-400">Mastered Units</span>
            <p className="font-mono font-bold text-xl text-brand-midnight dark:text-white">18 Topics</p>
          </div>
        </div>
      </div>

      {/* Weekly Focus Chart */}
      <Card padding="lg" className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-brand-midnight dark:text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-brand-violet dark:text-brand-cyan" />
            Weekly Focus Distribution (Self-Timed Minutes)
          </h3>
          <span className="text-xs font-mono text-brand-slate/50 dark:text-gray-400">Past 7 Days</span>
        </div>

        <div className="h-48 flex items-end justify-between gap-2 sm:gap-6 pt-6 pb-2 px-2 border-b border-brand-violet/10">
          {weeklyData.map((d, idx) => {
            const heightPercent = Math.round((d.focusMinutes / maxMinutes) * 100);
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                {/* Tooltip on hover */}
                <span className="text-[10px] font-mono font-bold text-brand-violet dark:text-brand-cyan opacity-0 group-hover:opacity-100 transition-opacity">
                  {d.focusMinutes}m
                </span>

                {/* Bar */}
                <div className="w-full max-w-[40px] bg-brand-violet/10 dark:bg-brand-violet/25 rounded-t-xl overflow-hidden h-full flex items-end">
                  <div
                    className="w-full bg-gradient-to-t from-brand-violet to-brand-cyan rounded-t-xl transition-all duration-300 group-hover:brightness-110"
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>

                {/* Day label */}
                <span className="text-xs font-semibold text-brand-slate/70 dark:text-gray-300">
                  {d.day}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

