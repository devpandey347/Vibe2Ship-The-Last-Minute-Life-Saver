import React from 'react';
import { cn } from '../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export function Button({ variant = 'primary', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "px-6 py-3 rounded-xl font-body font-semibold transition-colors duration-200 flex items-center justify-center gap-2",
        variant === 'primary' && "bg-primary text-on-primary hover:opacity-90",
        variant === 'secondary' && "bg-background text-primary border border-outline-variant hover:bg-surface-variant",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
