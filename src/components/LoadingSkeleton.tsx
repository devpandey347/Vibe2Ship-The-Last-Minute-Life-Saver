import { cn } from '../utils/cn';

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden bg-surface-variant rounded-xl", className)}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}
