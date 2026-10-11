import React from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  Map,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Timer,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTimerStore } from '../store/timerStore';

export const RoadmapPage: React.FC = () => {
  const navigate = useNavigate();
  const { setLinkedActivity, setMode, startTimer } = useTimerStore();

  const stages = [
    {
      title: 'Stage 1: Mathematical Foundations & Discrete Structures',
      status: 'Completed',
      items: [
        { id: 'r1', title: 'Linear Algebra: Matrices & Vector Spaces', status: 'mastered', time: '12 hrs' },
        { id: 'r2', title: 'Calculus: Limits, Continuity & Definite Integrals', status: 'mastered', time: '8 hrs' },
        { id: 'r3', title: 'Discrete Math: Graph Theory & Combinatorics', status: 'mastered', time: '14 hrs' },
      ],
    },
    {
      title: 'Stage 2: Core Computer Systems & Architecture',
      status: 'In Progress (Active Focus)',
      items: [
        { id: 'r4', title: 'Operating Systems: Virtual Memory & Page Replacement', status: 'weak', time: '10 hrs' },
        { id: 'r5', title: 'Operating Systems: CPU Scheduling & Synchronization', status: 'inProgress', time: '8 hrs' },
        { id: 'r6', title: 'Computer Architecture: Pipelining & Cache Memory', status: 'unassessed', time: '12 hrs' },
      ],
    },
    {
      title: 'Stage 3: Algorithms & Software Theory',
      status: 'Upcoming',
      items: [
        { id: 'r7', title: 'Data Structures: Balanced Search Trees & Heaps', status: 'weak', time: '15 hrs' },
        { id: 'r8', title: 'Algorithms: Dynamic Programming & Greedy Strategies', status: 'inProgress', time: '18 hrs' },
        { id: 'r9', title: 'Theory of Computation: Decidability & Turing Machines', status: 'unassessed', time: '16 hrs' },
      ],
    },
  ];

  const handleStudy = (item: { id: string; title: string }) => {
    setLinkedActivity({
      id: item.id,
      title: item.title,
    });
    setMode('pomodoro');
    startTimer();
    navigate('/timer');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-midnight dark:text-white tracking-tight flex items-center gap-2">
          <Map className="w-6 h-6 text-brand-cyan" />
          Personalized Learning Roadmap
        </h2>
        <p className="text-xs sm:text-sm text-brand-slate/70 dark:text-gray-300 mt-1 max-w-2xl">
          An adaptive curriculum map sequenced by prerequisite dependencies. 
          Each node is tied to diagnostic validation and self-timed study blocks.
        </p>
      </div>

      <div className="space-y-6">
        {stages.map((st, sIdx) => (
          <div key={sIdx} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-brand-midnight dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-gradient-to-r from-brand-violet to-brand-orchid text-white text-xs font-bold flex items-center justify-center">
                  {sIdx + 1}
                </span>
                {st.title}
              </h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-violet/10 dark:bg-brand-violet/25 text-brand-violet dark:text-brand-cyan">
                {st.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {st.items.map((it) => (
                <Card
                  key={it.id}
                  status={it.status as any}
                  padding="sm"
                  className="flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono text-brand-slate/50 dark:text-gray-400">
                        {it.time}
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          it.status === 'mastered'
                            ? 'bg-brand-mint/20 text-brand-mint'
                            : it.status === 'inProgress'
                            ? 'bg-brand-amber/20 text-brand-amber'
                            : it.status === 'weak'
                            ? 'bg-brand-coral/20 text-brand-coral'
                            : 'bg-brand-cyan/20 text-brand-cyan'
                        }`}
                      >
                        {it.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-brand-midnight dark:text-white line-clamp-2">
                      {it.title}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-brand-violet/10 flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStudy(it)}
                      className="text-[11px] p-1"
                      leftIcon={<Timer className="w-3 h-3 text-brand-cyan" />}
                    >
                      Focus
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate('/practice')}
                      className="text-[11px] p-1 px-2"
                    >
                      Quiz →
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

