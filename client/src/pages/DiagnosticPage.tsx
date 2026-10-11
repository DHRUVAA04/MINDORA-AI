import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

const QUESTIONS = [
  {
    id: 1,
    subject: 'Operating Systems',
    topic: 'Virtual Memory & Page Replacement',
    question: 'In the Optimal Page Replacement algorithm (OPT), which page is selected for replacement upon a page fault?',
    options: [
      'The page that was loaded earliest into main memory (FIFO)',
      'The page that will not be used for the longest period of time in the future',
      'The page that was least recently referenced by the CPU',
      'The page with the smallest allocated working set size',
    ],
    correctIndex: 1,
    explanation: 'Optimal Page Replacement replaces the page that will not be referenced for the longest duration in the future, providing the theoretical minimum page fault rate.',
  },
  {
    id: 2,
    subject: 'Linear Algebra',
    topic: 'Eigenvalues & Diagonalization',
    question: 'If λ is an eigenvalue of an invertible matrix A, what is the eigenvalue of A⁻¹?',
    options: [
      '-λ',
      'λ²',
      '1 / λ',
      'λ / det(A)',
    ],
    correctIndex: 2,
    explanation: 'Since Av = λv, multiplying by A⁻¹ yields v = λA⁻¹v, which gives A⁻¹v = (1/λ)v.',
  },
  {
    id: 3,
    subject: 'Database Systems',
    topic: 'Normalization 3NF & BCNF',
    question: 'A relation R is in Boyce-Codd Normal Form (BCNF) if and only if for every non-trivial functional dependency X → Y:',
    options: [
      'X is a superkey of R',
      'Y is a prime attribute',
      'X is a candidate key or Y is prime',
      'R does not contain multivalued dependencies',
    ],
    correctIndex: 0,
    explanation: 'BCNF requires that for every non-trivial functional dependency X → Y, the determinant X must strictly be a superkey.',
  },
];

export const DiagnosticPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<number>(1); // 1: Setup, 2: Questions, 3: Results
  const [questionIdx, setQuestionIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [selectedDomain, setSelectedDomain] = useState('Computer Science & Engineering');

  const currentQ = QUESTIONS[questionIdx];

  const handleSelectOption = (optIdx: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionIdx]: optIdx }));
  };

  const saveDiagnosticResults = async (answers: Record<number, number>) => {
    for (let i = 0; i < QUESTIONS.length; i++) {
      const q = QUESTIONS[i];
      const isCorrect = answers[i] === q.correctIndex;
      try {
        await apiClient('/api/user/topics', {
          method: 'POST',
          body: JSON.stringify({
            subject: q.subject,
            title: q.topic,
            status: isCorrect ? 'mastered' : 'weak',
            score: isCorrect ? 92 : 42,
            prerequisites: 'Core prerequisite foundations',
            estimated_hours: 2.0,
          }),
        });
      } catch (e) {
        console.warn('Failed saving topic result:', e);
      }
    }
  };

  const handleNextQuestion = () => {
    if (questionIdx < QUESTIONS.length - 1) {
      setQuestionIdx((prev) => prev + 1);
    } else {
      saveDiagnosticResults(selectedAnswers);
      setCurrentStep(3); // Go to results
    }
  };

  const handlePrevQuestion = () => {
    if (questionIdx > 0) {
      setQuestionIdx((prev) => prev - 1);
    } else {
      setCurrentStep(1);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    QUESTIONS.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correct += 1;
      }
    });
    return {
      correct,
      total: QUESTIONS.length,
      percentage: Math.round((correct / QUESTIONS.length) * 100),
    };
  };

  const score = calculateScore();

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Breadcrumbs Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-brand-slate/60 dark:text-gray-400">
        <button
          onClick={() => navigate('/')}
          className="hover:text-brand-violet dark:hover:text-brand-cyan"
        >
          Dashboard
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-brand-midnight dark:text-white">Diagnostic Flow</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-brand-violet dark:text-brand-cyan">
          {currentStep === 1 ? 'Step 1: Domain Selection' : currentStep === 2 ? 'Step 2: Diagnostic Assessment' : 'Step 3: Knowledge Gaps'}
        </span>
      </nav>

      {/* Multi-Step Flow Indicator */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#151231] border border-brand-violet/15 flex items-center justify-between">
        {[
          { step: 1, label: '1. Select Domain' },
          { step: 2, label: '2. Diagnostic Test' },
          { step: 3, label: '3. Skill Gap Report' },
        ].map((s) => (
          <div key={s.step} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                currentStep === s.step
                  ? 'bg-gradient-to-r from-brand-violet to-brand-cyan text-white shadow-violet-glow scale-105'
                  : currentStep > s.step
                  ? 'bg-brand-mint text-brand-midnight font-bold'
                  : 'bg-brand-violet/10 text-brand-slate/50 dark:text-gray-400'
              }`}
            >
              {currentStep > s.step ? '✓' : s.step}
            </div>
            <span
              className={`text-xs font-semibold hidden sm:inline ${
                currentStep === s.step ? 'text-brand-midnight dark:text-white' : 'text-brand-slate/50 dark:text-gray-400'
              }`}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1: Select Domain */}
      {currentStep === 1 && (
        <Card padding="lg" className="space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-brand-midnight dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-orchid" />
              Configure Diagnostic Baseline
            </h2>
            <p className="text-xs sm:text-sm text-brand-slate/70 dark:text-gray-300 mt-1">
              Mindora Diagnostic Engine evaluates your current retention across fundamental exam concepts.
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-slate/70 dark:text-gray-300">
              Target Academic Discipline
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                'Computer Science & Engineering',
                'Electrical & Electronics Engineering',
                'Mathematics & Applied Data Science',
                'Mechanical Systems & Thermodynamics',
              ].map((domain) => (
                <div
                  key={domain}
                  onClick={() => setSelectedDomain(domain)}
                  className={`p-4 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                    selectedDomain === domain
                      ? 'border-brand-violet bg-brand-violet/10 dark:bg-brand-violet/20 text-brand-violet dark:text-brand-cyan shadow-sm'
                      : 'border-brand-violet/15 hover:border-brand-violet/30 text-brand-slate dark:text-gray-300'
                  }`}
                >
                  {domain}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-brand-violet/10 dark:border-brand-violet/20">
            <Button
              variant="primary"
              size="md"
              onClick={() => setCurrentStep(2)}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Begin Diagnostic Quiz
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Assessment Questions */}
      {currentStep === 2 && (
        <Card padding="lg" className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-brand-violet/10 dark:border-brand-violet/20">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-cyan">
                {currentQ.subject} • {currentQ.topic}
              </span>
              <h3 className="text-sm font-semibold text-brand-slate/70 dark:text-gray-300">
                Question {questionIdx + 1} of {QUESTIONS.length}
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-brand-violet dark:text-brand-cyan">
              Progress: {Math.round(((questionIdx + 1) / QUESTIONS.length) * 100)}%
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-brand-midnight dark:text-white leading-relaxed">
            {currentQ.question}
          </h3>

          <div className="space-y-3">
            {currentQ.options.map((opt, optIdx) => {
              const isSelected = selectedAnswers[questionIdx] === optIdx;
              return (
                <div
                  key={optIdx}
                  onClick={() => handleSelectOption(optIdx)}
                  className={`p-4 rounded-xl border text-xs sm:text-sm cursor-pointer transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'border-brand-violet bg-gradient-to-r from-brand-violet/15 to-brand-orchid/15 text-brand-midnight dark:text-white shadow-violet-glow font-medium'
                      : 'border-brand-violet/15 hover:border-brand-violet/35 hover:bg-brand-violet/5 text-brand-slate dark:text-gray-200'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                      isSelected
                        ? 'bg-brand-violet text-white'
                        : 'bg-brand-violet/10 text-brand-slate/70 dark:text-gray-400'
                    }`}
                  >
                    {String.fromCharCode(65 + optIdx)}
                  </span>
                  <span className="leading-relaxed">{opt}</span>
                </div>
              );
            })}
          </div>

          {/* Navigation Controls: Back and Next buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-brand-violet/10 dark:border-brand-violet/20">
            <Button
              variant="secondary"
              size="md"
              onClick={handlePrevQuestion}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              {questionIdx === 0 ? 'Back to Setup' : 'Previous Question'}
            </Button>

            <Button
              variant="primary"
              size="md"
              disabled={selectedAnswers[questionIdx] === undefined}
              onClick={handleNextQuestion}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              {questionIdx === QUESTIONS.length - 1 ? 'Finish Diagnostic' : 'Next Question'}
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Diagnostic Knowledge Report */}
      {currentStep === 3 && (
        <Card padding="lg" className="space-y-6">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-brand-mint to-brand-cyan flex items-center justify-center shadow-cyan-glow">
              <CheckCircle2 className="w-8 h-8 text-brand-midnight font-bold" />
            </div>
            <h2 className="text-2xl font-black text-brand-midnight dark:text-white">
              Diagnostic Complete
            </h2>
            <p className="text-xs text-brand-slate/70 dark:text-gray-300 mt-1">
              Your diagnostic score: <strong className="text-brand-violet dark:text-brand-cyan font-mono text-base">{score.correct}/{score.total} ({score.percentage}%)</strong>.
              Your personalized knowledge map has been updated.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-slate/70 dark:text-gray-300">
              Categorized Topics:
            </h4>

            {QUESTIONS.map((q, idx) => {
              const isCorrect = selectedAnswers[idx] === q.correctIndex;
              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                    isCorrect
                      ? 'border-l-4 border-l-brand-mint bg-brand-mint/5 border-brand-violet/10'
                      : 'border-l-4 border-l-brand-coral bg-brand-coral/5 border-brand-violet/10'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-brand-slate/50 dark:text-gray-400">
                      {q.subject}
                    </span>
                    <h5 className="font-bold text-brand-midnight dark:text-white">{q.topic}</h5>
                    <p className="text-[11px] text-brand-slate/70 dark:text-gray-300 italic">
                      {q.explanation}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                      isCorrect ? 'bg-brand-mint/20 text-brand-mint' : 'bg-brand-coral/20 text-brand-coral'
                    }`}
                  >
                    {isCorrect ? 'Mastered' : 'Weak Gap'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-brand-violet/10 dark:border-brand-violet/20">
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setSelectedAnswers({});
                setQuestionIdx(0);
                setCurrentStep(1);
              }}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Retake Diagnostic
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate('/skill-gaps')}
              >
                View Skill Gaps
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/roadmap')}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Open Study Roadmap
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

