import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import type { KpiStat } from '@/lib/types';

interface StatCardProps {
  stat: KpiStat;
  className?: string;
}

export function StatCard({ stat, className }: StatCardProps) {
  const TrendIcon =
    stat.trend === 'up' ? ArrowUpRight : stat.trend === 'down' ? ArrowDownRight : Minus;
  const trendColor =
    stat.trend === 'up'
      ? 'text-risk-high'
      : stat.trend === 'down'
        ? 'text-risk-low'
        : 'text-muted-foreground';

  return (
    <div
      className={cn(
        'flex flex-col justify-between rounded-md border bg-card p-4',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {stat.label}
        </p>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <p className="font-mono text-2xl font-semibold tracking-tight text-foreground">
          {stat.value}
        </p>
        <span
          className={cn(
            'inline-flex items-center gap-0.5 text-xs font-semibold',
            trendColor
          )}
        >
          <TrendIcon className="h-3.5 w-3.5" />
          {stat.delta}
        </span>
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">{stat.hint}</p>
    </div>
  );
}
