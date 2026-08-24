'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { AlertBadge } from '@/components/alert-badge';
import { EvidenceChip } from '@/components/evidence-chip';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { alerts } from '@/lib/mock-data';
import type { AlertSeverity, AlertStatus } from '@/lib/types';
import { Clock, Search } from 'lucide-react';

function formatRelative(iso: string): string {
  const now = new Date('2026-08-24T08:00:00Z').getTime();
  const then = new Date(iso).getTime();
  const mins = Math.round((now - then) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  critical: 0,
  high: 1,
  moderate: 2,
  low: 3,
};

export default function AlertsPage() {
  const [query, setQuery] = React.useState('');
  const [severity, setSeverity] = React.useState('all');
  const [status, setStatus] = React.useState('all');

  const filtered = React.useMemo(() => {
    return alerts
      .filter((a) => {
        const matchesQuery =
          !query ||
          a.title.toLowerCase().includes(query.toLowerCase()) ||
          a.projectName.toLowerCase().includes(query.toLowerCase()) ||
          a.id.toLowerCase().includes(query.toLowerCase());
        const matchesSeverity = severity === 'all' || a.severity === severity;
        const matchesStatus = status === 'all' || a.status === status;
        return matchesQuery && matchesSeverity && matchesStatus;
      })
      .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  }, [query, severity, status]);

  const counts = {
    active: alerts.filter((a) => a.status === 'active').length,
    acknowledged: alerts.filter((a) => a.status === 'acknowledged').length,
    resolved: alerts.filter((a) => a.status === 'resolved').length,
  };

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Alerts"
        description="Predictive and observed risk alerts across monitored projects"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Alerts' }]}
      />
      <div className="space-y-4 p-6">
        {/* Status summary */}
        <div className="grid grid-cols-3 gap-4">
          {([
            { label: 'Active', value: counts.active, cls: 'text-risk-critical' },
            { label: 'Acknowledged', value: counts.acknowledged, cls: 'text-risk-moderate' },
            { label: 'Resolved', value: counts.resolved, cls: 'text-risk-low' },
          ] as const).map((s) => (
            <Card key={s.label} className="p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {s.label}
              </p>
              <p className={cn('mt-2 font-mono text-2xl font-semibold', s.cls)}>
                {s.value}
              </p>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-xs flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title, project, ID..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 bg-card pl-9"
            />
          </div>
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger className="h-9 w-44 bg-card">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 w-44 bg-card">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="acknowledged">Acknowledged</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <span className="ml-auto text-xs text-muted-foreground">
            {filtered.length} alerts
          </span>
        </div>

        {/* Alert list */}
        <div className="space-y-2">
          {filtered.map((a) => (
            <Card key={a.id} className="px-4 py-3.5 transition-colors hover:bg-muted/30">
              <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-muted-foreground">{a.id}</span>
                    <AlertBadge severity={a.severity} status={a.status} />
                  </div>
                  <Link
                    href={`/projects/${a.projectId}`}
                    className="mt-1.5 block text-sm font-medium text-foreground hover:underline"
                  >
                    {a.title}
                  </Link>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {a.description}
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    {a.evidence.map((e) => (
                      <EvidenceChip key={e} type={e} />
                    ))}
                    <span className="text-[11px] text-muted-foreground">· {a.source}</span>
                    <span className="text-[11px] text-muted-foreground">· {a.projectName}</span>
                  </div>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatRelative(a.createdAt)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
