import React from 'react';
import { Card } from './Card';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <Card className="flex flex-col items-center justify-center text-center p-12 bg-transparent border border-dashed border-outline-variant shadow-none">
      {icon && <div className="mb-4 text-primary">{icon}</div>}
      <h3 className="font-headline font-semibold text-lg md:text-xl mb-2">{title}</h3>
      <p className="font-body text-on-surface-variant mb-6">{description}</p>
      {action}
    </Card>
  );
}
