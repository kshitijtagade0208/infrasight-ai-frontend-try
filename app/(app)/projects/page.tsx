'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { RiskBadge } from '@/components/risk-badge';
import { EvidenceChip } from '@/components/evidence-chip';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { projects as fallbackProjects } from '@/lib/mock-data';
import { API_BASE_URL } from '@/lib/api-config';
import { riskBandFromScore } from '@/lib/risk';
import type { Project, ProjectStatus, RiskBand } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Search,
  X,
  SlidersHorizontal,
  RotateCcw,
  Video,
  VideoOff,
  ChevronRight,
  Info,
  Layers,
  MapPin,
  Clock,
} from 'lucide-react';

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  'on-track': {
    label: 'On Track',
    bg: 'bg-risk-low/10',
    text: 'text-risk-low',
    border: 'border-risk-low/30',
  },
  'at-risk': {
    label: 'At Risk',
    bg: 'bg-risk-moderate/10',
    text: 'text-risk-moderate',
    border: 'border-risk-moderate/30',
  },
  delayed: {
    label: 'Delayed',
    bg: 'bg-risk-high/10',
    text: 'text-risk-high',
    border: 'border-risk-high/30',
  },
  critical: {
    label: 'Critical',
    bg: 'bg-risk-critical/10',
    text: 'text-risk-critical',
    border: 'border-risk-critical/30',
  },
  completed: {
    label: 'Completed',
    bg: 'bg-muted/80',
    text: 'text-muted-foreground',
    border: 'border-border',
  },
};

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

export default function ProjectsPage() {
  const router = useRouter();

  const [projectsList, setProjectsList] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

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
    fetchData();
    return () => {
      active = false;
    };
  }, []);

  // Search & Filter State
  const [query, setQuery] = React.useState('');
  const [riskFilter, setRiskFilter] = React.useState<string>('all');
  const [stateFilter, setStateFilter] = React.useState<string>('all');
  const [sectorFilter, setSectorFilter] = React.useState<string>('all');
  const [ministryFilter, setMinistryFilter] = React.useState<string>('all');
  const [agencyFilter, setAgencyFilter] = React.useState<string>('all');
  const [cctvFilter, setCctvFilter] = React.useState<string>('all');

  // Dynamic filter option lists derived from dataset
  const uniqueStates = React.useMemo(() => {
    return Array.from(new Set(projectsList.map((p) => p.state))).sort();
  }, [projectsList]);

  const uniqueSectors = React.useMemo(() => {
    return Array.from(new Set(projectsList.map((p) => p.sector))).sort();
  }, [projectsList]);

  const uniqueMinistries = React.useMemo(() => {
    return Array.from(new Set(projectsList.map((p) => p.ministry))).sort();
  }, [projectsList]);

  const uniqueAgencies = React.useMemo(() => {
    return Array.from(
      new Set(projectsList.map((p) => p.agency).filter(Boolean) as string[])
    ).sort();
  }, [projectsList]);

  // Quick category counts
  const categoryCounts = React.useMemo(() => {
    return {
      all: projectsList.length,
      critical: projectsList.filter((p) => p.riskBand === 'critical').length,
      high: projectsList.filter((p) => p.riskBand === 'high').length,
      moderate: projectsList.filter((p) => p.riskBand === 'moderate').length,
      low: projectsList.filter((p) => p.riskBand === 'low').length,
      cctvActive: projectsList.filter((p) => p.cctvAvailable === true).length,
    };
  }, [projectsList]);

  // Check if any filter is active
  const isFiltered =
    query.trim() !== '' ||
    riskFilter !== 'all' ||
    stateFilter !== 'all' ||
    sectorFilter !== 'all' ||
    ministryFilter !== 'all' ||
    agencyFilter !== 'all' ||
    cctvFilter !== 'all';

  const handleResetFilters = React.useCallback(() => {
    setQuery('');
    setRiskFilter('all');
    setStateFilter('all');
    setSectorFilter('all');
    setMinistryFilter('all');
    setAgencyFilter('all');
    setCctvFilter('all');
  }, []);

  // Filtered dataset
  const filteredProjects = React.useMemo(() => {
    return projectsList.filter((p) => {
      // 1. Search Query
      if (query.trim()) {
        const q = query.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesId = p.id.toLowerCase().includes(q);
        const matchesCode = p.code.toLowerCase().includes(q);
        const matchesState = p.state.toLowerCase().includes(q);
        const matchesDistrict = p.district.toLowerCase().includes(q);
        const matchesSector = p.sector.toLowerCase().includes(q);
        const matchesAgency = p.agency ? p.agency.toLowerCase().includes(q) : false;
        const matchesContractor = p.contractor.toLowerCase().includes(q);

        if (
          !matchesName &&
          !matchesId &&
          !matchesCode &&
          !matchesState &&
          !matchesDistrict &&
          !matchesSector &&
          !matchesAgency &&
          !matchesContractor
        ) {
          return false;
        }
      }

      // 2. Risk Band Filter
      if (riskFilter !== 'all' && p.riskBand !== riskFilter) {
        return false;
      }

      // 3. State Filter
      if (stateFilter !== 'all' && p.state !== stateFilter) {
        return false;
      }

      // 4. Sector Filter
      if (sectorFilter !== 'all' && p.sector !== sectorFilter) {
        return false;
      }

      // 5. Ministry Filter
      if (ministryFilter !== 'all' && p.ministry !== ministryFilter) {
        return false;
      }

      // 6. Agency Filter
      if (agencyFilter !== 'all' && p.agency !== agencyFilter) {
        return false;
      }

      // 7. CCTV Availability Filter
      if (cctvFilter === 'active' && p.cctvAvailable !== true) {
        return false;
      }
      if (cctvFilter === 'offline' && p.cctvAvailable === true) {
        return false;
      }

      return true;
    });
  }, [
    projectsList,
    query,
    riskFilter,
    stateFilter,
    sectorFilter,
    ministryFilter,
    agencyFilter,
    cctvFilter,
  ]);

  return (
    <div className="flex flex-col">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Projects"
        description="Monitor infrastructure projects and identify emerging risk."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Projects' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-sm border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Telemetry sync: 24 Aug 2026, 08:00 IST</span>
            </div>
          </div>
        }
      />

      <div className="space-y-4 p-6">
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
        {/* 2. SEARCH & COMPACT FILTERS SECTION */}
        <div className="rounded-md border border-border bg-card p-4 shadow-2xs">
          {/* Main search and quick risk summary strip */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Field */}
            <div className="relative w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by project name, project ID, state, or sector..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-9.5 w-full bg-background pl-9 pr-8 text-xs sm:text-sm"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Quick Filter Status Chips */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mr-1 hidden sm:inline">
                Risk Quick Filter:
              </span>
              <button
                type="button"
                onClick={() => setRiskFilter('all')}
                className={cn(
                  'rounded-sm border px-2.5 py-1 font-medium transition-colors',
                  riskFilter === 'all'
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted/40'
                )}
              >
                All ({categoryCounts.all})
              </button>
              <button
                type="button"
                onClick={() => setRiskFilter('critical')}
                className={cn(
                  'rounded-sm border px-2.5 py-1 font-medium transition-colors',
                  riskFilter === 'critical'
                    ? 'border-risk-critical bg-risk-critical/15 text-risk-critical font-semibold'
                    : 'border-border bg-background text-risk-critical hover:bg-risk-critical/10'
                )}
              >
                Critical ({categoryCounts.critical})
              </button>
              <button
                type="button"
                onClick={() => setRiskFilter('high')}
                className={cn(
                  'rounded-sm border px-2.5 py-1 font-medium transition-colors',
                  riskFilter === 'high'
                    ? 'border-risk-high bg-risk-high/15 text-risk-high font-semibold'
                    : 'border-border bg-background text-risk-high hover:bg-risk-high/10'
                )}
              >
                High ({categoryCounts.high})
              </button>
              <button
                type="button"
                onClick={() => setRiskFilter('moderate')}
                className={cn(
                  'rounded-sm border px-2.5 py-1 font-medium transition-colors',
                  riskFilter === 'moderate'
                    ? 'border-risk-moderate bg-risk-moderate/15 text-risk-moderate font-semibold'
                    : 'border-border bg-background text-risk-moderate hover:bg-risk-moderate/10'
                )}
              >
                Moderate ({categoryCounts.moderate})
              </button>
              <button
                type="button"
                onClick={() => setRiskFilter('low')}
                className={cn(
                  'rounded-sm border px-2.5 py-1 font-medium transition-colors',
                  riskFilter === 'low'
                    ? 'border-risk-low bg-risk-low/15 text-risk-low font-semibold'
                    : 'border-border bg-background text-risk-low hover:bg-risk-low/10'
                )}
              >
                Low ({categoryCounts.low})
              </button>
            </div>
          </div>

          {/* Compact Dropdown Filters Grid */}
          <div className="mt-3.5 pt-3.5 border-t border-border/70">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {/* 1. Risk Filter */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Risk Band
                </label>
                <Select value={riskFilter} onValueChange={setRiskFilter}>
                  <SelectTrigger className="h-8.5 w-full bg-background text-xs">
                    <SelectValue placeholder="All Risk Bands" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risk Bands</SelectItem>
                    <SelectItem value="critical">Critical (76–100)</SelectItem>
                    <SelectItem value="high">High (56–75)</SelectItem>
                    <SelectItem value="moderate">Moderate (31–55)</SelectItem>
                    <SelectItem value="low">Low (0–30)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 2. State Filter */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  State
                </label>
                <Select value={stateFilter} onValueChange={setStateFilter}>
                  <SelectTrigger className="h-8.5 w-full bg-background text-xs">
                    <SelectValue placeholder="All States" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {uniqueStates.map((st) => (
                      <SelectItem key={st} value={st}>
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 3. Sector Filter */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Sector
                </label>
                <Select value={sectorFilter} onValueChange={setSectorFilter}>
                  <SelectTrigger className="h-8.5 w-full bg-background text-xs">
                    <SelectValue placeholder="All Sectors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sectors</SelectItem>
                    {uniqueSectors.map((sec) => (
                      <SelectItem key={sec} value={sec}>
                        {sec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 4. Ministry Filter */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Ministry
                </label>
                <Select value={ministryFilter} onValueChange={setMinistryFilter}>
                  <SelectTrigger className="h-8.5 w-full bg-background text-xs truncate">
                    <SelectValue placeholder="All Ministries" />
                  </SelectTrigger>
                  <SelectContent className="max-w-[320px]">
                    <SelectItem value="all">All Ministries</SelectItem>
                    {uniqueMinistries.map((min) => (
                      <SelectItem key={min} value={min} className="text-xs">
                        {min}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 5. Agency Filter */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Agency / Auth.
                </label>
                <Select value={agencyFilter} onValueChange={setAgencyFilter}>
                  <SelectTrigger className="h-8.5 w-full bg-background text-xs">
                    <SelectValue placeholder="All Agencies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agencies</SelectItem>
                    {uniqueAgencies.map((ag) => (
                      <SelectItem key={ag} value={ag}>
                        {ag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 6. CCTV Availability Filter */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  CCTV Telemetry
                </label>
                <Select value={cctvFilter} onValueChange={setCctvFilter}>
                  <SelectTrigger className="h-8.5 w-full bg-background text-xs">
                    <SelectValue placeholder="All Feeds" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Feeds</SelectItem>
                    <SelectItem value="active">CCTV Active</SelectItem>
                    <SelectItem value="offline">CCTV Offline / None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Filter Status Bar */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
              <span>
                Showing <strong className="text-foreground">{filteredProjects.length}</strong> of{' '}
                <strong className="text-foreground">{projectsList.length}</strong> monitored projects
              </span>
              {isFiltered && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  Filter Active
                </span>
              )}
            </div>

            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-7 gap-1 px-2 text-xs text-primary hover:text-primary/80"
              >
                <RotateCcw className="h-3 w-3" />
                Reset all filters
              </Button>
            )}
          </div>
        </div>

        {/* 3. PROJECT TABLE */}
        <div className="rounded-md border border-border bg-card shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 min-w-[220px]">Project</th>
                  <th className="px-3 py-3 min-w-[130px]">Location</th>
                  <th className="px-3 py-3 min-w-[100px]">Sector</th>
                  <th className="px-3 py-3 text-center min-w-[120px]">
                    <div className="flex flex-col items-center">
                      <span>Reported Progress</span>
                      <span className="text-[9px] font-normal lowercase tracking-normal text-muted-foreground">
                        (official log)
                      </span>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-center min-w-[140px] bg-primary/[0.02] border-x border-border/40">
                    <div className="flex flex-col items-center">
                      <span className="text-foreground font-bold">Visual Progress Estimate</span>
                      <span className="text-[9px] font-normal lowercase tracking-normal text-primary">
                        (observational / unconfirmed)
                      </span>
                    </div>
                  </th>
                  <th className="px-3 py-3 min-w-[95px]">Risk</th>
                  <th className="px-3 py-3 min-w-[170px]">Evidence</th>
                  <th className="px-3 py-3 min-w-[95px]">Status</th>
                  <th className="px-3 py-3 text-right min-w-[50px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6">
                      <EmptyState
                        title="No matching infrastructure projects found"
                        description="Try adjusting your keyword query or resetting risk, state, sector, or ministry filters."
                        action={
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleResetFilters}
                            className="gap-1.5 text-xs"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Clear all active filters
                          </Button>
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((p) => {
                    const visualVal =
                      typeof p.visualProgressEstimate === 'number'
                        ? p.visualProgressEstimate
                        : p.progressPercent;
                    const variance = visualVal - p.progressPercent;
                    const hasSevereGap = variance <= -10;
                    const hasModerateGap = variance < 0 && variance > -10;
                    const statusMeta = STATUS_CONFIG[p.status];

                    return (
                      <tr
                        key={p.id}
                        onClick={() => router.push(`/projects/${p.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            router.push(`/projects/${p.id}`);
                          }
                        }}
                        tabIndex={0}
                        className="group cursor-pointer transition-colors hover:bg-muted/30 focus-visible:bg-muted/40 focus-visible:outline-none"
                      >
                        {/* 1. Project Column */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-foreground group-hover:text-primary group-hover:underline">
                                {p.name}
                              </span>
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                              <span className="font-mono font-medium text-foreground/80">
                                {p.code}
                              </span>
                              <span>•</span>
                              <span>{p.agency || p.contractor}</span>
                              {p.cctvAvailable ? (
                                <span
                                  className="inline-flex items-center gap-0.5 rounded-xs bg-risk-low/10 px-1 py-0.2 text-[10px] font-medium text-risk-low"
                                  title="Active CCTV Feeds Enabled"
                                >
                                  <Video className="h-2.5 w-2.5" />
                                  CCTV
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-0.5 rounded-xs bg-muted px-1 py-0.2 text-[10px] font-medium text-muted-foreground"
                                  title="No Live CCTV Stream"
                                >
                                  <VideoOff className="h-2.5 w-2.5" />
                                  Offline
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 2. Location Column */}
                        <td className="px-3 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{p.state}</span>
                            <span className="text-[11px] text-muted-foreground">{p.district}</span>
                          </div>
                        </td>

                        {/* 3. Sector Column */}
                        <td className="px-3 py-3">
                          <span className="inline-block rounded-xs border border-border/80 bg-muted/40 px-2 py-0.5 text-[11px] text-foreground font-medium">
                            {p.sector}
                          </span>
                        </td>

                        {/* 4. Reported Progress Column */}
                        <td className="px-3 py-3 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-mono text-xs font-semibold text-foreground">
                              {p.progressPercent}%
                            </span>
                            <div className="mt-1 h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-foreground/60"
                                style={{ width: `${Math.min(100, p.progressPercent)}%` }}
                              />
                            </div>
                            <span className="mt-0.5 text-[9px] text-muted-foreground">
                              Contractor log
                            </span>
                          </div>
                        </td>

                        {/* 5. Visual Progress Estimate Column */}
                        <td className="px-3 py-3 text-center bg-primary/[0.02] border-x border-border/40">
                          <div className="inline-flex flex-col items-center">
                            <div className="flex items-center gap-1">
                              <span
                                className={cn(
                                  'font-mono text-xs font-bold',
                                  hasSevereGap
                                    ? 'text-risk-critical'
                                    : hasModerateGap
                                      ? 'text-risk-high'
                                      : 'text-foreground'
                                )}
                              >
                                {visualVal}%
                              </span>
                              <span className="text-[10px] text-muted-foreground font-medium">
                                (estimate)
                              </span>
                            </div>

                            {/* Progress bar visual comparison */}
                            <div className="mt-1 h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                              <div
                                className={cn(
                                  'h-full rounded-full',
                                  hasSevereGap
                                    ? 'bg-risk-critical'
                                    : hasModerateGap
                                      ? 'bg-risk-high'
                                      : 'bg-primary'
                                )}
                                style={{ width: `${Math.min(100, visualVal)}%` }}
                              />
                            </div>

                            {/* Variance tag */}
                            <span
                              className={cn(
                                'mt-0.5 font-mono text-[10px]',
                                hasSevereGap
                                  ? 'font-bold text-risk-critical'
                                  : hasModerateGap
                                    ? 'font-medium text-risk-high'
                                    : 'text-muted-foreground'
                              )}
                            >
                              {variance === 0
                                ? '0% var.'
                                : variance > 0
                                  ? `+${variance}% var.`
                                  : `${variance}% var.`}
                            </span>
                          </div>
                        </td>

                        {/* 6. Risk Column */}
                        <td className="px-3 py-3">
                          <RiskBadge band={p.riskBand} score={p.riskScore} />
                        </td>

                        {/* 7. Evidence Column */}
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-1 max-w-[210px]">
                            {p.evidence.map((e) => (
                              <EvidenceChip key={e} type={e} />
                            ))}
                          </div>
                        </td>

                        {/* 8. Status Column */}
                        <td className="px-3 py-3">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-xs border px-2 py-0.5 text-[11px] font-semibold capitalize',
                              statusMeta.bg,
                              statusMeta.text,
                              statusMeta.border
                            )}
                          >
                            {statusMeta.label}
                          </span>
                        </td>

                        {/* 9. Action Column */}
                        <td className="px-3 py-3 text-right">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                            <ChevronRight className="h-4 w-4" />
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer & Protocol Note */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
            <div className="flex items-start sm:items-center gap-2">
              <Info className="mt-0.5 sm:mt-0 h-4 w-4 shrink-0 text-primary" />
              <p className="text-[11px] leading-tight">
                <strong className="font-semibold text-foreground">Observational Protocol:</strong>{' '}
                <span className="text-foreground font-medium">Visual Progress Estimates</span> are
                synthesized algorithmically from optical satellite passes, SAR radar, and CCTV
                feeds. They serve as an early warning sensor, not official contractor certification.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 text-[11px]">
              <span className="font-medium text-foreground">Risk Bands:</span>
              <span className="text-risk-low font-medium">0–30 Low</span>
              <span>•</span>
              <span className="text-risk-moderate font-medium">31–55 Moderate</span>
              <span>•</span>
              <span className="text-risk-high font-medium">56–75 High</span>
              <span>•</span>
              <span className="text-risk-critical font-medium">76–100 Critical</span>
            </div>
          </div>
        </div>

        {/* 4. TAXONOMY & AUDIT TRAIL GUIDE */}
        <div className="rounded-md border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Layers className="h-4 w-4 text-primary" />
            <span>InfraSight Evidence Verification Taxonomy</span>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5 text-xs">
            <div className="rounded-sm border border-border/70 bg-muted/20 p-2.5">
              <EvidenceChip type="reported" />
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                Self-reported logs submitted by construction agencies and line ministries.
              </p>
            </div>
            <div className="rounded-sm border border-border/70 bg-muted/20 p-2.5">
              <EvidenceChip type="observed" />
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                Verified optical/SAR satellite imagery and automated CCTV visual feeds.
              </p>
            </div>
            <div className="rounded-sm border border-border/70 bg-muted/20 p-2.5">
              <EvidenceChip type="predicted" />
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                Hydrological, schedule extrapolation, and weather impact projections.
              </p>
            </div>
            <div className="rounded-sm border border-border/70 bg-muted/20 p-2.5">
              <EvidenceChip type="ai-interpreted" />
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                Machine learning synthesis detecting progress divergence and stalled assets.
              </p>
            </div>
            <div className="rounded-sm border border-border/70 bg-muted/20 p-2.5">
              <EvidenceChip type="verified" />
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                Field audit completed and certified by an authorized oversight engineer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
