import { cn } from '../utils/cn';

interface ProgressBarProps {
  progress: number; // 0 to 100
  className?: string;
}

export function ProgressBar({ progress, className }: ProgressBarProps) {
  const safeProgress = Math.min(100, Math.max(0, progress));
  
  return (
    <div className={cn("w-full bg-surface-variant rounded-full h-2.5", className)}>
      <div 
        className="bg-primary h-2.5 rounded-full transition-all duration-300" 
        style={{ width: `${safeProgress}%` }}
      />
    </div>
  );
}
