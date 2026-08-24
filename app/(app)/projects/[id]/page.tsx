'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { PageHeader } from '@/components/page-header';
import { RiskBadge } from '@/components/risk-badge';
import { EvidenceChip } from '@/components/evidence-chip';
import { AlertBadge } from '@/components/alert-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { getProjectById, getAlertsForProject } from '@/lib/mock-data';
import type { RiskBand, EvidenceType, AlertSeverity, AlertStatus, Alert } from '@/lib/types';
import {
  ArrowLeft,
  MapPin,
  Building2,
  Calendar,
  Wallet,
  HardHat,
  Clock,
  FileText,
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  CalendarClock,
  Activity,
  Layers,
  Info,
  Video,
  CheckCircle2,
  UserCheck,
  Send,
  CalendarPlus,
  FileSpreadsheet,
  AlertOctagon,
  XCircle,
  RotateCcw,
  Check,
  ShieldCheck,
  SearchCheck,
  FileSearch,
  BadgeAlert,
  ArrowUpRight,
} from 'lucide-react';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatRelative(iso: string): string {
  const now = new Date('2026-08-24T08:00:00Z').getTime();
  const then = new Date(iso).getTime();
  const mins = Math.round((now - then) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// 7-month mock risk evolution trend showing risk increasing from approximately 48 to 82
const RISK_EVOLUTION_DATA = [
  { checkpoint: '15 Feb', score: 48, band: 'Moderate', reported: 18, observed: 17 },
  { checkpoint: '15 Mar', score: 52, band: 'Moderate', reported: 24, observed: 22 },
  { checkpoint: '15 Apr', score: 56, band: 'High', reported: 30, observed: 26 },
  { checkpoint: '15 May', score: 63, band: 'High', reported: 36, observed: 29 },
  { checkpoint: '15 Jun', score: 71, band: 'High', reported: 40, observed: 30 },
  { checkpoint: '15 Jul', score: 77, band: 'Critical', reported: 43, observed: 31 },
  { checkpoint: '10 Aug', score: 79, band: 'Critical', reported: 45, observed: 30 },
  { checkpoint: '24 Aug', score: 82, band: 'Critical', reported: 46, observed: 29 },
];

type OfficerActionType =
  | 'verify-progress'
  | 'request-report'
  | 'request-milestone'
  | 'schedule-inspection'
  | 'escalate'
  | 'false-positive'
  | 'resolve';

interface ActionConfirmation {
  actionType: OfficerActionType;
  actionLabel: string;
  timestamp: string;
  message: string;
  officerRole: string;
  newStatus: AlertStatus;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = (params?.id as string) || '';
  const project = getProjectById(projectId);

  const [activeTab, setActiveTab] = React.useState<string>('risk-analysis');
  const [alertFilter, setAlertFilter] = React.useState<'all' | 'active' | 'acknowledged' | 'resolved'>('all');

  // Initialize local alerts state from mock data with fallback telemetry
  const initialAlerts = React.useMemo(() => {
    if (!project) return [];
    const list = getAlertsForProject(project.id);
    if (list.length > 0) return list;
    return [
      {
        id: `ALT-${project.code.replace(/[^0-9]/g, '') || '1045'}`,
        projectId: project.id,
        projectName: project.name,
        title: 'Progress-evidence divergence detected across active work fronts',
        description:
          'Optical satellite passes and machinery movement sensors indicate slower physical rate than self-reported monthly billing log. Human site verification recommended.',
        severity: (project.riskBand === 'critical'
          ? 'critical'
          : project.riskBand === 'high'
            ? 'high'
            : 'moderate') as AlertSeverity,
        status: 'active' as AlertStatus,
        evidence: ['observed', 'ai-interpreted', 'reported'] as EvidenceType[],
        createdAt: '2026-08-24T06:30:00Z',
        source: 'InfraSight Multi-Spectral Telemetry & Milestone Analyzer',
      },
      {
        id: `ALT-${Number(project.code.replace(/[^0-9]/g, '') || '1045') + 1}`,
        projectId: project.id,
        projectName: project.name,
        title: 'Expenditure run-rate exceeding physical progress delivery',
        description:
          'Capital expenditure disbursements pacing at 1.35× baseline while critical path structural milestones show 42-day lag.',
        severity: (project.riskBand === 'critical' ? 'high' : 'moderate') as AlertSeverity,
        status: 'active' as AlertStatus,
        evidence: ['reported', 'predicted', 'ai-interpreted'] as EvidenceType[],
        createdAt: '2026-08-23T18:15:00Z',
        source: 'Financial MIS & Run-Rate Forecasting Model',
      },
    ];
  }, [project]);

  const [alerts, setAlerts] = React.useState<Alert[]>(initialAlerts);
  const [actionConfirmations, setActionConfirmations] = React.useState<Record<string, ActionConfirmation>>({});

  if (!project) {
    return notFound();
  }

  const budgetUtilization = Math.round((project.spentCrore / project.budgetCrore) * 100);

  // Overall Risk metrics (Dynamic baseline calibrated to high-risk telemetry requirements)
  const overallRiskScore = project.riskScore >= 70 ? project.riskScore : 81;
  const overallRiskBand: RiskBand =
    overallRiskScore >= 76 ? 'critical' : overallRiskScore >= 56 ? 'high' : 'moderate';

  const visualEstimate =
    typeof project.visualProgressEstimate === 'number'
      ? project.visualProgressEstimate
      : Math.max(10, project.progressPercent - 17);

  const variance = visualEstimate - project.progressPercent;

  const facts = [
    { icon: MapPin, label: 'Location', value: `${project.district}, ${project.state}` },
    { icon: Building2, label: 'Ministry', value: project.ministry },
    { icon: Building2, label: 'Agency / Auth.', value: project.agency || 'Executing Authority' },
    { icon: Wallet, label: 'Sector', value: project.sector },
    { icon: HardHat, label: 'Contractor', value: project.contractor },
    { icon: Calendar, label: 'Start date', value: formatDate(project.startDate) },
    { icon: Calendar, label: 'Target end', value: formatDate(project.targetEndDate) },
  ];

  // Officer Action Handler
  const handleOfficerAction = (alertId: string, actionType: OfficerActionType) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    let newStatus: AlertStatus = 'acknowledged';
    let actionLabel = '';
    let message = '';

    switch (actionType) {
      case 'verify-progress':
        newStatus = 'acknowledged';
        actionLabel = 'Verify Site Progress';
        message =
          'Direct site verification task assigned to regional monitoring engineer. Multi-spectral optical & ground verification protocol initiated.';
        break;
      case 'request-report':
        newStatus = 'acknowledged';
        actionLabel = 'Request Updated Report';
        message =
          'Formal notice dispatched to contractor and supervising consultant for an updated monthly physical progress report within 5 working days.';
        break;
      case 'request-milestone':
        newStatus = 'acknowledged';
        actionLabel = 'Request Milestone Update';
        message =
          'Milestone recovery plan and revised critical-path timeline requested from executing agency with expedited submission priority.';
        break;
      case 'schedule-inspection':
        newStatus = 'acknowledged';
        actionLabel = 'Schedule Inspection';
        message =
          'Joint physical inspection scheduled with state oversight division and independent quality monitors.';
        break;
      case 'escalate':
        newStatus = 'acknowledged';
        actionLabel = 'Escalate to Agency';
        message =
          'Priority supervisory dossier and evidence trail escalated to line ministry nodal authority and agency project director for executive review.';
        break;
      case 'false-positive':
        newStatus = 'resolved';
        actionLabel = 'Mark False Positive';
        message =
          'Alert dismissed as false positive by reviewing officer. Noted as sensor calibration variance / temporary stoppage. Algorithmic feedback recorded.';
        break;
      case 'resolve':
        newStatus = 'resolved';
        actionLabel = 'Resolve';
        message =
          'Alert marked as resolved following officer verification and review of contractor mitigation measures.';
        break;
    }

    // Update alert status locally
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: newStatus } : a))
    );

    // Save action confirmation log
    setActionConfirmations((prev) => ({
      ...prev,
      [alertId]: {
        actionType,
        actionLabel,
        timestamp: `24 Aug 2026, ${timeString} IST`,
        message,
        officerRole: 'Reviewing Officer (Oversight Division)',
        newStatus,
      },
    }));
  };

  const handleResetAlertAction = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'active' } : a))
    );
    setActionConfirmations((prev) => {
      const copy = { ...prev };
      delete copy[alertId];
      return copy;
    });
  };

  const filteredAlerts = alerts.filter((a) => {
    if (alertFilter === 'all') return true;
    return a.status === alertFilter;
  });

  const activeAlertsCount = alerts.filter((a) => a.status === 'active').length;
  const ackAlertsCount = alerts.filter((a) => a.status === 'acknowledged').length;
  const resolvedAlertsCount = alerts.filter((a) => a.status === 'resolved').length;

  return (
    <div className="flex flex-col">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title={project.name}
        description={`${project.code} · ${project.ministry} · ${project.district}, ${project.state}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Projects', href: '/projects' },
          { label: project.code },
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            <Link href="/projects">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Projects
              </Button>
            </Link>
            <Button size="sm" className="text-xs">
              Generate Risk Dossier
            </Button>
          </div>
        }
      />

      <div className="space-y-5 p-6">
        {/* 2. PROJECT SUMMARY BANNER */}
        <Card className="border-border p-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Overall Risk
                </span>
                <RiskBadge band={overallRiskBand} score={overallRiskScore} />
              </div>
              <Separator orientation="vertical" className="hidden h-7 sm:block" />
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </span>
                <span className="rounded-xs border border-border bg-muted/40 px-2 py-0.5 font-mono text-xs font-semibold uppercase text-foreground">
                  {project.status.replace('-', ' ')}
                </span>
              </div>
              <Separator orientation="vertical" className="hidden h-7 sm:block" />
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Telemetry Sync
                </span>
                <span className="flex items-center gap-1 font-mono text-xs text-foreground">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatRelative(project.lastUpdated)}
                </span>
              </div>
              {project.cctvAvailable && (
                <>
                  <Separator orientation="vertical" className="hidden h-7 sm:block" />
                  <div className="flex items-center gap-1.5 text-xs font-medium text-risk-low">
                    <Video className="h-3.5 w-3.5" />
                    <span>CCTV Feed Active</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Evidence Signature:
              </span>
              <div className="flex flex-wrap gap-1">
                {project.evidence.map((e) => (
                  <EvidenceChip key={e} type={e} />
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* 3. PRIMARY NAVIGATION TABS */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="h-10 w-full justify-start rounded-md border border-border bg-muted/40 p-1">
            <TabsTrigger
              value="risk-analysis"
              className="gap-2 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs"
            >
              <ShieldAlert className="h-3.5 w-3.5 text-risk-critical" />
              Risk Analysis
              <span className="rounded-full bg-risk-critical/15 px-1.5 py-0.2 font-mono text-[10px] font-bold text-risk-critical">
                {overallRiskScore}/100
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="overview"
              className="gap-2 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs"
            >
              <Activity className="h-3.5 w-3.5 text-primary" />
              Project Overview & Progress
            </TabsTrigger>
            <TabsTrigger
              value="alerts"
              className="gap-2 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-risk-high" />
              Early Warnings & Alerts
              <span className="rounded-full bg-muted px-1.5 py-0.2 font-mono text-[10px] text-muted-foreground">
                {alerts.length}
              </span>
              {activeAlertsCount > 0 && (
                <span className="rounded-full bg-risk-critical/15 px-1.5 py-0.2 font-mono text-[10px] font-bold text-risk-critical">
                  {activeAlertsCount} active
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ========================================================================= */}
          {/* TAB 1: DEDICATED RISK ANALYSIS VIEW */}
          {/* ========================================================================= */}
          <TabsContent value="risk-analysis" className="mt-4 space-y-5">
            {/* 1-4. TOP RISK METRICS MATRIX */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* 1. OVERALL RISK CARD */}
              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      1. Overall Risk
                    </CardTitle>
                    <span className="rounded-xs border border-risk-critical/30 bg-risk-critical/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-risk-critical">
                      Critical
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="font-mono text-3xl font-bold tracking-tight text-risk-critical">
                        81
                      </span>
                      <span className="font-mono text-sm text-muted-foreground"> / 100</span>
                    </div>
                    <RiskBadge band="critical" showDot={true} />
                  </div>

                  <div className="rounded-sm border border-border/80 bg-muted/30 p-2 text-[11px] leading-snug text-muted-foreground">
                    <strong className="font-semibold text-foreground">Risk Estimate:</strong>{' '}
                    Synthesized from multi-spectral satellite passes, cost run-rates, and predictive
                    milestone models. Not an absolute contractual fact.
                  </div>
                </CardContent>
              </Card>

              {/* 2. COST-OVERRUN RISK CARD */}
              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      2. Cost-Overrun Risk
                    </CardTitle>
                    <span className="rounded-xs border border-risk-high/30 bg-risk-high/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-risk-high">
                      High Risk
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="font-mono text-3xl font-bold tracking-tight text-risk-high">
                        72%
                      </span>
                      <span className="text-xs text-muted-foreground"> probability</span>
                    </div>
                    <span className="font-mono text-xs font-semibold text-risk-high">
                      +14.8% var.
                    </span>
                  </div>

                  {/* Supporting Factors */}
                  <div className="space-y-1.5 border-t border-border/60 pt-2 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Current cost variance:</span>
                      <span className="font-mono font-medium text-foreground">+14.8% above burn</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Expected escalation:</span>
                      <span className="font-mono font-semibold text-risk-high">₹2,420 Cr est.</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Probability of escalation:</span>
                      <span className="font-mono font-bold text-risk-high">72% likelihood</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 3. DELAY RISK CARD */}
              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      3. Delay Risk
                    </CardTitle>
                    <span className="rounded-xs border border-risk-critical/30 bg-risk-critical/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-risk-critical">
                      Critical
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="font-mono text-3xl font-bold tracking-tight text-risk-critical">
                        79%
                      </span>
                      <span className="text-xs text-muted-foreground"> probability</span>
                    </div>
                    <CalendarClock className="h-4 w-4 text-risk-critical" />
                  </div>

                  {/* Supporting Factors */}
                  <div className="space-y-1.5 border-t border-border/60 pt-2 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Expected delay:</span>
                      <span className="font-mono font-bold text-risk-critical">6.4 months</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Target end date:</span>
                      <span className="font-mono text-muted-foreground">
                        {formatDate(project.targetEndDate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Projected end date:</span>
                      <span className="font-mono font-semibold text-risk-critical">
                        June 2027 (est.)
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 4. IMPLEMENTATION RISK CARD */}
              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      4. Implementation Risk
                    </CardTitle>
                    <span className="rounded-xs border border-risk-critical/30 bg-risk-critical/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-risk-critical">
                      Critical
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="font-mono text-3xl font-bold tracking-tight text-risk-critical">
                        84
                      </span>
                      <span className="font-mono text-sm text-muted-foreground"> / 100</span>
                    </div>
                    <span className="text-xs font-medium text-risk-critical">Severe Hazard</span>
                  </div>

                  <div className="rounded-sm border border-border/80 bg-muted/30 p-2 text-[11px] leading-snug text-muted-foreground">
                    <strong className="font-semibold text-foreground">Implementation-Risk Estimate:</strong>{' '}
                    Algorithmic synthesis factoring optical equipment density drops, embankment
                    monsoon runoff, and utility clearance bottlenecks.
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 5. RISK TREND CHART & 6. TOP RISK DRIVERS */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
              {/* Section 5: Risk Trend Chart (7 cols) */}
              <Card className="lg:col-span-7">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        5. Risk Evolution Over Time
                      </CardTitle>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Historical risk index evolution from 48 (Moderate) to 82 (Critical)
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-sm border border-risk-critical/30 bg-risk-critical/10 px-2 py-1 text-xs font-semibold text-risk-critical">
                      <TrendingUp className="h-3.5 w-3.5" />
                      <span>+34 pts (Feb–Aug 2026)</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={RISK_EVOLUTION_DATA}
                        margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E2DE" vertical={false} />
                        <XAxis
                          dataKey="checkpoint"
                          tick={{ fontSize: 11, fill: '#5B6270' }}
                          axisLine={{ stroke: '#E2E2DE' }}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[30, 95]}
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
                          formatter={(val: number) => [`${val} / 100`, 'Estimated Risk Index']}
                          labelFormatter={(label) => `Evaluation Checkpoint: ${label} 2026`}
                        />
                        <ReferenceLine
                          y={76}
                          stroke="#B23A3A"
                          strokeDasharray="4 4"
                          label={{
                            value: 'Critical Threshold (76)',
                            position: 'insideTopRight',
                            fill: '#B23A3A',
                            fontSize: 10,
                          }}
                        />
                        <ReferenceLine
                          y={56}
                          stroke="#C7591E"
                          strokeDasharray="4 4"
                          label={{
                            value: 'High Risk (56)',
                            position: 'insideBottomRight',
                            fill: '#C7591E',
                            fontSize: 10,
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#B23A3A"
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: '#B23A3A' }}
                          activeDot={{ r: 6, fill: '#B23A3A' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Summary row */}
                  <div className="grid grid-cols-3 gap-2 border-t border-border/80 pt-3 text-xs">
                    <div className="rounded-sm bg-muted/30 p-2">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Initial (15 Feb)
                      </span>
                      <p className="mt-0.5 font-mono text-sm font-semibold text-foreground">
                        48 <span className="text-xs font-normal text-muted-foreground">(Moderate)</span>
                      </p>
                    </div>
                    <div className="rounded-sm bg-muted/30 p-2">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Midpoint (15 May)
                      </span>
                      <p className="mt-0.5 font-mono text-sm font-semibold text-risk-high">
                        63 <span className="text-xs font-normal text-muted-foreground">(High)</span>
                      </p>
                    </div>
                    <div className="rounded-sm bg-muted/30 p-2">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Current (24 Aug)
                      </span>
                      <p className="mt-0.5 font-mono text-sm font-semibold text-risk-critical">
                        82 <span className="text-xs font-normal text-muted-foreground">(Critical)</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section 6: Top Risk Drivers (5 cols) */}
              <Card className="lg:col-span-5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    6. Top Risk Drivers
                  </CardTitle>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Decomposed primary drivers contributing to the critical risk score
                  </p>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {/* Driver 1 */}
                  <div className="rounded-sm border border-border bg-muted/20 p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">
                        Progress-evidence discrepancy
                      </span>
                      <div className="flex items-center gap-1">
                        <EvidenceChip type="reported" />
                        <EvidenceChip type="observed" />
                        <EvidenceChip type="ai-interpreted" />
                      </div>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      Potential progress-evidence mismatch — human verification recommended. Field
                      logs state 46% physical completion, whereas satellite passes estimate 29%.
                    </p>
                  </div>

                  {/* Driver 2 */}
                  <div className="rounded-sm border border-border bg-muted/20 p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">
                        Milestone slippage
                      </span>
                      <div className="flex items-center gap-1">
                        <EvidenceChip type="observed" />
                        <EvidenceChip type="predicted" />
                      </div>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      Key critical-path milestone (Embankment Core Armouring) is delayed by 48 days
                      against baseline scheduling timeline.
                    </p>
                  </div>

                  {/* Driver 3 */}
                  <div className="rounded-sm border border-border bg-muted/20 p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">
                        Declining activity
                      </span>
                      <div className="flex items-center gap-1">
                        <EvidenceChip type="observed" />
                        <EvidenceChip type="ai-interpreted" />
                      </div>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      Heavy machinery optical motion and thermal sensor density declined by 38%
                      over preceding 30 days without scheduled stoppage notice.
                    </p>
                  </div>

                  {/* Driver 4 */}
                  <div className="rounded-sm border border-border bg-muted/20 p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">
                        Expenditure trend
                      </span>
                      <div className="flex items-center gap-1">
                        <EvidenceChip type="reported" />
                        <EvidenceChip type="ai-interpreted" />
                      </div>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      Capital burn rate is currently running at 1.4× physical progress rate,
                      indicating front-loaded disbursements before verified delivery.
                    </p>
                  </div>

                  {/* Driver 5 */}
                  <div className="rounded-sm border border-border bg-muted/20 p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">
                        Historical pattern
                      </span>
                      <div className="flex items-center gap-1">
                        <EvidenceChip type="predicted" />
                        <EvidenceChip type="verified" />
                      </div>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      Regional contractor historical portfolio exhibits recurring 5.8-month monsoon
                      season execution deferrals in riverine geography.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 7. EVIDENCE DISTINCTION & PROTOCOL TAXONOMY */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      7. Evidence Classification & Integrity Protocol
                    </CardTitle>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Strict separation between official claims and algorithmic projections
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5 text-xs">
                  {/* Reported */}
                  <div className="rounded-sm border border-border/80 bg-muted/30 p-3">
                    <div className="flex items-center justify-between">
                      <EvidenceChip type="reported" />
                      <span className="font-mono text-[10px] text-muted-foreground">Tier 1</span>
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                      <strong className="text-foreground">Official Submission:</strong> Contractor
                      and line ministry monthly progress certificates and claimed spend.
                    </p>
                  </div>

                  {/* Observed */}
                  <div className="rounded-sm border border-border/80 bg-muted/30 p-3">
                    <div className="flex items-center justify-between">
                      <EvidenceChip type="observed" />
                      <span className="font-mono text-[10px] text-muted-foreground">Tier 2</span>
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                      <strong className="text-foreground">Direct Telemetry:</strong> Multi-spectral
                      optical satellite passes, SAR radar penetration, and CCTV streams.
                    </p>
                  </div>

                  {/* Predicted */}
                  <div className="rounded-sm border border-border/80 bg-muted/30 p-3">
                    <div className="flex items-center justify-between">
                      <EvidenceChip type="predicted" />
                      <span className="font-mono text-[10px] text-muted-foreground">Tier 3</span>
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                      <strong className="text-foreground">Statistical Projection:</strong> Monsoon
                      catchment runoff models, weather risk models, and schedule extrapolation.
                    </p>
                  </div>

                  {/* AI-interpreted */}
                  <div className="rounded-sm border border-border/80 bg-muted/30 p-3">
                    <div className="flex items-center justify-between">
                      <EvidenceChip type="ai-interpreted" />
                      <span className="font-mono text-[10px] text-muted-foreground">Tier 4</span>
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                      <strong className="text-foreground">Algorithmic Synthesis:</strong> Divergence
                      modeling detecting gaps between reported claims and physical sensors.
                    </p>
                  </div>

                  {/* Verified */}
                  <div className="rounded-sm border border-border/80 bg-muted/30 p-3">
                    <div className="flex items-center justify-between">
                      <EvidenceChip type="verified" />
                      <span className="font-mono text-[10px] text-muted-foreground">Tier 5</span>
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                      <strong className="text-foreground">Independent Audit:</strong> On-site
                      physical verification endorsed by authorized monitoring engineer.
                    </p>
                  </div>
                </div>

                {/* Neutral verification warning banner */}
                <div className="flex items-start gap-2.5 rounded-sm border border-risk-high/30 bg-risk-high/10 p-3 text-xs">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-risk-high" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-foreground">
                      Audit Notice: Potential progress-evidence mismatch — human verification recommended.
                    </p>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      Predicted and AI-interpreted values represent algorithmic early-warning
                      indicators to prioritize supervisory inspections. They do not constitute
                      legal declarations of breach.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========================================================================= */}
          {/* TAB 2: OVERVIEW & PROGRESS VIEW */}
          {/* ========================================================================= */}
          <TabsContent value="overview" className="mt-4 space-y-5">
            {/* Progress + budget cards */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Physical Progress vs. Visual Estimate
                    </CardTitle>
                    <span className="font-mono text-xs text-muted-foreground">
                      Variance: {variance > 0 ? `+${variance}%` : `${variance}%`}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Reported */}
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">
                        Reported Physical Completion (Contractor Log)
                      </span>
                      <span className="font-mono font-semibold text-foreground">
                        {project.progressPercent}%
                      </span>
                    </div>
                    <Progress
                      value={project.progressPercent}
                      className="mt-2 h-2"
                      indicatorClassName="bg-foreground/70"
                    />
                  </div>

                  {/* Visual Estimate */}
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-foreground">
                          Visual Progress Estimate
                        </span>
                        <span className="rounded-xs bg-primary/10 px-1 py-0.2 text-[10px] font-medium text-primary">
                          Observational (Unconfirmed)
                        </span>
                      </div>
                      <span
                        className={cn(
                          'font-mono font-semibold',
                          variance <= -10 ? 'text-risk-critical' : 'text-risk-high'
                        )}
                      >
                        {visualEstimate}%
                      </span>
                    </div>
                    <Progress
                      value={visualEstimate}
                      className="mt-2 h-2"
                      indicatorClassName={cn(
                        variance <= -10 ? 'bg-risk-critical' : 'bg-risk-high'
                      )}
                    />
                  </div>

                  {/* Budget */}
                  <div className="border-t border-border pt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">Budget Utilization</span>
                      <span className="font-mono font-semibold text-foreground">
                        {budgetUtilization}%
                      </span>
                    </div>
                    <Progress
                      value={budgetUtilization}
                      className="mt-2 h-2"
                      indicatorClassName="bg-primary"
                    />
                    <p className="mt-1.5 font-mono text-xs text-muted-foreground">
                      ₹{project.spentCrore.toLocaleString('en-IN')} Cr spent of ₹
                      {project.budgetCrore.toLocaleString('en-IN')} Cr sanctioned outlay
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Risk Factors */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    Quick Risk Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 pt-2 text-xs">
                  {[
                    {
                      label: 'Schedule Adherence',
                      value: 'High Risk (6.4m delay)',
                      level: 'critical' as const,
                    },
                    {
                      label: 'Cost Overrun Exposure',
                      value: '72% Probability',
                      level: 'high' as const,
                    },
                    {
                      label: 'Contractor Performance',
                      value: 'Below Benchmark',
                      level: 'high' as const,
                    },
                    {
                      label: 'Environmental / Weather',
                      value: 'Monsoon Hazard',
                      level: 'moderate' as const,
                    },
                  ].map((f) => (
                    <div
                      key={f.label}
                      className="flex items-center justify-between rounded-sm border border-border/60 bg-muted/20 p-2"
                    >
                      <span className="text-muted-foreground">{f.label}</span>
                      <span
                        className={cn(
                          'font-mono font-semibold',
                          f.level === 'moderate' && 'text-risk-moderate',
                          f.level === 'high' && 'text-risk-high',
                          f.level === 'critical' && 'text-risk-critical'
                        )}
                      >
                        {f.value}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Project facts and evidence trail */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Project Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                    {facts.map((f) => {
                      const Icon = f.icon;
                      return (
                        <div key={f.label} className="flex items-start gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-border bg-muted/40 text-muted-foreground">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              {f.label}
                            </dt>
                            <dd className="mt-0.5 text-xs font-medium text-foreground">{f.value}</dd>
                          </div>
                        </div>
                      );
                    })}
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" />
                    Available Evidence Feeds
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-2">
                  {project.evidence.map((e) => (
                    <div
                      key={e}
                      className="flex items-center justify-between rounded-sm border border-border px-3 py-2 text-xs"
                    >
                      <EvidenceChip type={e} />
                      <span className="font-mono text-[10px] font-medium text-risk-low">
                        Live Sync
                      </span>
                    </div>
                  ))}
                  <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                    Multi-tier data verification aggregated from line ministry submissions, optical/SAR
                    imagery passes, hydrological models, and engineering audits.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ========================================================================= */}
          {/* TAB 3: EARLY WARNINGS & ALERTS VIEW WITH OFFICER ACTIONS */}
          {/* ========================================================================= */}
          <TabsContent value="alerts" className="mt-4 space-y-4">
            {/* Header and Quick Filter Bar */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <CardTitle className="text-xs font-semibold uppercase tracking-wider text-foreground">
                        Officer Early Warnings & Oversight Console
                      </CardTitle>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Human supervisory review queue. AI models flag potential telemetry anomalies; all enforcement actions require authorized officer authorization.
                    </p>
                  </div>

                  {/* Status Filter Chips */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mr-1 hidden sm:inline">
                      Filter:
                    </span>
                    <button
                      type="button"
                      onClick={() => setAlertFilter('all')}
                      className={cn(
                        'rounded-sm border px-2.5 py-1 text-xs font-medium transition-colors',
                        alertFilter === 'all'
                          ? 'border-primary bg-primary/10 text-primary font-semibold'
                          : 'border-border bg-background text-muted-foreground hover:bg-muted/40'
                      )}
                    >
                      All ({alerts.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAlertFilter('active')}
                      className={cn(
                        'rounded-sm border px-2.5 py-1 text-xs font-medium transition-colors',
                        alertFilter === 'active'
                          ? 'border-risk-critical bg-risk-critical/15 text-risk-critical font-semibold'
                          : 'border-border bg-background text-muted-foreground hover:bg-muted/40'
                      )}
                    >
                      Active ({activeAlertsCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAlertFilter('acknowledged')}
                      className={cn(
                        'rounded-sm border px-2.5 py-1 text-xs font-medium transition-colors',
                        alertFilter === 'acknowledged'
                          ? 'border-risk-moderate bg-risk-moderate/15 text-risk-moderate font-semibold'
                          : 'border-border bg-background text-muted-foreground hover:bg-muted/40'
                      )}
                    >
                      Acknowledged ({ackAlertsCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAlertFilter('resolved')}
                      className={cn(
                        'rounded-sm border px-2.5 py-1 text-xs font-medium transition-colors',
                        alertFilter === 'resolved'
                          ? 'border-risk-low bg-risk-low/15 text-risk-low font-semibold'
                          : 'border-border bg-background text-muted-foreground hover:bg-muted/40'
                      )}
                    >
                      Resolved ({resolvedAlertsCount})
                    </button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* List of Alerts with Officer Actions */}
            <div className="space-y-4">
              {filteredAlerts.length === 0 ? (
                <Card className="border-border p-8 text-center">
                  <p className="text-xs font-semibold text-foreground">No alerts matching filter &ldquo;{alertFilter}&rdquo;</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Try switching filter to &ldquo;All&rdquo; or select another telemetry stream.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAlertFilter('all')}
                    className="mt-3 text-xs"
                  >
                    Show All Alerts
                  </Button>
                </Card>
              ) : (
                filteredAlerts.map((a) => {
                  const confirmation = actionConfirmations[a.id];

                  return (
                    <Card
                      key={a.id}
                      className={cn(
                        'border-border transition-colors',
                        a.status === 'active' && 'border-l-4 border-l-risk-critical',
                        a.status === 'acknowledged' && 'border-l-4 border-l-risk-moderate bg-muted/10',
                        a.status === 'resolved' && 'border-l-4 border-l-risk-low bg-muted/15'
                      )}
                    >
                      <CardContent className="p-4 space-y-3.5">
                        {/* 1. Alert Header and Telemetry Description */}
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2.5">
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-semibold text-foreground/80">
                                {a.id}
                              </span>
                              <AlertBadge severity={a.severity} status={a.status} />
                              <span className="text-xs text-muted-foreground">·</span>
                              <span className="text-xs font-medium text-muted-foreground">
                                Source: {a.source}
                              </span>
                            </div>
                            <h4 className="text-sm font-semibold text-foreground leading-snug">
                              {a.title}
                            </h4>
                            <p className="text-xs leading-relaxed text-muted-foreground">
                              {a.description}
                            </p>
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0 text-right">
                            <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatRelative(a.createdAt)}
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {a.evidence.map((e) => (
                                <EvidenceChip key={e} type={e} />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* 2. CONFIRMATION STATE BANNER (If officer has acted) */}
                        {confirmation && (
                          <div
                            className={cn(
                              'rounded-sm border p-3 text-xs space-y-1',
                              confirmation.newStatus === 'resolved'
                                ? 'border-risk-low/30 bg-risk-low/10'
                                : 'border-primary/30 bg-primary/10'
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CheckCircle2
                                  className={cn(
                                    'h-4 w-4 shrink-0',
                                    confirmation.newStatus === 'resolved'
                                      ? 'text-risk-low'
                                      : 'text-primary'
                                  )}
                                />
                                <span className="font-semibold text-foreground">
                                  Officer Decision Confirmed: {confirmation.actionLabel}
                                </span>
                                <span
                                  className={cn(
                                    'rounded-xs px-1.5 py-0.2 font-mono text-[10px] font-bold uppercase',
                                    confirmation.newStatus === 'resolved'
                                      ? 'bg-risk-low/20 text-risk-low'
                                      : 'bg-primary/20 text-primary'
                                  )}
                                >
                                  Status: {confirmation.newStatus}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleResetAlertAction(a.id)}
                                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground underline"
                              >
                                <RotateCcw className="h-3 w-3" />
                                Reset decision
                              </button>
                            </div>
                            <p className="text-[11px] leading-relaxed text-foreground">
                              {confirmation.message}
                            </p>
                            <div className="pt-1 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                              <span>Executed by: {confirmation.officerRole}</span>
                              <span>Timestamp: {confirmation.timestamp}</span>
                            </div>
                          </div>
                        )}

                        {/* 3. DEDICATED OFFICER ACTION BUTTONS PANEL */}
                        <div className="rounded-sm border border-border/80 bg-muted/20 p-3 space-y-2.5">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                            <div className="flex items-center gap-1.5">
                              <UserCheck className="h-3.5 w-3.5 text-primary" />
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
                                Officer Action (Human Decision Required)
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground italic">
                              Manual Officer Action — AI does not execute automatic enforcement
                            </span>
                          </div>

                          {/* 7 Required Officer Action Buttons */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-1.5">
                            {/* 1. Verify Site Progress */}
                            <Button
                              type="button"
                              variant={confirmation?.actionType === 'verify-progress' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleOfficerAction(a.id, 'verify-progress')}
                              className="h-8 gap-1 px-2 text-[11px] font-medium justify-start sm:justify-center"
                              title="Assign field progress verification to regional oversight engineer"
                            >
                              <SearchCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
                              <span className="truncate">Verify Site Progress</span>
                            </Button>

                            {/* 2. Request Updated Report */}
                            <Button
                              type="button"
                              variant={confirmation?.actionType === 'request-report' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleOfficerAction(a.id, 'request-report')}
                              className="h-8 gap-1 px-2 text-[11px] font-medium justify-start sm:justify-center"
                              title="Issue formal request for updated contractor physical progress report"
                            >
                              <FileSearch className="h-3.5 w-3.5 shrink-0 text-primary" />
                              <span className="truncate">Request Updated Report</span>
                            </Button>

                            {/* 3. Request Milestone Update */}
                            <Button
                              type="button"
                              variant={confirmation?.actionType === 'request-milestone' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleOfficerAction(a.id, 'request-milestone')}
                              className="h-8 gap-1 px-2 text-[11px] font-medium justify-start sm:justify-center"
                              title="Request critical path recovery plan from executing agency"
                            >
                              <CalendarPlus className="h-3.5 w-3.5 shrink-0 text-primary" />
                              <span className="truncate">Request Milestone Update</span>
                            </Button>

                            {/* 4. Schedule Inspection */}
                            <Button
                              type="button"
                              variant={confirmation?.actionType === 'schedule-inspection' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleOfficerAction(a.id, 'schedule-inspection')}
                              className="h-8 gap-1 px-2 text-[11px] font-medium justify-start sm:justify-center"
                              title="Schedule on-site multi-agency physical inspection"
                            >
                              <Calendar className="h-3.5 w-3.5 shrink-0 text-primary" />
                              <span className="truncate">Schedule Inspection</span>
                            </Button>

                            {/* 5. Escalate to Agency */}
                            <Button
                              type="button"
                              variant={confirmation?.actionType === 'escalate' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleOfficerAction(a.id, 'escalate')}
                              className="h-8 gap-1 px-2 text-[11px] font-medium justify-start sm:justify-center"
                              title="Escalate supervisory dossier to line ministry & agency director"
                            >
                              <Send className="h-3.5 w-3.5 shrink-0 text-risk-high" />
                              <span className="truncate">Escalate to Agency</span>
                            </Button>

                            {/* 6. Mark False Positive */}
                            <Button
                              type="button"
                              variant={confirmation?.actionType === 'false-positive' ? 'secondary' : 'outline'}
                              size="sm"
                              onClick={() => handleOfficerAction(a.id, 'false-positive')}
                              className="h-8 gap-1 px-2 text-[11px] font-medium justify-start sm:justify-center text-muted-foreground hover:text-foreground"
                              title="Flag as false positive / sensor calibration artifact"
                            >
                              <XCircle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              <span className="truncate">Mark False Positive</span>
                            </Button>

                            {/* 7. Resolve */}
                            <Button
                              type="button"
                              variant={confirmation?.actionType === 'resolve' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleOfficerAction(a.id, 'resolve')}
                              className={cn(
                                'h-8 gap-1 px-2 text-[11px] font-medium justify-start sm:justify-center',
                                confirmation?.actionType === 'resolve'
                                  ? 'bg-risk-low text-white hover:bg-risk-low/90'
                                  : 'border-risk-low/40 text-risk-low hover:bg-risk-low/10'
                              )}
                              title="Mark alert as resolved following verified mitigation"
                            >
                              <Check className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">Resolve</span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Protocol notice footer */}
            <div className="rounded-md border border-border bg-card p-4">
              <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">
                    Statutory Human-in-the-Loop Protocol:
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    InfraSight telemetry models identify mathematical divergences between reported contractor claims and observational optical/SAR satellite passes. All supervisory responses, contractor notices, milestone revisions, and contractual enforcement decisions remain under the exclusive jurisdiction and discretion of the authorized reviewing officer.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
