import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CheckSquare, Sparkles, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

const PRACTICE_SETS = [
  {
    id: 'quiz_1',
    topic: 'Virtual Memory & Page Replacement',
    subject: 'Operating Systems',
    difficulty: 'Medium',
    question: 'Belady\'s Anomaly occurs when increasing the number of page frames results in an INCREASE in page faults. Which of the following algorithms is susceptible to Belady\'s Anomaly?',
    options: ['LRU (Least Recently Used)', 'FIFO (First-In First-Out)', 'Optimal Page Replacement', 'Stack-based algorithms'],
    correct: 1,
    explanation: 'FIFO does not satisfy the inclusion property of stack algorithms, which allows Belady\'s Anomaly to occur under specific page reference strings.',
  },
  {
    id: 'quiz_2',
    topic: 'Eigenvalues & Diagonalization',
    subject: 'Linear Algebra',
    difficulty: 'Hard',
    question: 'A real symmetric matrix A always has:',
    options: ['Only complex eigenvalues', 'Real eigenvalues and mutually orthogonal eigenvectors', 'A determinant of zero', 'No diagonal representation'],
    correct: 1,
    explanation: 'By the Spectral Theorem, every real symmetric matrix has real eigenvalues and an orthonormal basis of eigenvectors.',
  },
];

export const PracticePage: React.FC = () => {
  const [activeQuizIdx, setActiveQuizIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const currentQuiz = PRACTICE_SETS[activeQuizIdx];

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleNext = () => {
    setSelectedOpt(null);
    setSubmitted(false);
    setActiveQuizIdx((prev) => (prev + 1) % PRACTICE_SETS.length);
  };

  const isCorrect = selectedOpt === currentQuiz.correct;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-midnight dark:text-white tracking-tight flex items-center gap-2">
          <CheckSquare className="w-6 h-6 text-brand-mint" />
          Mastery Retrieval Quizzes
        </h2>
        <p className="text-xs sm:text-sm text-brand-slate/70 dark:text-gray-300 mt-1">
          Active recall is the true benchmark for learning. Complete quizzes to upgrade topics from weak to mastered status.
        </p>
      </div>

      <Card padding="lg" className="space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-brand-violet/10 dark:border-brand-violet/20">
          <div>
            <span className="text-[10px] uppercase font-bold text-brand-cyan tracking-wider">
              {currentQuiz.subject} • {currentQuiz.topic}
            </span>
            <span className="ml-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-brand-amber/15 text-brand-amber">
              {currentQuiz.difficulty}
            </span>
          </div>
          <span className="text-xs font-mono text-brand-slate/60 dark:text-gray-400">
            Set {activeQuizIdx + 1} of {PRACTICE_SETS.length}
          </span>
        </div>

        <h3 className="text-sm sm:text-base font-bold text-brand-midnight dark:text-white leading-relaxed">
          {currentQuiz.question}
        </h3>

        <div className="space-y-2.5">
          {currentQuiz.options.map((opt, idx) => {
            let stateStyles = 'border-brand-violet/15 hover:border-brand-violet/30 hover:bg-brand-violet/5';
            if (submitted) {
              if (idx === currentQuiz.correct) {
                stateStyles = 'border-brand-mint bg-brand-mint/15 text-brand-midnight dark:text-white font-semibold';
              } else if (idx === selectedOpt) {
                stateStyles = 'border-brand-coral bg-brand-coral/15 text-brand-coral font-semibold';
              }
            } else if (selectedOpt === idx) {
              stateStyles = 'border-brand-violet bg-brand-violet/10 dark:bg-brand-violet/25 font-semibold text-brand-midnight dark:text-white shadow-violet-glow';
            }

            return (
              <div
                key={idx}
                onClick={() => !submitted && setSelectedOpt(idx)}
                className={`p-3.5 rounded-xl border text-xs sm:text-sm cursor-pointer transition-all flex items-center justify-between ${stateStyles}`}
              >
                <span>{opt}</span>
                {submitted && idx === currentQuiz.correct && (
                  <CheckCircle2 className="w-4 h-4 text-brand-mint flex-shrink-0" />
                )}
                {submitted && idx === selectedOpt && idx !== currentQuiz.correct && (
                  <XCircle className="w-4 h-4 text-brand-coral flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {submitted && (
          <div className={`p-4 rounded-xl border text-xs leading-relaxed animate-in fade-in duration-200 ${
            isCorrect ? 'bg-brand-mint/10 border-brand-mint/30 text-brand-midnight dark:text-gray-100' : 'bg-brand-coral/10 border-brand-coral/30 text-brand-midnight dark:text-gray-100'
          }`}>
            <p className="font-bold mb-1">{isCorrect ? '🎉 Correct Answer!' : '❌ Incorrect'}</p>
            <p className="opacity-90">{currentQuiz.explanation}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-brand-violet/10 dark:border-brand-violet/20">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedOpt(null);
              setSubmitted(false);
            }}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset Options
          </Button>

          {!submitted ? (
            <Button
              variant="primary"
              size="md"
              disabled={selectedOpt === null}
              onClick={handleSubmit}
            >
              Verify Answer
            </Button>
          ) : (
            <Button
              variant="mastery"
              size="md"
              onClick={handleNext}
            >
              Next Practice Question →
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

