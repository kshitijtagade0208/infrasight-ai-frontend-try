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
import type { RiskBand, EvidenceType, KpiStat, Project, ProjectStatus } from '@/lib/types';
import { riskBandFromScore } from '@/lib/risk';
import { projects as fallbackProjects } from '@/lib/mock-data';
import { API_BASE_URL } from '@/lib/api-config';
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

function formatRelative(iso: string): string {
    const now = new Date('2026-08-24T08:00:00Z').getTime();
    const then = new Date(iso).getTime();
    const mins = Math.round((now - then) / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

function mapBackendProject(p: any): Project {
    if (p.budgetCrore !== undefined) {
        return p as Project;
    }

    const riskScore = p.risk_score !== undefined ? Number(p.risk_score) : 20;
    const riskBand = riskBandFromScore(riskScore);

    let district = 'Mumbai';
    let state = 'Maharashtra';
    if (p.location && typeof p.location === 'string') {
        const parts = p.location.split(',');
        district = parts[0]?.trim() || district;
        state = parts[1]?.trim() || state;
    }

    let frontendStatus: ProjectStatus = 'on-track';
    const rawStatus = String(p.status || '').toLowerCase();
    if (rawStatus === 'completed') {
        frontendStatus = 'completed';
    } else if (rawStatus === 'critical' || riskScore >= 76) {
        frontendStatus = 'critical';
    } else if (rawStatus === 'delayed' || riskScore >= 56) {
        frontendStatus = 'delayed';
    } else if (rawStatus === 'at-risk' || riskScore >= 31) {
        frontendStatus = 'at-risk';
    }

    const budgetRaw = p.budget !== undefined ? Number(p.budget) : 100000000;
    const spentRaw = p.spent !== undefined ? Number(p.spent) : 50000000;

    const budgetCrore = budgetRaw > 100000 ? budgetRaw / 10000000 : budgetRaw;
    const spentCrore = spentRaw > 100000 ? spentRaw / 10000000 : spentRaw;

    return {
        id: p.id ? String(p.id) : `PRJ-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        name: p.name || 'Unnamed Project',
        code: p.code || (p.name ? p.name.split(' ').map((w: string) => w[0]).join('').toUpperCase() : 'PRJ'),
        ministry: p.ministry || 'Ministry of Infrastructure',
        agency: p.agency || 'NHAI',
        state,
        district,
        sector: p.sector || 'Infrastructure',
        status: frontendStatus,
        riskScore,
        riskBand,
        budgetCrore,
        spentCrore,
        progressPercent: p.progress !== undefined ? Number(p.progress) : 0,
        visualProgressEstimate: p.visual_progress_estimate !== undefined ? Number(p.visual_progress_estimate) : (p.progress !== undefined ? Number(p.progress) : 0),
        cctvAvailable: p.cctv_available !== undefined ? Boolean(p.cctv_available) : true,
        startDate: p.start_date || '2023-01-01',
        targetEndDate: p.target_end_date || '2026-12-31',
        contractor: p.contractor || 'TBD',
        evidence: Array.isArray(p.evidence) ? p.evidence : ['observed', 'verified'],
        lastUpdated: p.last_updated || p.created_at || new Date().toISOString(),
    };
}

export default function DashboardPage() {
    const [projectsList, setProjectsList] = React.useState<Project[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    const [openAlertsCount, setOpenAlertsCount] = React.useState<number>(0);
    const [alertsList, setAlertsList] = React.useState<any[]>([]);

    React.useEffect(() => {
        let active = true;
        async function fetchData() {
            try {
                const res = await fetch(`${API_BASE_URL}/projects`);
                if (!res.ok) {
                    throw new Error(`Failed to fetch: ${res.statusText}`);
                }
                const data = await res.json();
                if (active) {
                    if (Array.isArray(data) && data.length > 0) {
                        setProjectsList(data.map(mapBackendProject));
                    } else {
                        setProjectsList(fallbackProjects);
                    }
                    setError(null);
                }
            } catch (err: any) {
                console.error('Error fetching projects:', err);
                if (active) {
                    setError(err.message || 'Failed to fetch projects');
                    setProjectsList(fallbackProjects);
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        async function fetchAlerts() {
            try {
                const res = await fetch(`${API_BASE_URL}/alerts`);
                if (!res.ok) return;
                const data = await res.json();
                if (active && Array.isArray(data)) {
                    setAlertsList(data);
                    const count = data.filter((a: any) => {
                        const st = String(a.status || 'active').toLowerCase();
                        return st === 'open' || st === 'active' || (st !== 'resolved' && st !== 'acknowledged');
                    }).length;
                    setOpenAlertsCount(count);
                }
            } catch (err) {
                console.error('Error fetching alerts:', err);
            }
        }

        fetchData();
        fetchAlerts();
        return () => {
            active = false;
        };
    }, []);

    const totalProjectsCount = projectsList.length;

    const lowCount = projectsList.filter((p) => p.riskBand === 'low').length;
    const moderateCount = projectsList.filter((p) => p.riskBand === 'moderate').length;
    const highCount = projectsList.filter((p) => p.riskBand === 'high').length;
    const criticalCount = projectsList.filter((p) => p.riskBand === 'critical').length;

    const totalCalculated = totalProjectsCount || 1;

    const riskBandBreakdown = [
        {
            band: 'low' as RiskBand,
            label: 'Low',
            count: lowCount,
            pct: Math.round((lowCount / totalCalculated) * 100),
            range: '0–30',
            color: '#2E7D5B',
            description: 'Normal operations; parameters within allowable tolerances',
        },
        {
            band: 'moderate' as RiskBand,
            label: 'Moderate',
            count: moderateCount,
            pct: Math.round((moderateCount / totalCalculated) * 100),
            range: '31–55',
            color: '#C9962C',
            description: 'Minor variance detected; schedule or material buffer monitoring',
        },
        {
            band: 'high' as RiskBand,
            label: 'High',
            count: highCount,
            pct: Math.round((highCount / totalCalculated) * 100),
            range: '56–75',
            color: '#C7591E',
            description: 'Significant delay risk or visual activity shortfall flagged',
        },
        {
            band: 'critical' as RiskBand,
            label: 'Critical',
            count: criticalCount,
            pct: Math.round((criticalCount / totalCalculated) * 100),
            range: '76–100',
            color: '#B23A3A',
            description: 'Severe schedule stall, breach hazard, or critical variance',
        },
    ];

    const attentionProjects = React.useMemo(() => {
        return projectsList
            .filter((p) => p.riskBand === 'critical' || p.riskBand === 'high')
            .map((p) => {
                const reportedProgress = p.progressPercent;
                const visualEstimate = p.visualProgressEstimate !== undefined ? p.visualProgressEstimate : p.progressPercent;
                const variance = visualEstimate - reportedProgress;
                return {
                    id: p.id,
                    code: p.code,
                    name: p.name,
                    state: p.state,
                    district: p.district,
                    sector: p.sector,
                    riskBand: p.riskBand,
                    riskScore: p.riskScore,
                    reportedProgress,
                    visualEstimate,
                    variance,
                    evidence: p.evidence,
                };
            });
    }, [projectsList]);

    const regionalRiskSummary = React.useMemo(() => {
        const regions = [
            { region: 'North-East', statesList: ['Assam', 'Sikkim'], states: 'Assam, Sikkim' },
            { region: 'Central', statesList: ['Madhya Pradesh'], states: 'Madhya Pradesh' },
            { region: 'East', statesList: ['West Bengal', 'Bihar'], states: 'West Bengal, Bihar' },
            { region: 'West', statesList: ['Maharashtra', 'Gujarat'], states: 'Maharashtra, Gujarat' },
            { region: 'South', statesList: ['Karnataka', 'Tamil Nadu', 'Andhra Pradesh'], states: 'Karnataka, Tamil Nadu, AP' },
            { region: 'North', statesList: ['Uttar Pradesh', 'Rajasthan'], states: 'Uttar Pradesh, Rajasthan' },
        ];
        return regions.map((r) => {
            const regProjects = projectsList.filter((p) => r.statesList.includes(p.state));
            const count = regProjects.length;
            const avgRisk = count > 0 ? Math.round(regProjects.reduce((sum, p) => sum + p.riskScore, 0) / count) : 0;
            return {
                region: r.region,
                states: r.states,
                avgRisk,
                band: riskBandFromScore(avgRisk),
                projects: count,
            };
        });
    }, [projectsList]);

    const budgetAtRiskValue = React.useMemo(() => {
        const atRisk = projectsList.filter(
            (p) => p.riskBand === 'critical' || p.riskBand === 'high'
        );
        return atRisk.reduce((sum, p) => sum + p.budgetCrore, 0);
    }, [projectsList]);

    const budgetAtRiskFormatted = React.useMemo(() => {
        if (budgetAtRiskValue >= 100000) {
            return `₹${(budgetAtRiskValue / 100000).toFixed(2)}L Cr`;
        }
        return `₹${budgetAtRiskValue.toLocaleString()} Cr`;
    }, [budgetAtRiskValue]);

    const currentAvgRisk = React.useMemo(() => {
        if (projectsList.length === 0) return 54.8;
        const sum = projectsList.reduce((acc, p) => acc + (p.riskScore || 0), 0);
        return Number((sum / projectsList.length).toFixed(1));
    }, [projectsList]);

    const thirtyDayTrendData = React.useMemo(() => {
        const base = [...THIRTY_DAY_TREND];
        if (base.length > 0) {
            base[base.length - 1] = {
                ...base[base.length - 1],
                avgRisk: currentAvgRisk,
                criticalCount,
                highCount,
            };
        }
        return base;
    }, [currentAvgRisk, criticalCount, highCount]);

    const earlyWarnings: EarlyWarningItem[] = React.useMemo(() => {
        if (alertsList.length > 0) {
            return alertsList.map((a: any) => ({
                id: a.id ? String(a.id) : 'EW-001',
                title: a.title || 'Alert Signal',
                severity: (a.severity && ['low', 'moderate', 'high', 'critical'].includes(String(a.severity).toLowerCase())
                    ? (String(a.severity).toLowerCase() as RiskBand)
                    : 'high'),
                projectName: a.projectName || a.project_name || 'Infrastructure Project',
                projectId: a.projectId || a.project_id || '',
                detail: a.description || a.detail || '',
                detectedAt: a.createdAt || a.created_at || a.detectedAt || new Date().toISOString(),
                evidence: Array.isArray(a.evidence) ? a.evidence : ['reported', 'observed'],
            }));
        }
        return EARLY_WARNINGS;
    }, [alertsList]);

    const uniqueStatesCount = React.useMemo(() => {
        const states = new Set(projectsList.map((p) => p.state).filter(Boolean));
        return states.size || 10;
    }, [projectsList]);

    const kpiCards: KpiStat[] = React.useMemo(() => {
        return [
            {
                id: 'kpi-projects',
                label: 'Active Projects Monitored',
                value: String(totalProjectsCount),
                delta: '+6',
                trend: 'up',
                hint: 'vs last quarter',
            },
            {
                id: 'kpi-critical',
                label: 'Critical Risk Projects',
                value: String(criticalCount),
                delta: '+3',
                trend: 'up',
                hint: 'requires immediate attention',
            },
            {
                id: 'kpi-alerts',
                label: 'Open Alerts',
                value: String(openAlertsCount),
                delta: '-12',
                trend: 'down',
                hint: 'resolved in last 24h',
            },
            {
                id: 'kpi-budget',
                label: 'Budget at Risk',
                value: budgetAtRiskFormatted,
                delta: '+8.4%',
                trend: 'up',
                hint: 'exposure across delayed projects',
            },
        ];
    }, [totalProjectsCount, criticalCount, openAlertsCount, budgetAtRiskFormatted]);

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
                {loading && (
                    <div className="flex items-center justify-center p-8 bg-card border border-border rounded-md shadow-xs animate-pulse">
                        <div className="flex items-center gap-3">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            <span className="text-sm font-medium text-muted-foreground">Synchronizing live operations telemetry...</span>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
                        <div className="flex flex-col gap-1">
                            <span className="font-semibold">Backend offline or connection failed</span>
                            <p className="text-muted-foreground leading-relaxed">
                                Could not connect to FastAPI endpoint. Displaying cached national infrastructure database telemetry ({error}).
                            </p>
                        </div>
                    </div>
                )}
                {/* 2. KPI ROW */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {kpiCards.map((stat) => (
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
                                    {totalProjectsCount} Monitored Projects
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Stacked Distribution Bar */}
                            <div>
                                <div className="flex h-4 w-full overflow-hidden rounded-sm border border-border bg-muted/30">
                                    {riskBandBreakdown.map((b) => (
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
                                {riskBandBreakdown.map((b) => (
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
                                        data={thirtyDayTrendData}
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
                                        {currentAvgRisk}{' '}
                                        <span className="text-xs font-normal text-muted-foreground">
                                            ({currentAvgRisk >= 56 ? 'High' : currentAvgRisk >= 31 ? 'Moderate' : 'Low'})
                                        </span>
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
                                    {attentionProjects.map((p) => {
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
                            {earlyWarnings.map((warning) => (
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
                                    India GIS Layer — {totalProjectsCount} Project Coordinates
                                </p>
                                <p className="mt-0.5 max-w-xs text-[11px] text-muted-foreground">
                                    Multi-spectral satellite passes & ground sensor telemetry mapped across {uniqueStatesCount} active states.
                                </p>
                            </div>

                            {/* Regional Risk Index Table */}
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Regional Risk Index
                                </p>
                                <div className="divide-y divide-border rounded-sm border border-border bg-card">
                                    {regionalRiskSummary.map((reg) => (
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
