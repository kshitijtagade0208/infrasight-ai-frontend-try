import { cn } from '@/lib/utils';
import type { EvidenceType } from '@/lib/types';
import {
  Megaphone,
  Eye,
  TrendingUp,
  BrainCircuit,
  ShieldCheck,
} from 'lucide-react';

export const EVIDENCE_META: Record<
  EvidenceType,
  { label: string; icon: typeof Eye; className: string }
> = {
  reported: { label: 'Reported', icon: Megaphone, className: 'text-muted-foreground border-border bg-muted/60' },
  observed: { label: 'Observed', icon: Eye, className: 'text-primary border-primary/30 bg-primary/10' },
  predicted: { label: 'Predicted', icon: TrendingUp, className: 'text-risk-moderate border-risk-moderate/30 bg-risk-moderate/10' },
  'ai-interpreted': { label: 'AI-interpreted', icon: BrainCircuit, className: 'text-risk-high border-risk-high/30 bg-risk-high/10' },
  verified: { label: 'Verified', icon: ShieldCheck, className: 'text-risk-low border-risk-low/30 bg-risk-low/10' },
};

interface EvidenceChipProps {
  type: EvidenceType;
  className?: string;
}

export function EvidenceChip({ type, className }: EvidenceChipProps) {
  const meta = EVIDENCE_META[type];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[11px] font-medium',
        meta.className,
        className
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={2} />
      {meta.label}
    </span>
  );
}
