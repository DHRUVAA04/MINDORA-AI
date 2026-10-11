import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'mastery' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    // Base styles with smooth transitions and tactile interactions
    const baseStyles =
      'relative inline-flex items-center justify-center font-medium rounded-xl select-none transition-all duration-200 ' +
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 ' +
      'active:scale-[0.97] active:shadow-inner ' +
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none disabled:active:scale-100';

    // Hover effect (guarded for devices with real hover)
    const hoverMotion =
      'hover:-translate-y-0.5 hover:scale-[1.02] active:translate-y-0';

    // Variant color mappings
    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        `bg-gradient-to-r from-brand-royal via-brand-violet to-brand-orchid text-white shadow-md hover:shadow-violet-glow hover:brightness-110 ${hoverMotion}`,
      secondary:
        `bg-white/90 dark:bg-[#1C1742] text-brand-midnight dark:text-white border border-brand-violet/20 dark:border-brand-violet/40 hover:bg-brand-violet/10 dark:hover:bg-brand-violet/20 hover:border-brand-violet/40 shadow-sm ${hoverMotion}`,
      ghost:
        `bg-transparent text-brand-slate dark:text-gray-200 hover:bg-brand-violet/10 dark:hover:bg-brand-violet/20 hover:text-brand-violet dark:hover:text-brand-cyan ${hoverMotion}`,
      danger:
        `bg-brand-coral text-white shadow-md hover:shadow-red-500/30 hover:brightness-105 ${hoverMotion}`,
      mastery:
        `bg-gradient-to-r from-brand-mint to-brand-cyan text-brand-midnight font-semibold shadow-md hover:shadow-cyan-glow hover:brightness-105 ${hoverMotion}`,
      outline:
        `bg-transparent text-brand-violet dark:text-brand-cyan border-2 border-brand-violet dark:border-brand-cyan hover:bg-brand-violet/10 dark:hover:bg-brand-cyan/10 ${hoverMotion}`,
    };

    // Size mappings
    const sizeStyles: Record<ButtonSize, string> = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2.5 text-sm gap-2',
      lg: 'px-6 py-3.5 text-base gap-2.5',
    };

    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-current" aria-hidden="true" />
            <span className="opacity-80">{children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0" aria-hidden="true">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="flex-shrink-0" aria-hidden="true">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

