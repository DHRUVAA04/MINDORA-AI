import React from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Calendar, Clock, Sparkles, Plus, Timer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTimerStore } from '../store/timerStore';

export const TimetablePage: React.FC = () => {
  const navigate = useNavigate();
  const { setMode, setLinkedActivity, startTimer } = useTimerStore();

  const scheduleSlots = [
    { time: '09:00 - 10:00 AM', subject: 'Linear Algebra', topic: 'Matrix Diagonalization & Proofs', type: 'Core Study' },
    { time: '11:00 - 12:00 PM', subject: 'Operating Systems', topic: 'Virtual Memory Page Fault Simulations', type: 'Remediation' },
    { time: '02:00 - 02:45 PM', subject: 'Data Structures', topic: 'AVL Tree Rotation Practice', type: 'Problem Solving' },
    { time: '04:30 - 05:30 PM', subject: 'Database Systems', topic: 'BCNF Functional Dependency Decompositions', type: 'Active Revision' },
  ];

  const handleLaunchSession = (slot: typeof scheduleSlots[0]) => {
    setLinkedActivity({
      id: 'sched_' + Date.now(),
      title: `${slot.subject}: ${slot.topic}`,
    });
    setMode('pomodoro');
    startTimer();
    navigate('/timer');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-midnight dark:text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-brand-cyan" />
            Smart Timetable & Spaced Revision
          </h2>
          <p className="text-xs sm:text-sm text-brand-slate/70 dark:text-gray-300 mt-1">
            Automated schedule generated from your forgetting curves and prioritized skill gaps.
          </p>
        </div>

        <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
          Add Custom Block
        </Button>
      </div>

      <div className="space-y-3">
        {scheduleSlots.map((slot, idx) => (
          <Card key={idx} padding="md" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-violet/10 text-brand-violet dark:text-brand-cyan font-mono text-xs font-bold whitespace-nowrap">
                {slot.time}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-brand-midnight dark:text-white">
                    {slot.subject}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase bg-brand-cyan/15 text-brand-cyan">
                    {slot.type}
                  </span>
                </div>
                <p className="text-xs text-brand-slate/70 dark:text-gray-300 mt-0.5">
                  {slot.topic}
                </p>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleLaunchSession(slot)}
              leftIcon={<Timer className="w-3.5 h-3.5 text-brand-cyan" />}
            >
              Start Focus Slot
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};

