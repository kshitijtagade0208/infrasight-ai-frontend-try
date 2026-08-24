import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { RiskBadge } from '@/components/risk-badge';
import { EvidenceChip } from '@/components/evidence-chip';
import { IndiaMapPlaceholder } from '@/components/india-map-placeholder';
import { RiskTrendChart } from '@/components/charts/risk-trend-chart';
import { RiskDistributionChart } from '@/components/charts/risk-distribution-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  kpiStats,
  riskTrend,
  stateRiskData,
  projects,
  earlyWarnings,
  alerts,
} from '@/lib/mock-data';
import { RISK_BANDS, RISK_BAND_BG } from '@/lib/risk';
import { ArrowRight, AlertTriangle, Clock, TrendingUp } from 'lucide-react';

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
  const attentionProjects = [...projects]
    .filter((p) => p.status !== 'completed')
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5);

  const bandCounts = RISK_BANDS.map((b) => ({
    ...b,
    count: projects.filter((p) => p.riskBand === b.band).length,
  }));

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Operations Dashboard"
        description="National infrastructure risk overview — updated 24 Aug 2026, 08:00 IST"
        breadcrumbs={[{ label: 'Dashboard' }]}
        actions={
          <>
            <Button variant="outline" size="sm">
              Export
            </Button>
            <Button size="sm">View full report</Button>
          </>
        }
      />

      <div className="space-y-5 p-6">
        {/* KPI cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpiStats.map((stat) => (
            <StatCard key={stat.id} stat={stat} />
          ))}
        </div>

        {/* Risk distribution + India map */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Risk distribution by state
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RiskDistributionChart data={stateRiskData} />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Regional risk map — India
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[280px]">
              <IndiaMapPlaceholder states={stateRiskData} className="h-full" />
            </CardContent>
          </Card>
        </div>

        {/* Risk trend + risk band summary */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Risk trend — last 6 months
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RiskTrendChart data={riskTrend} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Risk band summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              {bandCounts.map((b) => {
                const total = projects.length;
                const pct = Math.round((b.count / total) * 100);
                return (
                  <div key={b.band}>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={cn('h-2.5 w-2.5 rounded-sm', RISK_BAND_BG[b.band])} />
                        <span className="font-medium text-foreground">{b.label}</span>
                        <span className="text-xs text-muted-foreground">
                          ({b.min}–{b.max})
                        </span>
                      </div>
                      <span className="font-mono text-sm text-foreground">
                        {b.count}
                        <span className="ml-1 text-xs text-muted-foreground">({pct}%)</span>
                      </span>
                    </div>
                    <Progress
                      value={pct}
                      className="mt-1.5 h-1.5"
                      indicatorClassName={cn(
                        b.band === 'low' && 'bg-risk-low',
                        b.band === 'moderate' && 'bg-risk-moderate',
                        b.band === 'high' && 'bg-risk-high',
                        b.band === 'critical' && 'bg-risk-critical'
                      )}
                    />
                  </div>
                );
              })}
              <div className="mt-4 rounded-md bg-muted/50 px-3 py-2.5">
                <p className="text-[11px] text-muted-foreground">
                  Prototype thresholds — not official government standards.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects requiring attention + Early warnings */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Projects requiring attention */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Projects requiring attention
              </CardTitle>
              <Link href="/projects">
                <Button variant="ghost" size="sm" className="gap-1 text-xs text-primary">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2 px-3 pb-3 pt-0">
              {attentionProjects.map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="flex items-center gap-3 rounded-md border border-transparent px-3 py-2.5 transition-colors hover:border-border hover:bg-muted/40"
                >
                  <div className="flex w-8 shrink-0 justify-center">
                    <AlertTriangle
                      className={cn(
                        'h-4 w-4',
                        p.riskBand === 'critical' || p.riskBand === 'high'
                          ? 'text-risk-high'
                          : 'text-risk-moderate'
                      )}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        {p.name}
                      </span>
                      <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                        {p.code}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {p.state} · {p.sector} · {p.contractor}
                    </p>
                  </div>
                  <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
                    {p.evidence.slice(0, 2).map((e) => (
                      <EvidenceChip key={e} type={e} />
                    ))}
                  </div>
                  <div className="shrink-0 text-right">
                    <RiskBadge band={p.riskBand} score={p.riskScore} />
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                      {p.progressPercent}% done
                    </p>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Early warnings */}
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Early warnings
              </CardTitle>
              <Link href="/alerts">
                <Button variant="ghost" size="sm" className="gap-1 text-xs text-primary">
                  All <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2 px-3 pb-3 pt-0">
              {earlyWarnings.map((w) => (
                <div
                  key={w.id}
                  className="rounded-md border border-border bg-card px-3 py-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-foreground">{w.signal}</p>
                    <RiskBadge band={w.band} showDot={false} />
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    {w.detail}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {w.evidence.map((e) => (
                        <EvidenceChip key={e} type={e} />
                      ))}
                    </div>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatRelative(w.detectedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent alerts strip */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Recent alerts
            </CardTitle>
            <Link href="/alerts">
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-primary">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="px-3 pb-3 pt-0">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
              {alerts.slice(0, 6).map((a) => (
                <Link
                  key={a.id}
                  href={`/projects/${a.projectId}`}
                  className="flex flex-col gap-2 rounded-md border border-border px-3 py-2.5 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground">{a.id}</span>
                    <RiskBadge band={a.severity} showDot={false} />
                  </div>
                  <p className="text-xs font-medium leading-snug text-foreground">{a.title}</p>
                  <div className="flex items-center justify-between">
                    <span className="truncate text-[11px] text-muted-foreground">{a.projectName}</span>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatRelative(a.createdAt)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
