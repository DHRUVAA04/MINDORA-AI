import React from 'react';
import { NavLink } from 'react-router-dom';

export interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: string | number;
  isCollapsed?: boolean;
  onClick?: () => void;
}

export const NavItem: React.FC<NavItemProps> = ({
  to,
  icon,
  label,
  badge,
  isCollapsed = false,
  onClick,
}) => {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 select-none outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan ${
          isActive
            ? 'bg-gradient-to-r from-brand-royal via-brand-violet to-brand-orchid text-white shadow-violet-glow font-semibold'
            : 'text-brand-slate/80 dark:text-gray-300 hover:bg-brand-violet/10 dark:hover:bg-brand-violet/20 hover:text-brand-violet dark:hover:text-brand-cyan'
        } ${isCollapsed ? 'justify-center px-2.5' : ''}`
      }
      aria-label={label}
    >
      {({ isActive }) => (
        <>
          {/* Active indicator bar for extra clarity */}
          {isActive && !isCollapsed && (
            <span
              className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-brand-cyan shadow-cyan-glow"
              aria-hidden="true"
            />
          )}

          {/* Icon with subtle micro-shift on hover */}
          <span
            className={`flex-shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 ${
              isActive ? 'text-white' : 'text-brand-violet dark:text-brand-cyan'
            }`}
            aria-hidden="true"
          >
            {icon}
          </span>

          {/* Label when expanded */}
          {!isCollapsed && (
            <span className="flex-1 truncate tracking-tight">{label}</span>
          )}

          {/* Optional Badge */}
          {!isCollapsed && badge !== undefined && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-brand-violet/15 dark:bg-brand-violet/30 text-brand-violet dark:text-brand-cyan'
              }`}
            >
              {badge}
            </span>
          )}

          {/* Tooltip on hover when collapsed */}
          {isCollapsed && (
            <div
              role="tooltip"
              className="pointer-events-none absolute left-full ml-3 hidden group-hover:flex items-center px-2.5 py-1 text-xs font-medium rounded-lg bg-brand-midnight text-white shadow-lg whitespace-nowrap z-50 animate-in fade-in zoom-in-95 duration-150 border border-brand-violet/30"
            >
              {label}
            </div>
          )}
        </>
      )}
    </NavLink>
  );
};

