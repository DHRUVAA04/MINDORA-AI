import React from 'react';
import { TopicStatus } from '../../theme/tokens';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  status?: TopicStatus;
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  glowColor?: 'violet' | 'cyan' | 'mint' | 'amber' | 'coral' | 'none';
}

export const Card: React.FC<CardProps> = ({
  children,
  status,
  interactive = true,
  padding = 'md',
  glowColor,
  className = '',
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  const statusBorderStyles: Record<TopicStatus, string> = {
    mastered: 'border-l-4 border-l-brand-mint',
    inProgress: 'border-l-4 border-l-brand-amber',
    weak: 'border-l-4 border-l-brand-coral',
    unassessed: 'border-l-4 border-l-brand-cyan',
  };

  // Determine hover glow based on status or prop
  let glowClasses = 'hover:shadow-violet-glow';
  const effectiveGlow = glowColor || (status === 'mastered' ? 'mint' : status === 'weak' ? 'coral' : status === 'inProgress' ? 'amber' : 'violet');

  if (effectiveGlow === 'cyan') glowClasses = 'hover:shadow-cyan-glow';
  else if (effectiveGlow === 'mint') glowClasses = 'hover:shadow-[0_0_24px_-4px_rgba(52,211,153,0.35)]';
  else if (effectiveGlow === 'amber') glowClasses = 'hover:shadow-[0_0_24px_-4px_rgba(251,191,36,0.35)]';
  else if (effectiveGlow === 'coral') glowClasses = 'hover:shadow-[0_0_24px_-4px_rgba(251,113,133,0.35)]';
  else if (effectiveGlow === 'none') glowClasses = '';

  const interactiveClasses = interactive
    ? `card-hover cursor-pointer transition-all duration-200 ${glowClasses}`
    : '';

  return (
    <div
      className={`rounded-2xl bg-white dark:bg-[#151231] border border-brand-violet/10 dark:border-brand-violet/30 shadow-sm ${
        status ? statusBorderStyles[status] : ''
      } ${paddingStyles[padding]} ${interactiveClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

