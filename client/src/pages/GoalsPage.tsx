import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  Target,
  ChevronRight,
  ChevronLeft,
  Plus,
  Clock,
  Sparkles,
  AlertTriangle,
  Calendar,
  Trash2,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

interface GoalItem {
  id: string;
  title: string;
  target: string;
  deadline: string;
  weekly_hours: number;
  completed_weeks: number;
  total_weeks: number;
  status: string;
  is_overdue?: boolean;
}

export const GoalsPage: React.FC = () => {
  const navigate = useNavigate();
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreatingGoal, setIsCreatingGoal] = useState(false);
  const [flowStep, setFlowStep] = useState(1);

  // Tomorrow's date as min for date input
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split('T')[0];

  // Default future dates in current/upcoming term (e.g. Dec 2026)
  const defaultFutureDate = new Date();
  defaultFutureDate.setMonth(defaultFutureDate.getMonth() + 3);
  const defaultFutureDateStr = defaultFutureDate.toISOString().split('T')[0];

  const [examName, setExamName] = useState('GATE 2026 CS & IT');
  const [targetScore, setTargetScore] = useState('780+');
  const [weeklyHours, setWeeklyHours] = useState(20);
  const [examDate, setExamDate] = useState(defaultFutureDateStr);
  const [dateError, setDateError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Editing deadline state
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [newDeadline, setNewDeadline] = useState('');
  const [editDateError, setEditDateError] = useState('');

  const loadGoals = () => {
    apiClient<{ goals: GoalItem[] }>('/api/user/goals')
      .then((res) => {
        setGoals(res.goals || []);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Could not load goals:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const handleValidateDate = (dateVal: string): boolean => {
    const selected = new Date(dateVal);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(selected.getTime()) || selected < today) {
      setDateError('Deadline must be a date in the future');
      return false;
    }
    setDateError('');
    return true;
  };

  const handleFinishCreate = async () => {
    if (!handleValidateDate(examDate)) return;

    setSubmitting(true);
    try {
      await apiClient('/api/user/goals', {
        method: 'POST',
        body: JSON.stringify({
          title: examName,
          target: targetScore,
          deadline: examDate,
          weekly_hours: weeklyHours,
        }),
      });
      setIsCreatingGoal(false);
      setFlowStep(1);
      loadGoals();
    } catch (err: any) {
      setDateError(err.message || 'Failed to create goal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEditDeadline = (goal: GoalItem) => {
    setEditingGoalId(goal.id);
    setNewDeadline(goal.deadline.slice(0, 10));
    setEditDateError('');
  };

  const handleSaveDeadline = async (goalId: string) => {
    const selected = new Date(newDeadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(selected.getTime()) || selected < today) {
      setEditDateError('Deadline must be in the future');
      return;
    }

    try {
      await apiClient(`/api/user/goals/${goalId}`, {
        method: 'PUT',
        body: JSON.stringify({ deadline: newDeadline }),
      });
      setEditingGoalId(null);
      loadGoals();
    } catch (err: any) {
      setEditDateError(err.message || 'Could not update deadline');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!window.confirm('Are you sure you want to remove this academic goal?')) return;
    try {
      await apiClient(`/api/user/goals/${goalId}`, { method: 'DELETE' });
      loadGoals();
    } catch (err) {
      console.error('Delete goal failed:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-brand-slate/60 dark:text-gray-400">
        <button onClick={() => navigate('/')} className="hover:text-brand-violet dark:hover:text-brand-cyan">
          Dashboard
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-brand-midnight dark:text-white">Academic Goals</span>
        {isCreatingGoal && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-brand-violet dark:text-brand-cyan">Goal Creation Flow (Step {flowStep})</span>
          </>
        )}
      </nav>

      {/* Header & Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-midnight dark:text-white tracking-tight">
            Academic & Exam Goals
          </h2>
          <p className="text-xs sm:text-sm text-brand-slate/70 dark:text-gray-300 mt-1">
            Establish clear target scores and weekly study hours to automatically configure your smart roadmap.
          </p>
        </div>

        {!isCreatingGoal && (
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setIsCreatingGoal(true);
              setFlowStep(1);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create New Goal
          </Button>
        )}
      </div>

      {/* Multi-Step Creation Flow */}
      {isCreatingGoal ? (
        <Card padding="lg" className="space-y-6">
          {/* Step Progress Pills */}
          <div className="flex items-center justify-between border-b border-brand-violet/10 dark:border-brand-violet/20 pb-4">
            {[
              { num: 1, label: '1. Goal & Exam' },
              { num: 2, label: '2. Pace & Schedule' },
              { num: 3, label: '3. Verify & Confirm' },
            ].map((st) => (
              <div key={st.num} className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    flowStep === st.num
                      ? 'bg-brand-violet text-white shadow-violet-glow'
                      : flowStep > st.num
                      ? 'bg-brand-mint text-brand-midnight'
                      : 'bg-brand-violet/10 text-brand-slate/50'
                  }`}
                >
                  {flowStep > st.num ? '✓' : st.num}
                </span>
                <span className="text-xs font-semibold hidden sm:inline text-brand-slate dark:text-gray-200">
                  {st.label}
                </span>
              </div>
            ))}
          </div>

          {/* Step 1: Target Definition */}
          {flowStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-brand-midnight dark:text-white">
                Step 1: What exam or academic milestone are you targeting?
              </h3>
              <div>
                <label className="block text-xs font-semibold text-brand-slate/80 dark:text-gray-300 mb-1">
                  Target Exam / Course Name
                </label>
                <input
                  type="text"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-brand-violet/20 bg-brand-violet/5 dark:bg-[#1C1742] text-brand-slate dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-slate/80 dark:text-gray-300 mb-1">
                  Target Score / Percentile / Rank
                </label>
                <input
                  type="text"
                  value={targetScore}
                  onChange={(e) => setTargetScore(e.target.value)}
                  placeholder="e.g. 780+ or Top 1%"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-brand-violet/20 bg-brand-violet/5 dark:bg-[#1C1742] text-brand-slate dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan"
                />
              </div>
            </div>
          )}

          {/* Step 2: Timeline & Hours */}
          {flowStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-brand-midnight dark:text-white">
                Step 2: Study Pace & Milestone Deadline
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-slate/80 dark:text-gray-300 mb-1">
                    Exam / Target Date (Must be in the future)
                  </label>
                  <input
                    type="date"
                    min={minDateStr}
                    value={examDate}
                    onChange={(e) => {
                      setExamDate(e.target.value);
                      handleValidateDate(e.target.value);
                    }}
                    className={`w-full px-3.5 py-2 text-xs rounded-xl border bg-brand-violet/5 dark:bg-[#1C1742] text-brand-slate dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan ${
                      dateError ? 'border-brand-coral' : 'border-brand-violet/20'
                    }`}
                  />
                  {dateError && (
                    <p className="text-[11px] text-brand-coral font-medium mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {dateError}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-slate/80 dark:text-gray-300 mb-1">
                    Weekly Study Budget (Hours): <strong className="font-mono text-brand-violet dark:text-brand-cyan">{weeklyHours}h/wk</strong>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="1"
                    value={weeklyHours}
                    onChange={(e) => setWeeklyHours(Number(e.target.value))}
                    className="w-full accent-brand-violet"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {flowStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-brand-midnight dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-orchid" />
                Step 3: Review & Generate Adaptive Roadmap
              </h3>
              <div className="p-4 rounded-xl bg-brand-violet/5 dark:bg-brand-violet/15 border border-brand-violet/15 space-y-2 text-xs">
                <p><strong>Goal:</strong> {examName}</p>
                <p><strong>Target:</strong> {targetScore}</p>
                <p><strong>Exam Date:</strong> {examDate}</p>
                <p><strong>Weekly Commitment:</strong> {weeklyHours} hours per week</p>
              </div>

              {dateError && (
                <p className="text-xs text-brand-coral font-semibold">{dateError}</p>
              )}
            </div>
          )}

          {/* Navigation Controls inside flow */}
          <div className="flex items-center justify-between pt-4 border-t border-brand-violet/10 dark:border-brand-violet/20">
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                if (flowStep === 1) setIsCreatingGoal(false);
                else setFlowStep((prev) => prev - 1);
              }}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              {flowStep === 1 ? 'Cancel' : 'Back'}
            </Button>

            {flowStep < 3 ? (
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  if (flowStep === 2 && !handleValidateDate(examDate)) return;
                  setFlowStep((prev) => prev + 1);
                }}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Next Step
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                disabled={submitting}
                onClick={handleFinishCreate}
                leftIcon={<Target className="w-4 h-4" />}
              >
                {submitting ? 'Saving...' : 'Create Goal & Sync Roadmap'}
              </Button>
            )}
          </div>
        </Card>
      ) : (
        /* Goals List */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((g) => (
            <Card key={g.id} padding="md" className="space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-violet dark:text-brand-cyan">
                      Academic Goal
                    </span>
                    <h3 className="text-base font-bold text-brand-midnight dark:text-white mt-0.5">
                      {g.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {g.is_overdue && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-brand-coral/20 text-brand-coral flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Overdue
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-brand-mint/15 text-brand-mint">
                      {g.status || 'Active'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                  <div className="p-2.5 rounded-xl bg-brand-violet/5 dark:bg-[#1C1742]">
                    <span className="text-[10px] text-brand-slate/50 dark:text-gray-400 block">Target</span>
                    <span className="font-bold text-brand-midnight dark:text-white">{g.target}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-brand-violet/5 dark:bg-[#1C1742]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-brand-slate/50 dark:text-gray-400 block">Deadline</span>
                      <button
                        onClick={() => handleStartEditDeadline(g)}
                        className="text-[10px] text-brand-violet dark:text-brand-cyan hover:underline flex items-center gap-0.5"
                        title="Edit deadline"
                      >
                        <Edit2 className="w-2.5 h-2.5" /> Edit
                      </button>
                    </div>
                    <span className={`font-bold ${g.is_overdue ? 'text-brand-coral' : 'text-brand-midnight dark:text-white'}`}>
                      {g.deadline}
                    </span>
                  </div>
                </div>

                {/* Inline Edit Deadline Drawer */}
                {editingGoalId === g.id && (
                  <div className="mt-3 p-3 rounded-xl bg-brand-violet/10 border border-brand-violet/20 space-y-2">
                    <label className="text-[11px] font-semibold text-brand-slate dark:text-gray-200 block">
                      Choose new future deadline:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        min={minDateStr}
                        value={newDeadline}
                        onChange={(e) => setNewDeadline(e.target.value)}
                        className="px-2.5 py-1 text-xs rounded-lg border border-brand-violet/20 bg-white dark:bg-[#1C1742] text-brand-slate dark:text-white"
                      />
                      <button
                        onClick={() => handleSaveDeadline(g.id)}
                        className="p-1.5 rounded-lg bg-brand-mint text-brand-midnight hover:bg-brand-mint/90"
                        title="Save new deadline"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingGoalId(null)}
                        className="p-1.5 rounded-lg bg-brand-violet/10 text-brand-slate hover:bg-brand-violet/20"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {editDateError && (
                      <p className="text-[11px] text-brand-coral">{editDateError}</p>
                    )}
                  </div>
                )}

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-brand-slate/60 dark:text-gray-400">Roadmap Progress</span>
                    <span className="font-mono text-brand-violet dark:text-brand-cyan">
                      {Math.round(((g.completed_weeks || 1) / (g.total_weeks || 16)) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-brand-violet/10 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-violet to-brand-cyan rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(((g.completed_weeks || 1) / (g.total_weeks || 16)) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-brand-violet/10 dark:border-brand-violet/20 flex justify-between items-center mt-3">
                <span className="text-xs text-brand-slate/60 dark:text-gray-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {g.weekly_hours || 20}h weekly goal
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDeleteGoal(g.id)}
                    className="p-1.5 text-brand-slate/40 hover:text-brand-coral rounded-lg hover:bg-brand-coral/10"
                    title="Remove goal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/roadmap')}>
                    Roadmap →
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {goals.length === 0 && !loading && (
            <div className="col-span-full">
              <Card padding="lg" className="text-center py-10">
                <Target className="w-10 h-10 mx-auto text-brand-violet/30 mb-2" />
                <h3 className="text-base font-bold text-brand-midnight dark:text-white">
                  No academic goals set yet
                </h3>
                <p className="text-xs text-brand-slate/60 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                  Add your target semester exam or competitive test with weekly study hours to sync your schedule.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsCreatingGoal(true)}
                  className="mt-4"
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Create Your First Goal
                </Button>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
