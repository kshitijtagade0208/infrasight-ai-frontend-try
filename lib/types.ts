export type RiskBand = 'low' | 'moderate' | 'high' | 'critical';

export type EvidenceType =
  | 'reported'
  | 'observed'
  | 'predicted'
  | 'ai-interpreted'
  | 'verified';

export type AlertSeverity = 'low' | 'moderate' | 'high' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export type ProjectStatus =
  | 'on-track'
  | 'at-risk'
  | 'delayed'
  | 'critical'
  | 'completed';

export interface Project {
  id: string;
  name: string;
  code: string;
  ministry: string;
  agency?: string;
  state: string;
  district: string;
  sector: string;
  status: ProjectStatus;
  riskScore: number;
  riskBand: RiskBand;
  budgetCrore: number;
  spentCrore: number;
  progressPercent: number;
  visualProgressEstimate?: number;
  cctvAvailable?: boolean;
  startDate: string;
  targetEndDate: string;
  contractor: string;
  evidence: EvidenceType[];
  lastUpdated: string;
}

export interface Alert {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  evidence: EvidenceType[];
  createdAt: string;
  source: string;
}

export interface KpiStat {
  id: string;
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down' | 'flat';
  hint: string;
}

export interface RiskTrendPoint {
  month: string;
  low: number;
  moderate: number;
  high: number;
  critical: number;
}

export interface StateRiskDatum {
  state: string;
  projects: number;
  avgRisk: number;
  band: RiskBand;
}

export interface EarlyWarning {
  id: string;
  projectId: string;
  projectName: string;
  signal: string;
  detail: string;
  band: RiskBand;
  evidence: EvidenceType[];
  detectedAt: string;
}
