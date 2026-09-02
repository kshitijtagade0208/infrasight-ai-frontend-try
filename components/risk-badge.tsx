import { cn } from '@/lib/utils';
import { RISK_BAND_LABEL, RISK_BAND_BG_SUBTLE } from '@/lib/risk';
import type { RiskBand } from '@/lib/types';

interface RiskBadgeProps {
  band: RiskBand;
  score?: number;
  className?: string;
  showDot?: boolean;
}

export function RiskBadge({ band, score, className, showDot = true }: RiskBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide',
        RISK_BAND_BG_SUBTLE[band],
        className
      )}
    >
      {showDot && (
        <span className={cn('h-1.5 w-1.5 rounded-full bg-current')} />
      )}
      {RISK_BAND_LABEL[band]}
      {typeof score === 'number' && (
        <span className="font-mono font-normal opacity-80">{score}</span>
      )}
    </span>
  );
}
