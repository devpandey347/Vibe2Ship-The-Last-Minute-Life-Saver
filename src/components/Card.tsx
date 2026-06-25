import React from 'react';
import { cn } from '../utils/cn';

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-surface border border-outline-variant/50 rounded-xl p-6 shadow-soft",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
