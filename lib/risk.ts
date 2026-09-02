import type { RiskBand } from './types';

export const RISK_BANDS: { band: RiskBand; label: string; min: number; max: number }[] = [
  { band: 'low', label: 'Low', min: 0, max: 30 },
  { band: 'moderate', label: 'Moderate', min: 31, max: 55 },
  { band: 'high', label: 'High', min: 56, max: 75 },
  { band: 'critical', label: 'Critical', min: 76, max: 100 },
];

export function riskBandFromScore(score: number): RiskBand {
  if (score <= 30) return 'low';
  if (score <= 55) return 'moderate';
  if (score <= 75) return 'high';
  return 'critical';
}

export const RISK_BAND_LABEL: Record<RiskBand, string> = {
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
  critical: 'Critical',
};

export const RISK_BAND_TEXT: Record<RiskBand, string> = {
  low: 'text-risk-low',
  moderate: 'text-risk-moderate',
  high: 'text-risk-high',
  critical: 'text-risk-critical',
};

export const RISK_BAND_BG: Record<RiskBand, string> = {
  low: 'bg-risk-low',
  moderate: 'bg-risk-moderate',
  high: 'bg-risk-high',
  critical: 'bg-risk-critical',
};

export const RISK_BAND_BG_SUBTLE: Record<RiskBand, string> = {
  low: 'bg-risk-low/10 text-risk-low border-risk-low/30',
  moderate: 'bg-risk-moderate/10 text-risk-moderate border-risk-moderate/30',
  high: 'bg-risk-high/10 text-risk-high border-risk-high/30',
  critical: 'bg-risk-critical/10 text-risk-critical border-risk-critical/30',
};

export const RISK_BAND_BORDER: Record<RiskBand, string> = {
  low: 'border-risk-low',
  moderate: 'border-risk-moderate',
  high: 'border-risk-high',
  critical: 'border-risk-critical',
};
