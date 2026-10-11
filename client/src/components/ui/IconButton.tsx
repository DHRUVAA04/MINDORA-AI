import React from 'react';
import { Loader2 } from 'lucide-react';

export type IconButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  isLoading?: boolean;
  label: string; // Accessible aria-label
  tooltip?: string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      children,
      variant = 'ghost',
      size = 'md',
      isLoading = false,
      label,
      tooltip,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'relative inline-flex items-center justify-center rounded-xl select-none transition-all duration-200 ' +
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 ' +
      'active:scale-[0.95] ' +
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:active:scale-100';

    const hoverMotion = 'hover:-translate-y-0.5 hover:scale-105 active:translate-y-0';

    const variantStyles: Record<IconButtonVariant, string> = {
      primary:
        `bg-gradient-to-r from-brand-violet to-brand-orchid text-white shadow-md hover:shadow-violet-glow ${hoverMotion}`,
      secondary:
        `bg-white/80 dark:bg-[#1C1742] text-brand-slate dark:text-gray-200 border border-brand-violet/20 hover:bg-brand-violet/10 hover:border-brand-violet/40 ${hoverMotion}`,
      ghost:
        `bg-transparent text-brand-slate/80 dark:text-gray-300 hover:bg-brand-violet/10 dark:hover:bg-brand-violet/20 hover:text-brand-violet dark:hover:text-brand-cyan ${hoverMotion}`,
      danger:
        `bg-brand-coral/10 text-brand-coral hover:bg-brand-coral hover:text-white ${hoverMotion}`,
      glass:
        `bg-white/40 dark:bg-white/10 backdrop-blur-md border border-white/20 text-brand-slate dark:text-white hover:bg-white/60 dark:hover:bg-white/20 ${hoverMotion}`,
    };

    const sizeStyles: Record<IconButtonSize, string> = {
      sm: 'w-8 h-8 p-1.5 text-xs',
      md: 'w-10 h-10 p-2 text-sm',
      lg: 'w-12 h-12 p-3 text-base',
    };

    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        aria-label={label}
        title={tooltip || label}
        disabled={isDisabled}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" aria-hidden="true" />
        ) : (
          children
        )}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

