import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TopicStatus } from '../theme/tokens';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  Filter,
  ArrowRight,
  BookOpen,
  Timer,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTimerStore } from '../store/timerStore';
import { apiClient } from '../api/client';

interface TopicItem {
  id: string;
  subject: string;
  title: string;
  status: TopicStatus;
  score?: number;
  prerequisites?: string;
  estimated_hours?: number;
}

export const SkillGapsPage: React.FC = () => {
  const navigate = useNavigate();
  const { setMode, setLinkedActivity, startTimer } = useTimerStore();
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | TopicStatus>('all');

  useEffect(() => {
    let isMounted = true;
    apiClient<{ topics: TopicItem[] }>('/api/user/topics')
      .then((res) => {
        if (isMounted) {
          setTopics(res.topics || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Could not load topics:', err);
        if (isMounted) {
          setTopics([]);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const masteredCount = topics.filter((t) => t.status === 'mastered').length;
  const inProgressCount = topics.filter((t) => t.status === 'inProgress').length;
  const weakCount = topics.filter((t) => t.status === 'weak').length;
  const unassessedCount = topics.filter((t) => t.status === 'unassessed').length;

  const filteredTopics = topics.filter((t) => {
    if (activeFilter === 'all') return true;
    return t.status === activeFilter;
  });

  const handleStartTopicTimer = (topic: TopicItem) => {
    setLinkedActivity({
      id: topic.id,
      title: topic.title,
      subject: topic.subject,
    });
    setMode('pomodoro');
    startTimer();
    navigate('/timer');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-midnight dark:text-white tracking-tight">
            Skill Gaps & Knowledge Map
          </h2>
          <p className="text-xs sm:text-sm text-brand-slate/70 dark:text-gray-300 mt-1 max-w-2xl">
            Visualizing your competency levels across your academic curriculum.
            Semantic colors clearly distinguish mastered topics, revision areas, weak gaps, and unassessed subjects.
          </p>
        </div>

        <Button
          variant="secondary"
          size="md"
          onClick={() => navigate('/diagnostic')}
          leftIcon={<Sparkles className="w-4 h-4 text-brand-orchid" />}
        >
          Take Diagnostic
        </Button>
      </div>

      {/* Semantic Legend & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#151231] border border-brand-violet/15 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-brand-slate/70 dark:text-gray-300">
          <Filter className="w-4 h-4 text-brand-violet" />
          <span>Filter Status:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeFilter === 'all'
                ? 'bg-brand-midnight dark:bg-white text-white dark:text-brand-midnight'
                : 'bg-brand-violet/10 hover:bg-brand-violet/20 text-brand-slate dark:text-gray-200'
            }`}
          >
            All Topics ({topics.length})
          </button>

          <button
            onClick={() => setActiveFilter('mastered')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeFilter === 'mastered'
                ? 'bg-brand-mint text-brand-midnight font-bold shadow-sm'
                : 'bg-brand-mint/15 text-brand-mint hover:bg-brand-mint/25'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Mastered ({masteredCount})
          </button>

          <button
            onClick={() => setActiveFilter('inProgress')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeFilter === 'inProgress'
                ? 'bg-brand-amber text-brand-midnight font-bold shadow-sm'
                : 'bg-brand-amber/15 text-brand-amber hover:bg-brand-amber/25'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> In Progress ({inProgressCount})
          </button>

          <button
            onClick={() => setActiveFilter('weak')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeFilter === 'weak'
                ? 'bg-brand-coral text-white font-bold shadow-sm'
                : 'bg-brand-coral/15 text-brand-coral hover:bg-brand-coral/25'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Weak Gaps ({weakCount})
          </button>

          <button
            onClick={() => setActiveFilter('unassessed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeFilter === 'unassessed'
                ? 'bg-brand-cyan text-brand-midnight font-bold shadow-sm'
                : 'bg-brand-cyan/15 text-brand-cyan hover:bg-brand-cyan/25'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" /> Unassessed ({unassessedCount})
          </button>
        </div>
      </div>

      {/* Empty State when no topics exist in the student's account */}
      {topics.length === 0 && !loading && (
        <Card padding="lg" className="text-center py-12 max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-violet/10 flex items-center justify-center text-brand-violet dark:text-brand-cyan">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-brand-midnight dark:text-white">
            No assessed topics yet
          </h3>
          <p className="text-xs sm:text-sm text-brand-slate/70 dark:text-gray-300">
            Take your first diagnostic quiz to establish your baseline. Topics will be automatically classified into Mastered, In Progress, and Weak Gaps.
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/diagnostic')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Start Diagnostic Assessment
          </Button>
        </Card>
      )}

      {/* Topics Grid */}
      {filteredTopics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTopics.map((topic) => (
            <Card
              key={topic.id}
              status={topic.status}
              padding="md"
              className="flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-brand-slate/50 dark:text-gray-400">
                    {topic.subject}
                  </span>

                  {/* Semantic status pill */}
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      topic.status === 'mastered'
                        ? 'bg-brand-mint/20 text-brand-mint'
                        : topic.status === 'inProgress'
                        ? 'bg-brand-amber/20 text-brand-amber'
                        : topic.status === 'weak'
                        ? 'bg-brand-coral/20 text-brand-coral'
                        : 'bg-brand-cyan/20 text-brand-cyan'
                    }`}
                  >
                    {topic.status === 'unassessed'
                      ? 'Unassessed'
                      : topic.status === 'inProgress'
                      ? 'In Progress'
                      : topic.status === 'weak'
                      ? 'Weak Gap'
                      : 'Mastered'}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-brand-midnight dark:text-white mt-1">
                  {topic.title}
                </h4>

                {topic.score !== undefined ? (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 bg-brand-violet/10 dark:bg-brand-violet/20 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          topic.status === 'mastered'
                            ? 'bg-brand-mint'
                            : topic.status === 'inProgress'
                            ? 'bg-brand-amber'
                            : 'bg-brand-coral'
                        }`}
                        style={{ width: `${topic.score}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs font-bold text-brand-midnight dark:text-white">
                      {topic.score}%
                    </span>
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] text-brand-cyan italic">
                    Not yet evaluated. Take the diagnostic to establish baseline score.
                  </p>
                )}

                {/* Prerequisites */}
                {topic.prerequisites && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="text-brand-slate/50 dark:text-gray-400 font-semibold">Prerequisites:</span>
                    <span className="px-1.5 py-0.5 rounded bg-brand-violet/5 dark:bg-brand-violet/15 text-brand-slate/70 dark:text-gray-300">
                      {topic.prerequisites}
                    </span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-3 border-t border-brand-violet/10 dark:border-brand-violet/20 flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleStartTopicTimer(topic)}
                  leftIcon={<Timer className="w-3.5 h-3.5 text-brand-cyan" />}
                >
                  Study Timer
                </Button>

                <Button
                  variant={topic.status === 'weak' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => navigate('/practice')}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Practice Topic
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
