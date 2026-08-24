'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { DataTable, type Column } from '@/components/data-table';
import { RiskBadge } from '@/components/risk-badge';
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
import { projects } from '@/lib/mock-data';
import type { Project, ProjectStatus, RiskBand } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';

const STATUS_LABEL: Record<ProjectStatus, string> = {
  'on-track': 'On Track',
  'at-risk': 'At Risk',
  delayed: 'Delayed',
  critical: 'Critical',
  completed: 'Completed',
};

const STATUS_CLASS: Record<ProjectStatus, string> = {
  'on-track': 'text-risk-low',
  'at-risk': 'text-risk-moderate',
  delayed: 'text-risk-high',
  critical: 'text-risk-critical',
  completed: 'text-muted-foreground',
};

export default function ProjectsPage() {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [status, setStatus] = React.useState<string>('all');
  const [band, setBand] = React.useState<string>('all');

  const filtered = React.useMemo(() => {
    return projects.filter((p) => {
      const matchesQuery =
        !query ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.code.toLowerCase().includes(query.toLowerCase()) ||
        p.state.toLowerCase().includes(query.toLowerCase()) ||
        p.contractor.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = status === 'all' || p.status === status;
      const matchesBand = band === 'all' || p.riskBand === band;
      return matchesQuery && matchesStatus && matchesBand;
    });
  }, [query, status, band]);

  const columns: Column<Project>[] = [
    {
      key: 'name',
      header: 'Project',
      render: (p) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{p.name}</span>
          <span className="font-mono text-[11px] text-muted-foreground">{p.code}</span>
        </div>
      ),
    },
    {
      key: 'state',
      header: 'Location',
      render: (p) => (
        <div className="flex flex-col">
          <span className="text-foreground">{p.state}</span>
          <span className="text-[11px] text-muted-foreground">{p.district}</span>
        </div>
      ),
    },
    {
      key: 'sector',
      header: 'Sector',
      render: (p) => <span className="text-muted-foreground">{p.sector}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => (
        <span className={cn('text-xs font-medium capitalize', STATUS_CLASS[p.status])}>
          {STATUS_LABEL[p.status]}
        </span>
      ),
    },
    {
      key: 'progress',
      header: 'Progress',
      align: 'center',
      render: (p) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full rounded-full',
                p.riskBand === 'low' && 'bg-risk-low',
                p.riskBand === 'moderate' && 'bg-risk-moderate',
                p.riskBand === 'high' && 'bg-risk-high',
                p.riskBand === 'critical' && 'bg-risk-critical'
              )}
              style={{ width: `${p.progressPercent}%` }}
            />
          </div>
          <span className="font-mono text-[11px] text-muted-foreground">
            {p.progressPercent}%
          </span>
        </div>
      ),
    },
    {
      key: 'evidence',
      header: 'Evidence',
      render: (p) => (
        <div className="flex flex-wrap gap-1">
          {p.evidence.map((e) => (
            <EvidenceChip key={e} type={e} />
          ))}
        </div>
      ),
    },
    {
      key: 'risk',
      header: 'Risk',
      align: 'right',
      render: (p) => <RiskBadge band={p.riskBand} score={p.riskScore} />,
    },
  ];

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Projects"
        description={`${projects.length} projects under active monitoring across 10 states`}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Projects' }]}
      />
      <div className="space-y-4 p-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-xs flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, code, state, contractor..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 bg-card pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 w-44 bg-card">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="on-track">On Track</SelectItem>
              <SelectItem value="at-risk">At Risk</SelectItem>
              <SelectItem value="delayed">Delayed</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={band} onValueChange={setBand}>
            <SelectTrigger className="h-9 w-44 bg-card">
              <SelectValue placeholder="Risk band" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All risk bands</SelectItem>
              <SelectItem value="low">Low (0–30)</SelectItem>
              <SelectItem value="moderate">Moderate (31–55)</SelectItem>
              <SelectItem value="high">High (56–75)</SelectItem>
              <SelectItem value="critical">Critical (76–100)</SelectItem>
            </SelectContent>
          </Select>
          <span className="ml-auto text-xs text-muted-foreground">
            Showing {filtered.length} of {projects.length}
          </span>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(row) => router.push(`/projects/${row.id}`)}
        />
      </div>
    </div>
  );
}
