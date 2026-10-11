import React, { useMemo } from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
}

const COMMON_PASSWORDS = [
  'password123', '1234567890', 'qwertyuiop', 'admin12345', 'welcome123',
  'password1234', 'iloveyou123', 'letmein123', 'student123',
];

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  const analysis = useMemo(() => {
    const isLongEnough = password.length >= 10;
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const isCommon = COMMON_PASSWORDS.some((c) => password.toLowerCase().includes(c));

    let score = 0;
    if (isLongEnough) score += 1;
    if (hasLower && hasUpper) score += 1;
    if (hasNumber) score += 1;
    if (hasSpecial) score += 1;
    if (isCommon) score = Math.max(0, score - 2);

    let label = 'Too short';
    let colorClass = 'bg-brand-coral text-brand-coral';
    let widthPercent = 20;

    if (!password) {
      label = '';
      widthPercent = 0;
    } else if (isCommon) {
      label = 'Too common';
      colorClass = 'bg-brand-coral text-brand-coral';
      widthPercent = 25;
    } else if (score <= 1) {
      label = 'Weak';
      colorClass = 'bg-brand-coral text-brand-coral';
      widthPercent = 25;
    } else if (score === 2) {
      label = 'Fair';
      colorClass = 'bg-brand-amber text-brand-amber';
      widthPercent = 50;
    } else if (score === 3) {
      label = 'Good';
      colorClass = 'bg-brand-cyan text-brand-cyan';
      widthPercent = 75;
    } else {
      label = 'Strong';
      colorClass = 'bg-brand-mint text-brand-mint';
      widthPercent = 100;
    }

    return {
      score,
      label,
      widthPercent,
      isLongEnough,
      hasMixed: hasLower && hasUpper,
      hasNumber,
      hasSpecial,
      isCommon,
    };
  }, [password]);

  if (!password) return null;

  return (
    <div className="space-y-2 mt-2" aria-live="polite">
      {/* Strength Bar */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-brand-slate/60 dark:text-gray-400 font-medium">Strength:</span>
        <span className="font-bold text-[11px] uppercase tracking-wider">
          {analysis.label}
        </span>
      </div>

      <div className="w-full bg-brand-violet/10 dark:bg-brand-violet/25 h-1.5 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            analysis.score <= 1
              ? 'bg-brand-coral'
              : analysis.score === 2
              ? 'bg-brand-amber'
              : analysis.score === 3
              ? 'bg-brand-cyan'
              : 'bg-brand-mint'
          }`}
          style={{ width: `${analysis.widthPercent}%` }}
        />
      </div>

      {/* Checklist */}
      <div className="grid grid-cols-2 gap-1 text-[11px] text-brand-slate/70 dark:text-gray-300 pt-1">
        <div className="flex items-center gap-1.5">
          {analysis.isLongEnough ? <Check className="w-3 h-3 text-brand-mint" /> : <X className="w-3 h-3 text-brand-slate/40" />}
          <span>10+ characters</span>
        </div>
        <div className="flex items-center gap-1.5">
          {analysis.hasMixed ? <Check className="w-3 h-3 text-brand-mint" /> : <X className="w-3 h-3 text-brand-slate/40" />}
          <span>Upper & lowercase</span>
        </div>
        <div className="flex items-center gap-1.5">
          {analysis.hasNumber ? <Check className="w-3 h-3 text-brand-mint" /> : <X className="w-3 h-3 text-brand-slate/40" />}
          <span>At least 1 number</span>
        </div>
        <div className="flex items-center gap-1.5">
          {analysis.hasSpecial ? <Check className="w-3 h-3 text-brand-mint" /> : <X className="w-3 h-3 text-brand-slate/40" />}
          <span>Special character</span>
        </div>
      </div>
    </div>
  );
};

