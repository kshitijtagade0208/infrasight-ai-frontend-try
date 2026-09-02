'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RiskBadge } from '@/components/risk-badge';
import { EvidenceChip } from '@/components/evidence-chip';
import { projects as fallbackProjects, alerts, earlyWarnings, getProjectById } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { riskBandFromScore } from '@/lib/risk';
import type { Project, ProjectStatus, EvidenceType, RiskBand } from '@/lib/types';

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
  Bot,
  Send,
  User,
  Sparkles,
  ShieldAlert,
  HelpCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  FileText,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Building2,
  CalendarClock,
  Briefcase,
  Search,
  Filter,
  Check,
  ChevronDown,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text?: string;
  timestamp: string;
  isError?: boolean;
  projectReference?: {
    id: string;
    name: string;
    code: string;
    riskScore: number;
    riskBand: RiskBand;
  };
}

function RenderFormattedMarkdown({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <div className="space-y-2 text-[13px] leading-relaxed text-foreground">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        if (trimmed === '---') {
          return <hr key={idx} className="border-border/60 my-2" />;
        }

        if (trimmed.startsWith('### ')) {
          return (
            <h3
              key={idx}
              className="text-sm font-bold text-foreground tracking-tight pt-1.5 pb-0.5 border-b border-border/40"
            >
              {trimmed.replace('### ', '')}
            </h3>
          );
        }

        if (trimmed.startsWith('**') && trimmed.endsWith('**') && !trimmed.includes(':')) {
          return (
            <h4 key={idx} className="text-xs font-bold uppercase tracking-wider text-foreground pt-1">
              {trimmed.replace(/\*\*/g, '')}
            </h4>
          );
        }

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const itemText = trimmed.replace(/^[-*]\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-primary mt-1 text-xs">•</span>
              <span className="flex-1">{renderFormattedInline(itemText)}</span>
            </div>
          );
        }

        if (/^\d+\.\s+/.test(trimmed)) {
          const match = trimmed.match(/^(\d+)\.\s+(.*)$/);
          if (match) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="font-mono text-xs font-semibold text-primary shrink-0">
                  {match[1]}.
                </span>
                <span className="flex-1">{renderFormattedInline(match[2])}</span>
              </div>
            );
          }
        }

        if (trimmed.startsWith('*Notice:') || trimmed.startsWith('Notice:')) {
          return (
            <div
              key={idx}
              className="mt-3 flex items-center gap-1.5 rounded-sm border border-primary/20 bg-primary/5 p-2 text-[11px] text-muted-foreground"
            >
              <Info className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span>
                {trimmed.replace(/\*/g, '')}
              </span>
            </div>
          );
        }

        return <p key={idx}>{renderFormattedInline(trimmed)}</p>;
      })}
    </div>
  );
}

function renderFormattedInline(text: string): React.ReactNode {
  // Replace bold, brackets, and highlight tags
  const parts = text.split(/(\*\*.*?\*\*|\[Reported\]|\[Observed\]|\[AI-interpreted\]|\[Verified\])/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part === '[Reported]') {
      return (
        <span
          key={i}
          className="inline-flex items-center rounded-xs bg-blue-500/10 border border-blue-500/30 px-1 py-0.2 text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 mx-0.5"
        >
          Reported
        </span>
      );
    }

    if (part === '[Observed]') {
      return (
        <span
          key={i}
          className="inline-flex items-center rounded-xs bg-purple-500/10 border border-purple-500/30 px-1 py-0.2 text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400 mx-0.5"
        >
          Observed
        </span>
      );
    }

    if (part === '[AI-interpreted]') {
      return (
        <span
          key={i}
          className="inline-flex items-center rounded-xs bg-amber-500/10 border border-amber-500/30 px-1 py-0.2 text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 mx-0.5"
        >
          AI-interpreted
        </span>
      );
    }

    if (part === '[Verified]') {
      return (
        <span
          key={i}
          className="inline-flex items-center rounded-xs bg-emerald-500/10 border border-emerald-500/30 px-1 py-0.2 text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 mx-0.5"
        >
          Verified
        </span>
      );
    }

    return part;
  });
}

function AIAssistantContent() {
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get('projectId') || 'PRJ-002';

  const [projectsList, setProjectsList] = React.useState<Project[]>(fallbackProjects);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>(initialProjectId);

  React.useEffect(() => {
    let active = true;
    async function loadAssistantProjects() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`);
        if (!res.ok) return;
        const data = await res.json();
        if (active && Array.isArray(data) && data.length > 0) {
          setProjectsList(data.map(mapBackendProject));
        }
      } catch (err) {
        console.error('Error loading projects for AI assistant:', err);
      }
    }
    loadAssistantProjects();
    return () => {
      active = false;
    };
  }, []);

  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: 'msg-initial',
      sender: 'assistant',
      text: `### Welcome to InfraSight AI Risk Decision Support

Select any monitored infrastructure project to generate a real-time risk assessment covering:
- **Overall Risk Profile** & statutory classifications
- **Key Risk Drivers** (derived from telemetry and site metrics)
- **Reported vs. Observed Progress** (contractor claims vs satellite estimates)
- **Schedule Latency & Capex Overrun Exposure**
- **Supporting Evidence Classification** ([Reported], [Observed], [AI-interpreted], [Verified])
- **Recommended Supervisory Officer Actions** (requiring human authorization)

Click **"Run Dynamic Risk Assessment"** or choose any quick query below to begin.`,
      timestamp: '24 Aug 2026, 09:00 IST',
    },
  ]);

  const [inputQuery, setInputQuery] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const chatBottomRef = React.useRef<HTMLDivElement>(null);

  const selectedProject = React.useMemo(() => {
    if (selectedProjectId === 'ALL') return undefined;
    return (
      projectsList.find(
        (p) =>
          p.id === selectedProjectId ||
          p.code === selectedProjectId ||
          p.id.toLowerCase() === selectedProjectId.toLowerCase()
      ) ||
      getProjectById(selectedProjectId) ||
      projectsList[0]
    );
  }, [projectsList, selectedProjectId]);

  React.useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Sync project when URL query param changes
  React.useEffect(() => {
    const urlProjectId = searchParams.get('projectId');
    if (urlProjectId && urlProjectId !== selectedProjectId) {
      setSelectedProjectId(urlProjectId);
    }
  }, [searchParams, selectedProjectId]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim() || isTyping) return;

    const now = new Date();
    const timeString = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const timestamp = `24 Aug 2026, ${timeString} IST`;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputQuery('');
    setIsTyping(true);
    setErrorMessage(null);

    const historyPayload = newMessages
      .filter((m) => m.text && !m.isError)
      .map((m) => ({
        role: m.sender === 'assistant' ? 'assistant' : 'user',
        text: m.text,
      }));

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: query,
          projectId: selectedProject?.id,
          projectContext: selectedProject,
          history: historyPayload,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || `Server responded with status code ${res.status}`);
      }

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: data.text,
        timestamp: `24 Aug 2026, ${new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })} IST`,
        projectReference: selectedProject
          ? {
              id: selectedProject.id,
              name: selectedProject.name,
              code: selectedProject.code,
              riskScore: selectedProject.riskScore,
              riskBand: selectedProject.riskBand,
            }
          : undefined,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Error calling AI assistant API:', err);
      const errMsg = err?.message || 'Failed to communicate with AI Assistant service.';
      setErrorMessage(errMsg);

      const errorAssistantMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `Analysis Request Notice: ${errMsg}\n\nPlease check service connectivity or verify environment configuration.`,
        timestamp: `24 Aug 2026, ${new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })} IST`,
        isError: true,
      };

      setMessages((prev) => [...prev, errorAssistantMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleTriggerFullAssessment = () => {
    if (selectedProject) {
      handleSendMessage(
        `Provide a comprehensive risk assessment for ${selectedProject.name} (${selectedProject.code}), analyzing overall risk, key drivers, reported vs observed progress, schedule/cost exposure, evidence classification, and recommended supervisory officer actions.`
      );
    } else {
      handleSendMessage(
        'Provide a concise risk assessment of the national infrastructure portfolio, top risk drivers, severe delays, and active alerts.'
      );
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'msg-initial',
        sender: 'assistant',
        text: `### Session Reset

Active Project Context: **${
          selectedProject ? `${selectedProject.name} (${selectedProject.code})` : 'All Projects (Portfolio)'
        }**.

How can I assist with infrastructure risk analysis, progress variance, or supervisory decision support?`,
        timestamp: `24 Aug 2026, ${new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })} IST`,
      },
    ]);
    setErrorMessage(null);
  };

  // Dynamic quick prompt questions adapted to active project
  const dynamicQuickPrompts = React.useMemo(() => {
    if (!selectedProject) {
      return [
        'What are the top risk drivers across the portfolio?',
        'Which projects have the highest schedule delays?',
        'Explain the latest active telemetry alerts.',
        'Explain the 4-tier evidence classification taxonomy.',
      ];
    }

    return [
      `Analyze complete risk profile for ${selectedProject.code}`,
      `Compare reported vs observed progress for ${selectedProject.name}`,
      `What are the critical-path delays & cost exposure for ${selectedProject.code}?`,
      `Explain active alerts & early warnings on ${selectedProject.code}`,
      `What supervisory officer actions are recommended for ${selectedProject.code}?`,
    ];
  }, [selectedProject]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="InfraSight AI Reasoning Assistant"
        description="Dynamic decision support & multi-dimensional risk synthesis across all monitored national infrastructure projects."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'AI Assistant' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetChat}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset Session
            </Button>
          </div>
        }
      />

      <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-4 max-w-5xl mx-auto w-full">
        {/* 2. DYNAMIC PROJECT SELECTOR & TELEMETRY CONTEXT BAR */}
        <Card className="border-border bg-card shadow-2xs overflow-hidden">
          <div className="p-3 sm:p-4 bg-muted/20 border-b border-border/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary/10 text-primary shrink-0">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <label
                    htmlFor="project-selector"
                    className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block"
                  >
                    Active Project Context for AI Analysis
                  </label>
                  <span className="text-xs font-semibold text-foreground">
                    Select any project to evaluate its live telemetry & risk profile
                  </span>
                </div>
              </div>

              {/* Project Dropdown Selector */}
              <div className="flex items-center gap-2">
                <select
                  id="project-selector"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="h-9 rounded-sm border border-border bg-card px-3 py-1 text-xs font-medium text-foreground shadow-2xs focus:border-primary focus:outline-none max-w-[280px] sm:max-w-[340px]"
                >
                  <option value="ALL">🌐 All Projects (Portfolio Summary)</option>
                  <optgroup label="Monitored Infrastructure Projects">
                    {projectsList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.name} ({p.riskScore}/100 Risk)
                      </option>
                    ))}
                  </optgroup>
                </select>

                <Button
                  size="sm"
                  onClick={handleTriggerFullAssessment}
                  disabled={isTyping}
                  className="gap-1.5 text-xs font-semibold shrink-0"
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
                  <span>Run Risk Assessment</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Active Project Live Telemetry Strip */}
          {selectedProject && (
            <div className="px-4 py-2.5 bg-card flex flex-wrap items-center justify-between gap-3 text-xs border-t border-border/40">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono font-bold text-foreground">
                  {selectedProject.code}
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="font-medium text-foreground">{selectedProject.name}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground text-[11px]">
                  {selectedProject.district}, {selectedProject.state} ({selectedProject.sector})
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-muted-foreground">Progress:</span>
                  <span className="font-mono font-semibold text-foreground">
                    {selectedProject.progressPercent}% [Reported]
                  </span>
                  <span className="text-muted-foreground">/</span>
                  <span className="font-mono font-semibold text-risk-high">
                    {selectedProject.visualProgressEstimate ?? selectedProject.progressPercent}% [Observed]
                  </span>
                </div>

                <RiskBadge band={selectedProject.riskBand} score={selectedProject.riskScore} />

                <Link href={`/projects/${selectedProject.id}`}>
                  <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[11px] gap-1 text-primary">
                    View Project <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Card>

        {/* 3. CHAT STREAM CONTAINER */}
        <Card className="flex-1 flex flex-col border-border bg-card shadow-2xs overflow-hidden min-h-[580px]">
          {/* Top Assistant Status Bar */}
          <div className="flex items-center justify-between border-b border-border/80 bg-muted/20 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-primary/10 text-primary">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-foreground">
                  InfraSight Reasoning Engine
                </span>
                <span className="ml-2 font-mono text-[10px] text-muted-foreground">
                  v2.5 · Dynamic Project Grounding
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-risk-low" />
              <span className="text-[11px] font-medium text-muted-foreground">
                {selectedProject ? `Bound to ${selectedProject.code}` : 'Portfolio Context'}
              </span>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 max-h-[600px]">
            {messages.map((msg) => {
              const isAssistant = msg.sender === 'assistant';

              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex items-start gap-3 text-xs',
                    isAssistant ? 'justify-start' : 'justify-end'
                  )}
                >
                  {isAssistant && (
                    <div
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border mt-0.5',
                        msg.isError
                          ? 'border-destructive/30 bg-destructive/10 text-destructive'
                          : 'border-border bg-primary/10 text-primary'
                      )}
                    >
                      {msg.isError ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                  )}

                  <div
                    className={cn(
                      'max-w-3xl rounded-sm p-4 space-y-3',
                      isAssistant
                        ? msg.isError
                          ? 'border border-destructive/40 bg-destructive/5 text-foreground'
                          : 'border border-border bg-muted/30 text-foreground'
                        : 'bg-primary text-primary-foreground font-medium'
                    )}
                  >
                    {/* Message Header */}
                    <div className="flex items-center justify-between gap-4 border-b border-border/50 pb-2 text-[10px]">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'font-semibold uppercase tracking-wider',
                            isAssistant
                              ? msg.isError
                                ? 'text-destructive font-bold'
                                : 'text-muted-foreground'
                              : 'text-primary-foreground/80'
                          )}
                        >
                          {isAssistant
                            ? msg.isError
                              ? 'System Notice / Error'
                              : 'InfraSight AI Assistant'
                            : 'Monitoring Officer'}
                        </span>
                        {msg.projectReference && (
                          <span className="font-mono text-[10px] text-muted-foreground rounded-xs bg-muted/60 px-1 py-0.2">
                            {msg.projectReference.code}
                          </span>
                        )}
                      </div>
                      <span
                        className={cn(
                          'font-mono',
                          isAssistant
                            ? 'text-muted-foreground'
                            : 'text-primary-foreground/70'
                        )}
                      >
                        {msg.timestamp}
                      </span>
                    </div>

                    {/* Rich Formatted Markdown Content */}
                    {msg.text && (
                      <div className="leading-relaxed">
                        {isAssistant ? (
                          <RenderFormattedMarkdown content={msg.text} />
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        )}
                      </div>
                    )}

                    {/* Project link shortcut if assistant analyzed a specific project */}
                    {isAssistant && msg.projectReference && (
                      <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span>Target Project:</span>
                          <span className="font-semibold text-foreground">
                            {msg.projectReference.name}
                          </span>
                        </div>
                        <Link href={`/projects/${msg.projectReference.id}`}>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                            Open Project Dossier <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>

                  {!isAssistant && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-border bg-muted text-muted-foreground mt-0.5">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-3 text-xs">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-border bg-primary/10 text-primary">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 rounded-sm border border-border bg-muted/30 px-3 py-2 text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span className="text-xs">
                    Synthesizing multi-source telemetry, progress divergence & risk factors...
                  </span>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* 4. ADAPTIVE QUICK QUERY PROMPTS */}
          <div className="border-t border-border/80 bg-muted/10 px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Quick Prompts {selectedProject ? `for ${selectedProject.code}` : '(Portfolio)'}
              </p>
              <span className="text-[10px] text-muted-foreground">Click to execute query</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {dynamicQuickPrompts.map((question) => (
                <button
                  key={question}
                  onClick={() => handleSendMessage(question)}
                  disabled={isTyping}
                  className="inline-flex items-center gap-1 rounded-sm border border-border bg-card px-2.5 py-1 text-xs text-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary cursor-pointer text-left disabled:opacity-50"
                >
                  <Sparkles className="h-3 w-3 text-primary shrink-0" />
                  <span>{question}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 5. CHAT INPUT BAR & DISCLAIMER */}
          <div className="border-t border-border bg-card p-3 sm:p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <Input
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder={
                  selectedProject
                    ? `Ask about ${selectedProject.name} (${selectedProject.code})...`
                    : 'Ask about any project, risk drivers, schedule delays, or alerts...'
                }
                className="h-10 text-xs sm:text-sm bg-muted/20"
                disabled={isTyping}
              />
              <Button
                type="submit"
                disabled={!inputQuery.trim() || isTyping}
                className="h-10 px-4 gap-1.5 text-xs font-semibold shrink-0"
              >
                <span>Send</span>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>

            {/* STATUTORY MANDATORY DISCLAIMER */}
            <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <Info className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span>
                Notice: AI-generated analysis is decision support. Officer actions require human authorization.
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function AIAssistantPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 animate-spin text-primary" />
            <span>Loading AI Assistant...</span>
          </div>
        </div>
      }
    >
      <AIAssistantContent />
    </React.Suspense>
  );
}
