import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { RiskBadge } from '@/components/risk-badge';
import { EvidenceChip } from '@/components/evidence-chip';
import { AlertBadge } from '@/components/alert-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { getProjectById, getAlertsForProject } from '@/lib/mock-data';
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

export default function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const project = getProjectById(params.id);
  if (!project) notFound();
  const projectAlerts = getAlertsForProject(project.id);
  const budgetUtilization = Math.round((project.spentCrore / project.budgetCrore) * 100);

  const facts = [
    { icon: MapPin, label: 'Location', value: `${project.district}, ${project.state}` },
    { icon: Building2, label: 'Ministry', value: project.ministry },
    { icon: Wallet, label: 'Sector', value: project.sector },
    { icon: HardHat, label: 'Contractor', value: project.contractor },
    { icon: Calendar, label: 'Start date', value: formatDate(project.startDate) },
    { icon: Calendar, label: 'Target end', value: formatDate(project.targetEndDate) },
  ];

  return (
    <div className="flex flex-col">
      <PageHeader
        title={project.name}
        description={`${project.code} · ${project.ministry}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Projects', href: '/projects' },
          { label: project.code },
        ]}
        actions={
          <>
            <Link href="/projects">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>
            </Link>
            <Button size="sm">Generate report</Button>
          </>
        }
      />

      <div className="space-y-5 p-6">
        {/* Risk + status summary bar */}
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Risk
              </span>
              <RiskBadge band={project.riskBand} score={project.riskScore} />
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Status
              </span>
              <span className="text-sm font-semibold capitalize text-foreground">
                {project.status.replace('-', ' ')}
              </span>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Last updated
              </span>
              <span className="flex items-center gap-1 text-sm text-foreground">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                {formatRelative(project.lastUpdated)}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Evidence
              </span>
              {project.evidence.map((e) => (
                <EvidenceChip key={e} type={e} />
              ))}
            </div>
          </div>
        </Card>

        {/* Progress + budget */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Project progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Physical completion</span>
                  <span className="font-mono font-semibold text-foreground">
                    {project.progressPercent}%
                  </span>
                </div>
                <Progress
                  value={project.progressPercent}
                  className="mt-2 h-2"
                  indicatorClassName={cn(
                    project.riskBand === 'low' && 'bg-risk-low',
                    project.riskBand === 'moderate' && 'bg-risk-moderate',
                    project.riskBand === 'high' && 'bg-risk-high',
                    project.riskBand === 'critical' && 'bg-risk-critical'
                  )}
                />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Budget utilization</span>
                  <span className="font-mono font-semibold text-foreground">
                    {budgetUtilization}%
                  </span>
                </div>
                <Progress value={budgetUtilization} className="mt-2 h-2" indicatorClassName="bg-primary" />
                <p className="mt-1.5 font-mono text-xs text-muted-foreground">
                  ₹{project.spentCrore.toLocaleString('en-IN')} Cr spent of ₹
                  {project.budgetCrore.toLocaleString('en-IN')} Cr sanctioned
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Risk factors
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-2">
              {[
                { label: 'Schedule adherence', value: project.progressPercent < 40 ? 'High risk' : 'Moderate', level: project.progressPercent < 40 ? 'critical' : 'moderate' as const },
                { label: 'Cost overrun exposure', value: budgetUtilization > 60 ? 'Elevated' : 'Within range', level: budgetUtilization > 60 ? 'high' : 'low' as const },
                { label: 'Contractor performance', value: project.status === 'delayed' ? 'Below plan' : 'Adequate', level: project.status === 'delayed' ? 'high' : 'low' as const },
                { label: 'Environmental exposure', value: 'Monsoon season', level: 'moderate' as const },
              ].map((f) => (
                <div key={f.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{f.label}</span>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      f.level === 'low' && 'text-risk-low',
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

        {/* Project facts grid */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Project details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                {facts.map((f) => {
                  const Icon = f.icon;
                  return (
                    <div key={f.label} className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          {f.label}
                        </dt>
                        <dd className="mt-0.5 text-sm text-foreground">{f.value}</dd>
                      </div>
                    </div>
                  );
                })}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <FileText className="h-4 w-4" />
                Evidence trail
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-2">
              {project.evidence.map((e) => (
                <div key={e} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <EvidenceChip type={e} />
                  <span className="text-[11px] text-muted-foreground">Available</span>
                </div>
              ))}
              <p className="mt-2 text-[11px] text-muted-foreground">
                Evidence sources are aggregated from field reports, sensor
                observations, predictive models, and AI interpretation.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts for this project */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Alerts for this project ({projectAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-3 pb-3 pt-0">
            {projectAlerts.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No active alerts for this project.
              </p>
            ) : (
              projectAlerts.map((a) => (
                <div
                  key={a.id}
                  className="rounded-md border border-border px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-muted-foreground">{a.id}</span>
                        <AlertBadge severity={a.severity} status={a.status} />
                      </div>
                      <p className="mt-1.5 text-sm font-medium text-foreground">{a.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {a.description}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        {a.evidence.map((e) => (
                          <EvidenceChip key={e} type={e} />
                        ))}
                        <span className="text-[11px] text-muted-foreground">· {a.source}</span>
                      </div>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatRelative(a.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
