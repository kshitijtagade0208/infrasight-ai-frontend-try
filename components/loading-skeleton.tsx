import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
}

export function LoadingSkeleton({ className, lines = 3 }: LoadingSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 animate-pulse rounded-sm bg-muted"
          style={{ width: `${100 - i * 12}%` }}
        />
      ))}
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-md border bg-card p-4', className)}>
      <div className="h-3 w-1/3 animate-pulse rounded-sm bg-muted" />
      <div className="mt-4 h-8 w-2/3 animate-pulse rounded-sm bg-muted" />
      <div className="mt-3 h-3 w-1/2 animate-pulse rounded-sm bg-muted" />
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-md border bg-card">
      <div className="border-b px-4 py-3">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-3.5 animate-pulse rounded-sm bg-muted" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="border-b px-4 py-3.5 last:border-0">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {Array.from({ length: cols }).map((_, i) => (
              <div key={i} className="h-3.5 animate-pulse rounded-sm bg-muted/70" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
