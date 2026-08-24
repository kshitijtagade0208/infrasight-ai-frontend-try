'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { RiskBadge } from '@/components/risk-badge';
import { EvidenceChip } from '@/components/evidence-chip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { RiskBand, EvidenceType, KpiStat } from '@/lib/types';
import {
  ArrowRight,
  Clock,
  TrendingUp,
  MapPin,
  Layers,
  Info,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

// --- Data Constants ---
const KPI_CARDS: KpiStat[] = [
  {
    id: 'kpi-projects',
    label: 'Active Projects Monitored',
    value: '248',
    delta: '+6',
    trend: 'up',
    hint: 'vs last quarter',
  },
  {
    id: 'kpi-critical',
    label: 'Critical Risk Projects',
    value: '17',
    delta: '+3',
    trend: 'up',
    hint: 'requires immediate attention',
  },
  {
    id: 'kpi-alerts',
    label: 'Open Alerts',
    value: '63',
    delta: '-12',
    trend: 'down',
    hint: 'resolved in last 24h',
  },
  {
    id: 'kpi-budget',
    label: 'Budget at Risk',
    value: '₹1.42L Cr',
    delta: '+8.4%',
    trend: 'up',
    hint: 'exposure across delayed projects',
  },
];

const RISK_BAND_DATA = [
  {
    band: 'low' as RiskBand,
    label: 'Low',
    count: 126,
    pct: 51,
    range: '0–30',
    color: '#2E7D5B',
    description: 'Normal operations; parameters within allowable tolerances',
  },
  {
    band: 'moderate' as RiskBand,
    label: 'Moderate',
    count: 70,
    pct: 28,
    range: '31–55',
    color: '#C9962C',
    description: 'Minor variance detected; schedule or material buffer monitoring',
  },
  {
    band: 'high' as RiskBand,
    label: 'High',
    count: 35,
    pct: 14,
    range: '56–75',
    color: '#C7591E',
    description: 'Significant delay risk or visual activity shortfall flagged',
  },
  {
    band: 'critical' as RiskBand,
    label: 'Critical',
    count: 17,
    pct: 7,
    range: '76–100',
    color: '#B23A3A',
    description: 'Severe schedule stall, breach hazard, or critical variance',
  },
];

// 30-Day Risk Trend data demonstrating gradual increase over the last month (July 26 to August 24, 2026)
const THIRTY_DAY_TREND = [
  { date: '26 Jul', avgRisk: 42.1, criticalCount: 11, highCount: 26 },
  { date: '28 Jul', avgRisk: 42.6, criticalCount: 11, highCount: 26 },
  { date: '30 Jul', avgRisk: 43.2, criticalCount: 12, highCount: 27 },
  { date: '01 Aug', avgRisk: 43.8, criticalCount: 12, highCount: 27 },
  { date: '03 Aug', avgRisk: 44.5, criticalCount: 13, highCount: 28 },
  { date: '05 Aug', avgRisk: 45.2, criticalCount: 13, highCount: 29 },
  { date: '07 Aug', avgRisk: 46.0, criticalCount: 14, highCount: 30 },
  { date: '09 Aug', avgRisk: 46.8, criticalCount: 14, highCount: 31 },
  { date: '11 Aug', avgRisk: 47.9, criticalCount: 15, highCount: 31 },
  { date: '13 Aug', avgRisk: 48.6, criticalCount: 15, highCount: 32 },
  { date: '15 Aug', avgRisk: 49.7, criticalCount: 15, highCount: 33 },
  { date: '17 Aug', avgRisk: 50.8, criticalCount: 16, highCount: 33 },
  { date: '19 Aug', avgRisk: 51.9, criticalCount: 16, highCount: 34 },
  { date: '21 Aug', avgRisk: 53.1, criticalCount: 17, highCount: 34 },
  { date: '23 Aug', avgRisk: 54.2, criticalCount: 17, highCount: 35 },
  { date: '24 Aug', avgRisk: 54.8, criticalCount: 17, highCount: 35 },
];

interface AttentionProject {
  id: string;
  code: string;
  name: string;
  state: string;
  district: string;
  sector: string;
  riskBand: RiskBand;
  riskScore: number;
  reportedProgress: number;
  visualEstimate: number;
  variance: number;
  evidence: EvidenceType[];
}

const ATTENTION_PROJECTS: AttentionProject[] = [
  {
    id: 'PRJ-006',
    code: 'BFEU-03',
    name: 'Brahmaputra Flood Embankment Upgrade',
    state: 'Assam',
    district: 'Dibrugarh',
    sector: 'Water Resources',
    riskBand: 'critical',
    riskScore: 89,
    reportedProgress: 46,
    visualEstimate: 29,
    variance: -17,
    evidence: ['reported', 'observed', 'predicted', 'ai-interpreted'],
  },
  {
    id: 'PRJ-002',
    code: 'KBRL-01',
    name: 'Ken-Betwa River Interlinking',
    state: 'Madhya Pradesh',
    district: 'Tikamgarh',
    sector: 'Water Resources',
    riskBand: 'critical',
    riskScore: 81,
    reportedProgress: 28,
    visualEstimate: 16,
    variance: -12,
    evidence: ['reported', 'observed', 'ai-interpreted', 'verified'],
  },
  {
    id: 'PRJ-011',
    code: 'KEMW-EX',
    name: 'Kolkata East-West Metro Extension',
    state: 'West Bengal',
    district: 'Kolkata',
    sector: 'Railways',
    riskBand: 'high',
    riskScore: 73,
    reportedProgress: 36,
    visualEstimate: 27,
    variance: -9,
    evidence: ['reported', 'observed', 'predicted', 'ai-interpreted'],
  },
  {
    id: 'PRJ-001',
    code: 'MCR-II',
    name: 'Mumbai Coastal Road Phase II',
    state: 'Maharashtra',
    district: 'Mumbai',
    sector: 'Transport',
    riskBand: 'high',
    riskScore: 68,
    reportedProgress: 42,
    visualEstimate: 35,
    variance: -7,
    evidence: ['observed', 'predicted', 'ai-interpreted'],
  },
  {
    id: 'PRJ-008',
    code: 'TIV-HP',
    name: 'Teesta Stage IV Hydropower Project',
    state: 'Sikkim',
    district: 'Mangan',
    sector: 'Energy',
    riskBand: 'high',
    riskScore: 64,
    reportedProgress: 52,
    visualEstimate: 47,
    variance: -5,
    evidence: ['observed', 'predicted'],
  },
  {
    id: 'PRJ-004',
    code: 'BSRP-02',
    name: 'Bengaluru Suburban Rail Project',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    sector: 'Railways',
    riskBand: 'high',
    riskScore: 57,
    reportedProgress: 38,
    visualEstimate: 33,
    variance: -5,
    evidence: ['reported', 'predicted', 'ai-interpreted'],
  },
  {
    id: 'PRJ-010',
    code: 'IMLC-01',
    name: 'Indore Metro Line Corridor',
    state: 'Madhya Pradesh',
    district: 'Indore',
    sector: 'Railways',
    riskBand: 'moderate',
    riskScore: 49,
    reportedProgress: 41,
    visualEstimate: 39,
    variance: -2,
    evidence: ['reported', 'ai-interpreted'],
  },
];

interface EarlyWarningItem {
  id: string;
  title: string;
  severity: RiskBand;
  projectName: string;
  projectId: string;
  detail: string;
  detectedAt: string;
  evidence: EvidenceType[];
}

const EARLY_WARNINGS: EarlyWarningItem[] = [
  {
    id: 'EW-204',
    title: 'Reported vs observed progress mismatch',
    severity: 'critical',
    projectName: 'Brahmaputra Flood Embankment Upgrade (BFEU-03)',
    projectId: 'PRJ-006',
    detail:
      'Contractor reported +14% progress over last 60 days, whereas high-resolution optical surveillance detects only +2% physical earthwork completion on embankment sector B.',
    detectedAt: '2026-08-24T06:40:00Z',
    evidence: ['reported', 'observed', 'ai-interpreted'],
  },
  {
    id: 'EW-201',
    title: 'Construction activity decline detected',
    severity: 'high',
    projectName: 'Mumbai Coastal Road Phase II (MCR-II)',
    projectId: 'PRJ-001',
    detail:
      'Heavy machinery thermal and motion density dropped 43% below 30-day baseline on interchange bridges. No official work stoppage or weather event reported.',
    detectedAt: '2026-08-23T15:30:00Z',
    evidence: ['observed', 'ai-interpreted'],
  },
  {
    id: 'EW-199',
    title: 'Schedule slippage risk',
    severity: 'high',
    projectName: 'Bengaluru Suburban Rail Project (BSRP-02)',
    projectId: 'PRJ-004',
    detail:
      'Utility relocation completion rate (0.4 km/wk) is running at 32% of required velocity for Corridor 2 civil tender release target date.',
    detectedAt: '2026-08-23T19:30:00Z',
    evidence: ['predicted', 'ai-interpreted'],
  },
  {
    id: 'EW-195',
    title: 'Vendor concentration risk',
    severity: 'moderate',
    projectName: 'Indore Metro Line Corridor (IMLC-01)',
    projectId: 'PRJ-010',
    detail:
      '62% of structural steel fabrication capacity allocated to a single regional supplier currently under credit re-rating. Alternate supplier pre-qualification pending.',
    detectedAt: '2026-08-23T07:22:00Z',
    evidence: ['ai-interpreted', 'verified'],
  },
  {
    id: 'EW-192',
    title: 'Monsoon catchment runoff surge',
    severity: 'high',
    projectName: 'Teesta Stage IV Hydropower Project (TIV-HP)',
    projectId: 'PRJ-008',
    detail:
      'Predictive catchment precipitation model indicates 160% of normal runoff over next 14 days, raising coffer dam overtopping hazard.',
    detectedAt: '2026-08-24T05:00:00Z',
    evidence: ['predicted', 'observed'],
  },
];

const REGIONAL_RISK_SUMMARY = [
  { region: 'North-East', states: 'Assam, Sikkim', avgRisk: 68, band: 'high' as RiskBand, projects: 20 },
  { region: 'Central', states: 'Madhya Pradesh', avgRisk: 58, band: 'high' as RiskBand, projects: 22 },
  { region: 'East', states: 'West Bengal, Bihar', avgRisk: 61, band: 'high' as RiskBand, projects: 38 },
  { region: 'West', states: 'Maharashtra, Gujarat', avgRisk: 36, band: 'moderate' as RiskBand, projects: 53 },
  { region: 'South', states: 'Karnataka, Tamil Nadu, AP', avgRisk: 41, band: 'moderate' as RiskBand, projects: 66 },
  { region: 'North', states: 'Uttar Pradesh, Rajasthan', avgRisk: 34, band: 'moderate' as RiskBand, projects: 49 },
];

function formatRelative(iso: string): string {
  const now = new Date('2026-08-24T08:00:00Z').getTime();
  const then = new Date(iso).getTime();
  const mins = Math.round((now - then) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Operations Dashboard"
        description="National infrastructure risk overview"
        breadcrumbs={[{ label: 'Dashboard' }]}
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-sm border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Updated 24 Aug 2026, 08:00 IST</span>
            </div>
            <Link href="/projects">
              <Button size="sm" className="gap-1 text-xs">
                All Projects
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        }
      />

      <div className="space-y-6 p-6">
        {/* 2. KPI ROW */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {KPI_CARDS.map((stat) => (
            <StatCard key={stat.id} stat={stat} />
          ))}
        </div>

        {/* 3 & 4. RISK DISTRIBUTION & RISK TREND */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Section 3: Risk Distribution (5 columns on desktop) */}
          <Card className="lg:col-span-5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Risk Distribution
                </CardTitle>
                <span className="font-mono text-xs text-muted-foreground">
                  248 Monitored Projects
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stacked Distribution Bar */}
              <div>
                <div className="flex h-4 w-full overflow-hidden rounded-sm border border-border bg-muted/30">
                  {RISK_BAND_DATA.map((b) => (
                    <div
                      key={b.band}
                      style={{ width: `${b.pct}%`, backgroundColor: b.color }}
                      className="h-full transition-all hover:opacity-90"
                      title={`${b.label}: ${b.count} projects (${b.pct}%)`}
                    />
                  ))}
                </div>
                <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
                  <span>Score 0</span>
                  <span>Score 50</span>
                  <span>Score 100</span>
                </div>
              </div>

              {/* Horizontal Bar Breakdown */}
              <div className="space-y-3 pt-1">
                {RISK_BAND_DATA.map((b) => (
                  <div
                    key={b.band}
                    className="rounded-sm border border-border/70 bg-card p-2.5 transition-colors hover:bg-muted/20"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-xs"
                          style={{ backgroundColor: b.color }}
                        />
                        <span className="font-semibold text-foreground">{b.label}</span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          ({b.range})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-foreground">
                          {b.count}
                        </span>
                        <span className="w-10 text-right font-mono text-[11px] text-muted-foreground">
                          {b.pct}%
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${b.pct}%`, backgroundColor: b.color }}
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] leading-tight text-muted-foreground">
                      {b.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2 rounded-sm border border-border/80 bg-muted/30 p-2.5">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Risk scores (0–100) are synthesized from reported progress, optical activity detection, cost run-rates, and predictive lead-indicators.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Risk Trend (7 columns on desktop) */}
          <Card className="lg:col-span-7">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Risk Trend
                  </CardTitle>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    30-day national average risk score trajectory
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-sm border border-risk-high/30 bg-risk-high/10 px-2 py-1 text-xs font-medium text-risk-high">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>+12.7 pts over 30d</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={THIRTY_DAY_TREND}
                    margin={{ top: 12, right: 12, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="riskAvgGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C7591E" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#C7591E" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E2DE" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: '#5B6270' }}
                      axisLine={{ stroke: '#E2E2DE' }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[35, 65]}
                      tick={{ fontSize: 11, fill: '#5B6270' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E2DE',
                        borderRadius: 4,
                        fontSize: 12,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      }}
                      formatter={(val: number) => [`${val.toFixed(1)} / 100`, 'Avg Risk Score']}
                      labelFormatter={(label) => `Date: ${label} 2026`}
                    />
                    <ReferenceLine
                      y={55}
                      stroke="#C7591E"
                      strokeDasharray="4 4"
                      label={{
                        value: 'High Risk Threshold (56)',
                        position: 'insideTopRight',
                        fill: '#C7591E',
                        fontSize: 10,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="avgRisk"
                      stroke="#C7591E"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#riskAvgGrad)"
                      dot={{ r: 3, fill: '#C7591E' }}
                      activeDot={{ r: 5, fill: '#C7591E' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Trend summary strip */}
              <div className="grid grid-cols-3 gap-3 border-t border-border pt-3">
                <div className="rounded-sm bg-muted/30 p-2.5">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Initial (26 Jul)
                  </span>
                  <p className="mt-1 font-mono text-base font-semibold text-foreground">
                    42.1 <span className="text-xs font-normal text-muted-foreground">(Moderate)</span>
                  </p>
                </div>
                <div className="rounded-sm bg-muted/30 p-2.5">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Current (24 Aug)
                  </span>
                  <p className="mt-1 font-mono text-base font-semibold text-risk-high">
                    54.8 <span className="text-xs font-normal text-muted-foreground">(Approaching High)</span>
                  </p>
                </div>
                <div className="rounded-sm bg-muted/30 p-2.5">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Primary Driver
                  </span>
                  <p className="mt-1 text-xs font-medium text-foreground">
                    Monsoon Runoff & Visual Stalls
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 5. PROJECTS REQUIRING ATTENTION */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Projects Requiring Attention
              </CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                High and critical risk assets with reported vs. visual progress divergence
              </p>
            </div>
            <Link href="/projects">
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-primary">
                View all monitored projects <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-y border-border bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Project</th>
                    <th className="px-3 py-3">Location</th>
                    <th className="px-3 py-3">Sector</th>
                    <th className="px-3 py-3">Risk</th>
                    <th className="px-3 py-3 text-center">Reported Progress</th>
                    <th className="px-3 py-3 text-center">
                      <div className="flex flex-col items-center">
                        <span>Visual Progress</span>
                        <span className="text-[10px] font-normal lowercase tracking-normal text-muted-foreground">
                          (estimate)
                        </span>
                      </div>
                    </th>
                    <th className="px-4 py-3">Evidence</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ATTENTION_PROJECTS.map((p) => {
                    const hasSignificantGap = Math.abs(p.variance) >= 10;
                    return (
                      <tr
                        key={p.id}
                        className="transition-colors hover:bg-muted/30"
                      >
                        {/* Project */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <Link
                              href={`/projects/${p.id}`}
                              className="font-medium text-foreground hover:underline"
                            >
                              {p.name}
                            </Link>
                            <span className="font-mono text-[11px] text-muted-foreground">
                              {p.code}
                            </span>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="px-3 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{p.state}</span>
                            <span className="text-[11px] text-muted-foreground">{p.district}</span>
                          </div>
                        </td>

                        {/* Sector */}
                        <td className="px-3 py-3">
                          <span className="rounded-sm border border-border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">
                            {p.sector}
                          </span>
                        </td>

                        {/* Risk */}
                        <td className="px-3 py-3">
                          <RiskBadge band={p.riskBand} score={p.riskScore} />
                        </td>

                        {/* Reported Progress */}
                        <td className="px-3 py-3 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-mono text-xs font-semibold text-foreground">
                              {p.reportedProgress}%
                            </span>
                            <span className="text-[10px] text-muted-foreground">Contractor log</span>
                          </div>
                        </td>

                        {/* Visual Progress (Explicitly labeled as estimate) */}
                        <td className="px-3 py-3 text-center">
                          <div className="inline-flex flex-col items-center">
                            <div className="flex items-center gap-1">
                              <span
                                className={cn(
                                  'font-mono text-xs font-semibold',
                                  hasSignificantGap ? 'text-risk-high' : 'text-foreground'
                                )}
                              >
                                {p.visualEstimate}%
                              </span>
                              <span className="text-[10px] text-muted-foreground">(est.)</span>
                            </div>
                            <span
                              className={cn(
                                'font-mono text-[10px]',
                                p.variance <= -10
                                  ? 'font-medium text-risk-critical'
                                  : p.variance <= -5
                                    ? 'text-risk-high'
                                    : 'text-muted-foreground'
                              )}
                            >
                              {p.variance > 0 ? `+${p.variance}%` : `${p.variance}%`} var.
                            </span>
                          </div>
                        </td>

                        {/* Evidence */}
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {p.evidence.map((e) => (
                              <EvidenceChip key={e} type={e} />
                            ))}
                          </div>
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3 text-right">
                          <Link href={`/projects/${p.id}`}>
                            <Button variant="outline" size="sm" className="h-7 gap-1 px-2.5 text-xs">
                              Review
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="border-t border-border bg-muted/20 px-4 py-2.5">
              <p className="text-[11px] text-muted-foreground">
                <strong className="font-semibold text-foreground">Note on Visual Estimates:</strong>{' '}
                Visual progress estimates are algorithmically synthesized from optical and SAR satellite passes and verified site surveillance. They represent independent observational benchmarks rather than certified contractual measurements.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 6 & 7. EARLY WARNINGS & INDIA RISK MAP PLACEHOLDER */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Section 6: Early Warnings (7 columns on desktop) */}
          <Card className="lg:col-span-7">
            <CardHeader className="flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Early Warnings
                </CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Predictive signals & observational anomalies awaiting intervention
                </p>
              </div>
              <Link href="/alerts">
                <Button variant="ghost" size="sm" className="gap-1 text-xs text-primary">
                  All alerts <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {EARLY_WARNINGS.map((warning) => (
                <div
                  key={warning.id}
                  className="rounded-md border border-border bg-card p-3.5 transition-colors hover:bg-muted/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {warning.id}
                        </span>
                        <RiskBadge band={warning.severity} showDot={true} />
                        <span className="text-[11px] font-medium text-foreground">
                          {warning.title}
                        </span>
                      </div>

                      <Link
                        href={`/projects/${warning.projectId}`}
                        className="mt-1 block truncate text-xs font-semibold text-primary hover:underline"
                      >
                        {warning.projectName}
                      </Link>

                      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                        {warning.detail}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            Evidence:
                          </span>
                          {warning.evidence.map((e) => (
                            <EvidenceChip key={e} type={e} />
                          ))}
                        </div>
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatRelative(warning.detectedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Section 7: India Risk Map Placeholder (5 columns on desktop) */}
          <Card className="lg:col-span-5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    National Infrastructure Risk Map
                  </CardTitle>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Regional risk index & state-level telemetry overview
                  </p>
                </div>
                <Link href="/map">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs text-primary">
                    Full Map <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Map Vector/Visual Placeholder */}
              <div className="relative flex flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/20 p-4 text-center">
                <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-border bg-card shadow-xs">
                  <MapPin className="h-10 w-10 text-primary" />
                  {/* Visual simulated risk nodes */}
                  <span className="absolute -top-1 right-2 flex h-3.5 w-3.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-risk-critical opacity-75" />
                    <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-risk-critical" />
                  </span>
                  <span className="absolute bottom-2 -left-1 flex h-3 w-3">
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-risk-high" />
                  </span>
                  <span className="absolute bottom-3 right-0 flex h-2.5 w-2.5">
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-risk-moderate" />
                  </span>
                </div>
                <p className="mt-3 text-xs font-semibold text-foreground">
                  India GIS Layer — 248 Project Coordinates
                </p>
                <p className="mt-0.5 max-w-xs text-[11px] text-muted-foreground">
                  Multi-spectral satellite passes & ground sensor telemetry mapped across 10 active states.
                </p>
              </div>

              {/* Regional Risk Index Table */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Regional Risk Index
                </p>
                <div className="divide-y divide-border rounded-sm border border-border bg-card">
                  {REGIONAL_RISK_SUMMARY.map((reg) => (
                    <div
                      key={reg.region}
                      className="flex items-center justify-between px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn('h-2 w-2 rounded-full', {
                            'bg-risk-low': reg.band === 'low',
                            'bg-risk-moderate': reg.band === 'moderate',
                            'bg-risk-high': reg.band === 'high',
                            'bg-risk-critical': reg.band === 'critical',
                          })}
                        />
                        <div>
                          <span className="font-semibold text-foreground">{reg.region}</span>
                          <span className="ml-1 text-[11px] text-muted-foreground">
                            ({reg.states})
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-muted-foreground">
                          {reg.projects} proj
                        </span>
                        <span className="font-mono text-xs font-semibold text-foreground">
                          {reg.avgRisk}
                        </span>
                        <RiskBadge band={reg.band} showDot={false} className="py-0 text-[10px]" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 9. DATA CLASSIFICATION & EVIDENCE INTEGRITY FOOTER */}
        <div className="rounded-md border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Layers className="h-4 w-4 text-primary" />
            <span>InfraSight Data Classification & Evidence Taxonomy</span>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 text-xs">
            <div className="rounded-sm border border-border/70 bg-muted/20 p-2.5">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <EvidenceChip type="reported" />
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                Official data submitted by contractors and line ministries via monthly logs.
              </p>
            </div>

            <div className="rounded-sm border border-border/70 bg-muted/20 p-2.5">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <EvidenceChip type="observed" />
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                Direct evidence detected from optical, SAR satellite, drone, and site sensors.
              </p>
            </div>

            <div className="rounded-sm border border-border/70 bg-muted/20 p-2.5">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <EvidenceChip type="predicted" />
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                Algorithmic projection of timeline, weather exposure, and runoff risks.
              </p>
            </div>

            <div className="rounded-sm border border-border/70 bg-muted/20 p-2.5">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <EvidenceChip type="ai-interpreted" />
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                Synthesized divergence score comparing reported claims against observed reality.
              </p>
            </div>

            <div className="rounded-sm border border-border/70 bg-muted/20 p-2.5">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <EvidenceChip type="verified" />
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                Audited and endorsed by an authorized infrastructure monitoring officer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
