import { cn } from '@/lib/utils';
import { RISK_BAND_LABEL, RISK_BAND_BG_SUBTLE } from '@/lib/risk';
import type { AlertSeverity, AlertStatus } from '@/lib/types';
import { AlertTriangle } from 'lucide-react';

export const ALERT_STATUS_META: Record<AlertStatus, string> = {
  active: 'text-risk-critical border-risk-critical/30 bg-risk-critical/10',
  acknowledged: 'text-risk-moderate border-risk-moderate/30 bg-risk-moderate/10',
  resolved: 'text-risk-low border-risk-low/30 bg-risk-low/10',
};

interface AlertBadgeProps {
  severity: AlertSeverity;
  status?: AlertStatus;
  className?: string;
}

export function AlertBadge({ severity, status, className }: AlertBadgeProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide',
          RISK_BAND_BG_SUBTLE[severity]
        )}
      >
        <AlertTriangle className="h-3 w-3" />
        {RISK_BAND_LABEL[severity]}
      </span>
      {status && (
        <span
          className={cn(
            'inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium capitalize',
            ALERT_STATUS_META[status]
          )}
        >
          {status}
        </span>
      )}
    </div>
  );
}
