import { cn } from '@/lib/utils';
import type { StateRiskDatum } from '@/lib/types';
import { RISK_BAND_LABEL } from '@/lib/risk';
import { MapPin } from 'lucide-react';

interface IndiaMapPlaceholderProps {
  states: StateRiskDatum[];
  className?: string;
}

export function IndiaMapPlaceholder({ states, className }: IndiaMapPlaceholderProps) {
  const topStates = [...states].sort((a, b) => b.avgRisk - a.avgRisk).slice(0, 8);

  return (
    <div
      className={cn(
        'relative flex h-full min-h-[280px] flex-col overflow-hidden rounded-md border border-dashed border-border bg-muted/20',
        className
      )}
    >
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-card text-primary shadow-sm">
            <MapPin className="h-8 w-8" />
          </div>
          <p className="mt-4 text-sm font-semibold text-foreground">
            India GIS Layer
          </p>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            Geographic information system integration is on the roadmap. The
            full interactive map will render here with project overlays and
            regional risk heatmaps.
          </p>
        </div>
      </div>

      <div className="border-t border-border bg-card/80 px-4 py-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Top states by avg. risk
        </p>
        <div className="flex flex-wrap gap-1.5">
          {topStates.map((s) => (
            <span
              key={s.state}
              className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-2 py-1 text-[11px]"
            >
              <span
                className={cn('h-2 w-2 rounded-full', {
                  'bg-risk-low': s.band === 'low',
                  'bg-risk-moderate': s.band === 'moderate',
                  'bg-risk-high': s.band === 'high',
                  'bg-risk-critical': s.band === 'critical',
                })}
              />
              <span className="font-medium text-foreground">{s.state}</span>
              <span className="font-mono text-muted-foreground">{s.avgRisk}</span>
              <span className="text-muted-foreground">· {RISK_BAND_LABEL[s.band]}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
