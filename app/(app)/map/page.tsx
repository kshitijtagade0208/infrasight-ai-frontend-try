'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RiskBadge } from '@/components/risk-badge';
import { EvidenceChip } from '@/components/evidence-chip';
import { stateRiskData, projects as fallbackProjects } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { RISK_BAND_LABEL, riskBandFromScore } from '@/lib/risk';
import type { Project, ProjectStatus, RiskBand } from '@/lib/types';

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

import {
  MapPin,
  Layers,
  Filter,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  Wallet,
  HardHat,
  X,
  Compass,
  Info,
  Maximize2,
  ArrowUpRight,
  Eye,
} from 'lucide-react';

// Geographic SVG coordinate mappings for mock project locations across India (normalized 0-650 x, 0-720 y)
interface ProjectGeoMarker {
  projectId: string;
  project: Project;
  x: number;
  y: number;
  labelPosition: 'top' | 'bottom' | 'left' | 'right';
  isKeyProject?: boolean;
}

// Projected coordinates calculated to align with the stylized vector India map
const PROJECT_GEO_COORDINATES: Record<string, { x: number; y: number; labelPos: 'top' | 'bottom' | 'left' | 'right'; key?: boolean }> = {
  'PRJ-002': { x: 275, y: 315, labelPos: 'top', key: true }, // Ken-Betwa River Interlinking (Madhya Pradesh / Tikamgarh) - CRITICAL
  'PRJ-008': { x: 448, y: 260, labelPos: 'top', key: true }, // Teesta Stage IV (Sikkim) - HIGH
  'PRJ-001': { x: 172, y: 440, labelPos: 'left', key: true }, // Mumbai Coastal Road / MTHL (Maharashtra / Mumbai) - HIGH
  'PRJ-011': { x: 435, y: 365, labelPos: 'right', key: true }, // Kolkata East-West Metro (West Bengal / Kolkata) - HIGH
  'PRJ-006': { x: 550, y: 255, labelPos: 'top', key: true }, // Brahmaputra Flood Embankment (Assam / Dibrugarh) - CRITICAL
  'PRJ-014': { x: 315, y: 475, labelPos: 'right', key: true }, // Polavaram Headworks Dam (Andhra Pradesh / Eluru) - CRITICAL
  'PRJ-003': { x: 165, y: 350, labelPos: 'bottom' }, // DMIC Node (Gujarat / Ahmedabad) - LOW
  'PRJ-004': { x: 245, y: 565, labelPos: 'bottom', key: true }, // Bengaluru Suburban Rail (Karnataka / Bengaluru) - HIGH
  'PRJ-005': { x: 110, y: 335, labelPos: 'left' }, // Kutch Green Hydrogen Hub (Gujarat / Kutch) - LOW
  'PRJ-007': { x: 290, y: 565, labelPos: 'right' }, // Chennai Outer Ring Road (Tamil Nadu / Chennai) - MODERATE
  'PRJ-009': { x: 350, y: 460, labelPos: 'right' }, // Visakhapatnam Smart City (Andhra Pradesh / Vizag) - LOW
  'PRJ-010': { x: 220, y: 360, labelPos: 'bottom' }, // Indore Metro Line Corridor (Madhya Pradesh / Indore) - MODERATE
  'PRJ-012': { x: 220, y: 275, labelPos: 'left' }, // Jaipur-Ajmer Expressway (Rajasthan / Jaipur) - LOW
  'PRJ-013': { x: 242, y: 255, labelPos: 'top' }, // Western DFC (Rajasthan / Alwar) - LOW
  'PRJ-015': { x: 205, y: 115, labelPos: 'top', key: true }, // Zojila Strategic Tunnel (J&K / Ganderbal) - HIGH
  'PRJ-016': { x: 228, y: 205, labelPos: 'top' }, // Gorakhpur Anu Vidyut Pariyojana (Haryana / Fatehabad) - LOW
};

// State polygon boundaries simplified for visual spatial GIS backdrop
const STATE_REGIONS = [
  {
    name: 'Jammu & Kashmir & Ladakh',
    risk: 'high',
    path: 'M 175 60 L 225 35 L 285 55 L 295 110 L 255 140 L 210 145 L 180 125 Z',
  },
  {
    name: 'Himachal & Punjab & Haryana',
    risk: 'low',
    path: 'M 180 125 L 210 145 L 255 140 L 265 190 L 235 225 L 195 210 L 175 160 Z',
  },
  {
    name: 'Uttarakhand',
    risk: 'moderate',
    path: 'M 255 140 L 295 160 L 290 205 L 265 190 Z',
  },
  {
    name: 'Rajasthan',
    risk: 'low',
    path: 'M 130 220 L 195 210 L 235 225 L 250 280 L 205 320 L 140 310 L 115 260 Z',
  },
  {
    name: 'Gujarat',
    risk: 'low',
    path: 'M 75 320 L 140 310 L 170 325 L 185 385 L 155 410 L 130 380 L 105 375 L 75 350 Z',
  },
  {
    name: 'Uttar Pradesh',
    risk: 'moderate',
    path: 'M 235 225 L 290 205 L 375 235 L 365 295 L 315 315 L 250 280 Z',
  },
  {
    name: 'Madhya Pradesh',
    risk: 'high',
    path: 'M 205 320 L 250 280 L 315 315 L 335 370 L 265 395 L 200 375 Z',
  },
  {
    name: 'Bihar & Jharkhand',
    risk: 'moderate',
    path: 'M 375 235 L 430 250 L 435 330 L 370 340 L 365 295 Z',
  },
  {
    name: 'West Bengal & Sikkim',
    risk: 'high',
    path: 'M 435 225 L 460 225 L 450 270 L 455 350 L 420 395 L 415 340 L 435 330 Z',
  },
  {
    name: 'Assam & Northeast States',
    risk: 'high',
    path: 'M 460 245 L 530 220 L 595 240 L 590 290 L 525 310 L 485 305 L 465 280 Z',
  },
  {
    name: 'Maharashtra',
    risk: 'moderate',
    path: 'M 155 410 L 185 385 L 265 395 L 285 455 L 235 495 L 165 470 Z',
  },
  {
    name: 'Odisha & Chhattisgarh',
    risk: 'moderate',
    path: 'M 315 315 L 370 340 L 420 395 L 375 450 L 335 440 L 335 370 Z',
  },
  {
    name: 'Andhra Pradesh & Telangana',
    risk: 'moderate',
    path: 'M 265 450 L 335 440 L 375 450 L 340 540 L 280 535 L 255 480 Z',
  },
  {
    name: 'Karnataka & Goa',
    risk: 'moderate',
    path: 'M 175 480 L 235 495 L 275 535 L 245 610 L 200 580 L 185 520 Z',
  },
  {
    name: 'Tamil Nadu & Kerala',
    risk: 'moderate',
    path: 'M 245 610 L 275 535 L 320 545 L 295 655 L 250 675 L 225 640 Z',
  },
];

export default function MapPage() {
  const [projectsList, setProjectsList] = React.useState<Project[]>(fallbackProjects);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>('PRJ-002'); // Default to Ken-Betwa River Interlinking
  const [selectedState, setSelectedState] = React.useState<string | null>(null);
  const [riskFilter, setRiskFilter] = React.useState<'all' | RiskBand>('all');
  const [sectorFilter, setSectorFilter] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [zoomLevel, setZoomLevel] = React.useState<number>(1);
  const [panOffset, setPanOffset] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });

  React.useEffect(() => {
    let active = true;
    async function fetchMapProjects() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`);
        if (!res.ok) return;
        const data = await res.json();
        if (active && Array.isArray(data) && data.length > 0) {
          setProjectsList(data.map(mapBackendProject));
        }
      } catch (err) {
        console.error('Error fetching map projects from backend:', err);
      }
    }
    fetchMapProjects();
    return () => {
      active = false;
    };
  }, []);

  // Map markers list matching project data
  const mapMarkers = React.useMemo<ProjectGeoMarker[]>(() => {
    return projectsList.map((project) => {
      const geo = PROJECT_GEO_COORDINATES[project.id] || {
        x: 250 + (project.riskScore % 15) * 10,
        y: 320 + (project.riskScore % 20) * 8,
        labelPos: 'top' as const,
      };
      return {
        projectId: project.id,
        project,
        x: geo.x,
        y: geo.y,
        labelPosition: geo.labelPos,
        isKeyProject: geo.key,
      };
    });
  }, [projectsList]);

  // Filtered markers
  const filteredMarkers = React.useMemo(() => {
    return mapMarkers.filter((m) => {
      if (riskFilter !== 'all' && m.project.riskBand !== riskFilter) return false;
      if (sectorFilter !== 'all' && m.project.sector !== sectorFilter) return false;
      if (selectedState && m.project.state !== selectedState) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = m.project.name.toLowerCase().includes(q);
        const matchesState = m.project.state.toLowerCase().includes(q);
        const matchesCode = m.project.code.toLowerCase().includes(q);
        if (!matchesName && !matchesState && !matchesCode) return false;
      }
      return true;
    });
  }, [mapMarkers, riskFilter, sectorFilter, selectedState, searchQuery]);

  // Selected project details
  const selectedProject = React.useMemo(() => {
    return projectsList.find((p) => p.id === selectedProjectId) || projectsList[0] || fallbackProjects[1];
  }, [projectsList, selectedProjectId]);

  // Available unique sectors
  const sectors = React.useMemo(() => {
    const list = Array.from(new Set(projectsList.map((p) => p.sector)));
    return ['all', ...list];
  }, [projectsList]);

  // Map zoom handlers
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.25));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setSelectedState(null);
  };

  const topStates = React.useMemo(() => {
    return [...stateRiskData].sort((a, b) => b.avgRisk - a.avgRisk).slice(0, 8);
  }, []);

  return (
    <div className="flex flex-col">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Risk Map"
        description="Geographic overview of project risk across India · Spatial Telemetry Console"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Map' }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Sector filter */}
            <div className="flex items-center gap-1.5 rounded-sm border border-border bg-card px-2.5 py-1 text-xs">
              <Layers className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="bg-transparent text-xs font-medium text-foreground outline-none cursor-pointer"
              >
                <option value="all">All Sectors</option>
                {sectors
                  .filter((s) => s !== 'all')
                  .map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
              </select>
            </div>

            {/* Risk filter */}
            <div className="flex items-center gap-1.5 rounded-sm border border-border bg-card px-2.5 py-1 text-xs">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value as any)}
                className="bg-transparent text-xs font-medium text-foreground outline-none cursor-pointer"
              >
                <option value="all">All Risk Bands</option>
                <option value="critical">Critical Risk Only</option>
                <option value="high">High Risk</option>
                <option value="moderate">Moderate Risk</option>
                <option value="low">Low Risk</option>
              </select>
            </div>

            {selectedState && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedState(null)}
                className="gap-1 text-xs font-medium"
              >
                Clear State Filter ({selectedState}) <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        }
      />

      <div className="space-y-5 p-6">
        {/* 2. DEMO / MOCK GIS NOTICE BANNER */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-primary/20 bg-primary/5 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2 text-foreground">
            <span className="flex h-5 items-center rounded-xs bg-primary px-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
              DEMO / MOCK GIS VISUALIZATION
            </span>
            <span className="text-muted-foreground">
              Frontend interactive spatial overview with localized coordinates. Not live satellite or Survey of India GIS stream.
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span>Showing {filteredMarkers.length} of {mapMarkers.length} mapped projects</span>
            <span className="font-mono text-foreground font-semibold">Active Layer: Multi-Spectral & Risk</span>
          </div>
        </div>

        {/* 3. MAIN MAP & STATE RISK INDEX GRID */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* INTERACTIVE VECTOR MAP CONTAINER (8 cols) */}
          <Card className="lg:col-span-8 flex flex-col overflow-hidden border-border bg-card shadow-2xs">
            <CardHeader className="border-b border-border/80 bg-muted/20 pb-3 pt-3 px-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-primary/10 text-primary">
                    <Compass className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      National Risk Telemetry Map — India
                    </CardTitle>
                    <p className="text-[11px] text-muted-foreground">
                      Interactive project markers · Select any point to inspect live telemetry
                    </p>
                  </div>
                </div>

                {/* Map Controls */}
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center rounded-sm border border-border bg-card shadow-2xs">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleZoomIn}
                      className="h-7 w-7 rounded-none text-muted-foreground hover:text-foreground"
                      title="Zoom In (+)"
                    >
                      <ZoomIn className="h-3.5 w-3.5" />
                    </Button>
                    <span className="border-x border-border/60 px-2 font-mono text-[11px] text-muted-foreground">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleZoomOut}
                      className="h-7 w-7 rounded-none text-muted-foreground hover:text-foreground"
                      title="Zoom Out (-)"
                    >
                      <ZoomOut className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleResetZoom}
                      className="h-7 w-7 rounded-none border-l border-border/60 text-muted-foreground hover:text-foreground"
                      title="Reset View"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>

            {/* MAP STAGE */}
            <div className="relative flex-1 min-h-[520px] bg-[#F7F7F5] dark:bg-[#121417] overflow-hidden select-none">
              {/* Graticule / Blueprint Grid Pattern */}
              <div
                className="absolute inset-0 opacity-40 pointer-events-none"
                style={{
                  backgroundImage: `
                    radial-gradient(circle at 1px 1px, rgba(0,0,0,0.08) 1px, transparent 0)
                  `,
                  backgroundSize: '24px 24px',
                }}
              />

              {/* Geographic Coordinates Watermark */}
              <div className="absolute left-3 top-3 pointer-events-none flex flex-col gap-0.5 font-mono text-[10px] text-muted-foreground/60">
                <span>LAT: 08°04′N – 37°06′N</span>
                <span>LON: 68°07′E – 97°25′E</span>
                <span>PROJECTION: EPSG:4326 (CONFORMAL MOCK)</span>
              </div>

              {/* SVG MAP ELEMENT */}
              <div
                className="w-full h-full flex items-center justify-center p-2 transition-transform duration-200"
                style={{
                  transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                  transformOrigin: 'center center',
                }}
              >
                <svg
                  viewBox="0 0 650 720"
                  className="w-full h-full max-h-[600px] max-w-[650px] drop-shadow-sm"
                  style={{ overflow: 'visible' }}
                >
                  <defs>
                    {/* Glow filters for critical risk markers */}
                    <filter id="criticalGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor="#B23A3A" floodOpacity="0.4" />
                    </filter>
                    <filter id="highGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#C7591E" floodOpacity="0.35" />
                    </filter>
                    {/* Pattern for Bay of Bengal / Arabian Sea water texture */}
                    <pattern id="seaPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                      <circle cx="2" cy="2" r="0.8" fill="#CBD5E1" opacity="0.3" />
                    </pattern>
                  </defs>

                  {/* Ocean & Boundary Context */}
                  <rect x="0" y="0" width="650" height="720" fill="transparent" />

                  {/* Latitude / Longitude Guide Lines */}
                  <g stroke="#E2E2DE" strokeDasharray="3 3" strokeWidth="0.75" opacity="0.7">
                    <line x1="40" y1="120" x2="610" y2="120" />
                    <text x="45" y="115" fontSize="8" fill="#94A3B8" fontFamily="monospace">32°N</text>
                    
                    <line x1="40" y1="260" x2="610" y2="260" />
                    <text x="45" y="255" fontSize="8" fill="#94A3B8" fontFamily="monospace">24°N (Tropic of Cancer)</text>

                    <line x1="40" y1="420" x2="610" y2="420" />
                    <text x="45" y="415" fontSize="8" fill="#94A3B8" fontFamily="monospace">16°N</text>

                    <line x1="40" y1="580" x2="610" y2="580" />
                    <text x="45" y="575" fontSize="8" fill="#94A3B8" fontFamily="monospace">08°N</text>

                    <line x1="160" y1="40" x2="160" y2="680" />
                    <text x="165" y="55" fontSize="8" fill="#94A3B8" fontFamily="monospace">72°E</text>

                    <line x1="280" y1="40" x2="280" y2="680" />
                    <text x="285" y="55" fontSize="8" fill="#94A3B8" fontFamily="monospace">80°E</text>

                    <line x1="440" y1="40" x2="440" y2="680" />
                    <text x="445" y="55" fontSize="8" fill="#94A3B8" fontFamily="monospace">88°E</text>
                  </g>

                  {/* MAINLAND INDIA BASE BOUNDARY SILHOUETTE */}
                  <path
                    d="
                      M 175 60
                      C 185 45, 215 30, 240 32
                      C 265 35, 290 60, 295 105
                      C 300 135, 275 145, 265 170
                      C 260 185, 295 170, 310 190
                      C 325 210, 380 230, 420 240
                      C 435 220, 455 220, 465 240
                      C 485 245, 520 220, 560 230
                      C 590 235, 605 260, 595 285
                      C 585 305, 530 310, 500 305
                      C 475 300, 460 270, 445 280
                      C 440 315, 455 350, 425 385
                      C 400 415, 360 445, 340 500
                      C 320 545, 290 635, 255 680
                      C 240 680, 225 640, 210 590
                      C 195 540, 160 480, 160 435
                      C 160 405, 185 390, 180 365
                      C 175 340, 130 380, 100 370
                      C 70 360, 75 325, 115 315
                      C 140 310, 150 280, 140 240
                      C 130 200, 170 170, 180 130
                      Z
                    "
                    fill="#ECECE8"
                    stroke="#C8C8C2"
                    strokeWidth="1.8"
                    className="transition-colors duration-200"
                  />

                  {/* STATE REGIONS WITH SUBTLE RISK HEAT HUES */}
                  {STATE_REGIONS.map((region) => {
                    const isHigh = region.risk === 'high';
                    const isModerate = region.risk === 'moderate';
                    const isStateSelected = selectedState && region.name.toLowerCase().includes(selectedState.toLowerCase());

                    return (
                      <path
                        key={region.name}
                        d={region.path}
                        fill={
                          isStateSelected
                            ? '#FEF08A'
                            : isHigh
                              ? '#FEE2E2'
                              : isModerate
                                ? '#FEF3C7'
                                : '#F1F5F9'
                        }
                        fillOpacity={isStateSelected ? 0.65 : isHigh ? 0.45 : isModerate ? 0.35 : 0.25}
                        stroke={isStateSelected ? '#CA8A04' : '#D1D5DB'}
                        strokeWidth={isStateSelected ? '1.5' : '0.8'}
                        className="transition-all duration-150 cursor-pointer hover:fill-primary/20"
                        onClick={() => {
                          const matched = stateRiskData.find((s) => region.name.includes(s.state));
                          if (matched) setSelectedState(matched.state);
                        }}
                      >
                        <title>{region.name} (Avg Risk: {region.risk})</title>
                      </path>
                    );
                  })}

                  {/* ISLAND TERRITORIES INSET BOXES */}
                  {/* Lakshadweep */}
                  <g transform="translate(130, 580)">
                    <rect x="0" y="0" width="30" height="40" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="0.75" rx="2" />
                    <circle cx="10" cy="12" r="1.5" fill="#64748B" />
                    <circle cx="14" cy="20" r="1.2" fill="#64748B" />
                    <circle cx="18" cy="28" r="1.5" fill="#64748B" />
                    <text x="3" y="36" fontSize="5" fill="#64748B" fontFamily="sans-serif">Lakshadweep</text>
                  </g>

                  {/* Andaman & Nicobar */}
                  <g transform="translate(560, 500)">
                    <rect x="0" y="0" width="38" height="75" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="0.75" rx="2" />
                    <ellipse cx="18" cy="20" rx="2" ry="8" fill="#64748B" />
                    <ellipse cx="20" cy="40" rx="1.8" ry="6" fill="#64748B" />
                    <ellipse cx="22" cy="58" rx="2.2" ry="5" fill="#64748B" />
                    <text x="4" y="70" fontSize="5" fill="#64748B" fontFamily="sans-serif">A & N Islands</text>
                  </g>

                  {/* GEOGRAPHIC SEA LABELS */}
                  <text x="75" y="470" fontSize="9" fill="#94A3B8" fontWeight="600" letterSpacing="2">
                    ARABIAN SEA
                  </text>
                  <text x="430" y="500" fontSize="9" fill="#94A3B8" fontWeight="600" letterSpacing="2">
                    BAY OF BENGAL
                  </text>
                  <text x="210" y="705" fontSize="9" fill="#94A3B8" fontWeight="600" letterSpacing="2">
                    INDIAN OCEAN
                  </text>

                  {/* MAJOR INFRASTRUCTURE PROJECT MARKERS */}
                  {filteredMarkers.map((marker) => {
                    const isSelected = selectedProjectId === marker.projectId;
                    const p = marker.project;
                    const band = p.riskBand;

                    // Severity colors
                    const colorFill =
                      band === 'critical'
                        ? '#B23A3A'
                        : band === 'high'
                          ? '#C7591E'
                          : band === 'moderate'
                            ? '#B8860B'
                            : '#2D7D46';

                    return (
                      <g
                        key={marker.projectId}
                        transform={`translate(${marker.x}, ${marker.y})`}
                        className="cursor-pointer group"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProjectId(marker.projectId);
                        }}
                      >
                        {/* Critical / High Risk Pulsing Waves */}
                        {(band === 'critical' || isSelected) && (
                          <circle
                            cx="0"
                            cy="0"
                            r={isSelected ? '18' : '14'}
                            fill={colorFill}
                            fillOpacity="0.15"
                            className="animate-ping"
                          />
                        )}

                        {band === 'high' && !isSelected && (
                          <circle
                            cx="0"
                            cy="0"
                            r="11"
                            fill={colorFill}
                            fillOpacity="0.18"
                          />
                        )}

                        {/* Outer Marker Ring */}
                        <circle
                          cx="0"
                          cy="0"
                          r={isSelected ? '10' : marker.isKeyProject ? '8' : '6.5'}
                          fill="#FFFFFF"
                          stroke={colorFill}
                          strokeWidth={isSelected ? '3' : '2'}
                          filter={band === 'critical' ? 'url(#criticalGlow)' : band === 'high' ? 'url(#highGlow)' : undefined}
                          className="transition-all duration-150 group-hover:scale-125"
                        />

                        {/* Center Core Dot */}
                        <circle
                          cx="0"
                          cy="0"
                          r={isSelected ? '5.5' : marker.isKeyProject ? '4.5' : '3.5'}
                          fill={colorFill}
                          className="transition-all duration-150"
                        />

                        {/* Numeric Risk Score inside marker when selected or key project */}
                        {(marker.isKeyProject || isSelected) && (
                          <g transform="translate(0, -13)">
                            <rect
                              x="-14"
                              y="-8"
                              width="28"
                              height="12"
                              rx="2"
                              fill={isSelected ? '#1E293B' : colorFill}
                              stroke="#FFFFFF"
                              strokeWidth="0.75"
                            />
                            <text
                              x="0"
                              y="1"
                              fontSize="8"
                              fontWeight="700"
                              fill="#FFFFFF"
                              textAnchor="middle"
                              fontFamily="monospace"
                            >
                              {p.riskScore}
                            </text>
                          </g>
                        )}

                        {/* Name Label for Key Projects */}
                        {(marker.isKeyProject || isSelected) && (
                          <text
                            x={
                              marker.labelPosition === 'left'
                                ? -14
                                : marker.labelPosition === 'right'
                                  ? 14
                                  : 0
                            }
                            y={
                              marker.labelPosition === 'top'
                                ? -24
                                : marker.labelPosition === 'bottom'
                                  ? 18
                                  : 3
                            }
                            textAnchor={
                              marker.labelPosition === 'left'
                                ? 'end'
                                : marker.labelPosition === 'right'
                                  ? 'start'
                                  : 'middle'
                            }
                            fontSize="9"
                            fontWeight={isSelected ? '700' : '600'}
                            fill={isSelected ? '#0F172A' : '#334155'}
                            className="pointer-events-none drop-shadow-sm font-sans"
                          >
                            {p.name.split(' ')[0]} {p.name.split(' ')[1] || ''}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* FLOATING PROJECT DETAIL POPUP (Requirement 4 & 5) */}
              {selectedProject && (
                <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-sm z-20">
                  <div className="rounded-md border border-border bg-card/95 p-3.5 shadow-md backdrop-blur-md">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn('h-2.5 w-2.5 rounded-full', {
                              'bg-risk-critical': selectedProject.riskBand === 'critical',
                              'bg-risk-high': selectedProject.riskBand === 'high',
                              'bg-risk-moderate': selectedProject.riskBand === 'moderate',
                              'bg-risk-low': selectedProject.riskBand === 'low',
                            })}
                          />
                          <span className="font-mono text-[10px] font-semibold uppercase text-muted-foreground">
                            {selectedProject.code} · {selectedProject.state}
                          </span>
                        </div>
                        <h4 className="mt-1 text-sm font-bold text-foreground leading-snug">
                          {selectedProject.name}
                        </h4>
                      </div>
                      <RiskBadge band={selectedProject.riskBand} score={selectedProject.riskScore} />
                    </div>

                    <div className="mt-2.5 grid grid-cols-2 gap-2 border-y border-border/70 py-2 text-xs">
                      <div>
                        <span className="text-[10px] uppercase text-muted-foreground">Status:</span>
                        <p className="font-medium capitalize text-foreground">
                          {selectedProject.status.replace('-', ' ')}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-muted-foreground">Sector:</span>
                        <p className="font-medium text-foreground">{selectedProject.sector}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-muted-foreground">Sanctioned Outlay:</span>
                        <p className="font-mono font-medium text-foreground">
                          ₹{selectedProject.budgetCrore.toLocaleString('en-IN')} Cr
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-muted-foreground">Reported Progress:</span>
                        <p className="font-mono font-medium text-foreground">
                          {selectedProject.progressPercent}%
                        </p>
                      </div>
                    </div>

                    {/* Prominent Navigation Link (Requirement 5 for Ken-Betwa and all projects) */}
                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <Link href={`/projects/${selectedProject.id}`} className="w-full">
                        <Button size="sm" className="w-full gap-1.5 text-xs font-semibold">
                          Open Project Detail & Risk Analysis
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* MAP LEGEND (Requirement 8) */}
              <div className="absolute top-4 right-4 z-10 rounded-sm border border-border bg-card/90 p-2.5 shadow-2xs backdrop-blur-xs">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Risk Severity Legend
                </p>
                <div className="space-y-1 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="flex h-3 w-3 items-center justify-center rounded-full bg-risk-critical/20">
                      <span className="h-2 w-2 rounded-full bg-risk-critical" />
                    </span>
                    <span className="font-medium text-foreground">Critical</span>
                    <span className="font-mono text-muted-foreground text-[10px]">(Score 76–100)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-3 w-3 items-center justify-center rounded-full bg-risk-high/20">
                      <span className="h-2 w-2 rounded-full bg-risk-high" />
                    </span>
                    <span className="font-medium text-foreground">High</span>
                    <span className="font-mono text-muted-foreground text-[10px]">(Score 56–75)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-3 w-3 items-center justify-center rounded-full bg-risk-moderate/20">
                      <span className="h-2 w-2 rounded-full bg-risk-moderate" />
                    </span>
                    <span className="font-medium text-foreground">Moderate</span>
                    <span className="font-mono text-muted-foreground text-[10px]">(Score 31–55)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-3 w-3 items-center justify-center rounded-full bg-risk-low/20">
                      <span className="h-2 w-2 rounded-full bg-risk-low" />
                    </span>
                    <span className="font-medium text-foreground">Low</span>
                    <span className="font-mono text-muted-foreground text-[10px]">(Score 0–30)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* TOP STATES BY AVG RISK (Requirement 7) */}
            <div className="border-t border-border bg-card px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Top states by avg. risk
                </p>
                <span className="text-[11px] text-muted-foreground">
                  Click a state to isolate projects on map
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {topStates.map((s) => {
                  const isSelected = selectedState === s.state;
                  return (
                    <button
                      key={s.state}
                      onClick={() => setSelectedState(isSelected ? null : s.state)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-[11px] transition-colors cursor-pointer',
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-semibold'
                          : 'border-border bg-card hover:bg-muted/40 text-foreground'
                      )}
                    >
                      <span
                        className={cn('h-2 w-2 rounded-full', {
                          'bg-risk-low': s.band === 'low',
                          'bg-risk-moderate': s.band === 'moderate',
                          'bg-risk-high': s.band === 'high',
                          'bg-risk-critical': s.band === 'critical',
                        })}
                      />
                      <span className="font-medium">{s.state}</span>
                      <span className="font-mono text-muted-foreground">{s.avgRisk}</span>
                      <span className="text-muted-foreground">· {RISK_BAND_LABEL[s.band]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* 4. STATE RISK INDEX PANEL (Requirement 6 - 4 cols) */}
          <Card className="lg:col-span-4 flex flex-col border-border bg-card">
            <CardHeader className="border-b border-border/80 pb-3 pt-4 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    State Risk Index
                  </CardTitle>
                  <p className="text-[11px] text-muted-foreground">
                    Aggregated multi-project vulnerability ratings
                  </p>
                </div>
                <span className="rounded-xs border border-border bg-muted/30 px-1.5 py-0.5 font-mono text-[10px] font-bold text-muted-foreground">
                  {stateRiskData.length} STATES
                </span>
              </div>

              {/* Quick Search */}
              <div className="relative mt-2">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search state or project..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-full rounded-sm border border-border bg-muted/20 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-1 p-2 max-h-[580px] overflow-y-auto">
              {[...stateRiskData]
                .sort((a, b) => b.avgRisk - a.avgRisk)
                .map((s) => {
                  const isSelected = selectedState === s.state;
                  return (
                    <div
                      key={s.state}
                      onClick={() => setSelectedState(isSelected ? null : s.state)}
                      className={cn(
                        'flex items-center justify-between rounded-sm px-3 py-2.5 cursor-pointer transition-colors text-xs',
                        isSelected
                          ? 'bg-primary/10 border border-primary/30 font-medium'
                          : 'hover:bg-muted/40 border border-transparent'
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={cn('h-2.5 w-2.5 shrink-0 rounded-full', {
                            'bg-risk-low': s.band === 'low',
                            'bg-risk-moderate': s.band === 'moderate',
                            'bg-risk-high': s.band === 'high',
                            'bg-risk-critical': s.band === 'critical',
                          })}
                        />
                        <span className="truncate font-medium text-foreground">{s.state}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-mono text-muted-foreground text-[11px]">
                          {s.projects} proj
                        </span>
                        <span className="font-mono font-semibold text-foreground">
                          {s.avgRisk}
                        </span>
                        <span
                          className={cn(
                            'w-16 text-right font-mono text-[10px] font-bold uppercase',
                            s.band === 'critical' && 'text-risk-critical',
                            s.band === 'high' && 'text-risk-high',
                            s.band === 'moderate' && 'text-risk-moderate',
                            s.band === 'low' && 'text-risk-low'
                          )}
                        >
                          {RISK_BAND_LABEL[s.band]}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        </div>

        {/* 5. REPRESENTATIVE PROJECT LOCATIONS DIRECTORY */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3 pt-4 px-4 border-b border-border/70">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Mapped Infrastructure Projects ({filteredMarkers.length})
                </CardTitle>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Click any project card to pan marker or navigate to detail dossier
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredMarkers.map(({ project: p }) => {
                const isSelected = selectedProjectId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProjectId(p.id)}
                    className={cn(
                      'flex flex-col justify-between rounded-sm border p-3 cursor-pointer transition-all',
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-2xs'
                        : 'border-border hover:bg-muted/30'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn('h-2 w-2 shrink-0 rounded-full', {
                              'bg-risk-low': p.riskBand === 'low',
                              'bg-risk-moderate': p.riskBand === 'moderate',
                              'bg-risk-high': p.riskBand === 'high',
                              'bg-risk-critical': p.riskBand === 'critical',
                            })}
                          />
                          <span className="font-mono text-[10px] text-muted-foreground uppercase">
                            {p.code}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs font-semibold text-foreground">
                          {p.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {p.district}, {p.state} · {p.sector}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono text-sm font-bold text-foreground">
                          {p.riskScore}
                        </span>
                        <span className="block text-[9px] uppercase font-bold text-muted-foreground">
                          {p.riskBand}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between border-t border-border/50 pt-2 text-[11px]">
                      <span className="font-mono text-muted-foreground">
                        ₹{p.spentCrore.toLocaleString('en-IN')} / ₹{p.budgetCrore.toLocaleString('en-IN')} Cr
                      </span>
                      <Link
                        href={`/projects/${p.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                      >
                        View dossier <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
