import React from 'react';
import { cn } from '../utils/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'error' | 'warning';
}

export function Badge({ variant = 'primary', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold font-label",
        variant === 'primary' && "bg-primary-container text-on-primary-container",
        variant === 'secondary' && "bg-surface-variant text-on-surface-variant",
        variant === 'error' && "bg-error text-on-error",
        variant === 'warning' && "bg-tertiary text-on-tertiary",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
