'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RiskBadge } from '@/components/risk-badge';
import { EvidenceChip } from '@/components/evidence-chip';
import { projects, alerts, getProjectById } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import type { EvidenceType, RiskBand } from '@/lib/types';
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
} from 'lucide-react';

interface StructuredRiskData {
  projectName: string;
  projectCode: string;
  projectId: string;
  overallRiskScore: number;
  overallRiskBand: RiskBand;
  scheduleDelay: string;
  reportedProgress: number;
  visualEstimate: number;
  variance: number;
  costOverrunProbability: number;
  evidence: EvidenceType[];
  drivers: string[];
  recommendedActions: string[];
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text?: string;
  timestamp: string;
  structuredData?: StructuredRiskData;
  evidenceExplanation?: boolean;
  activeAlertExplanation?: boolean;
  severeDelaysList?: Array<{
    name: string;
    id: string;
    delay: string;
    score: number;
    band: RiskBand;
    variance: string;
  }>;
  topDriversList?: Array<{
    title: string;
    category: string;
    severity: string;
    evidence: EvidenceType[];
    description: string;
  }>;
}

const EXAMPLE_QUESTIONS = [
  'Why is Ken-Betwa River Interlinking rated Critical?',
  'What are the top risk drivers?',
  'Which projects have severe schedule delays?',
  'Explain the latest active alert.',
  'What evidence supports the current risk assessment?',
];

export default function AIAssistantPage() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: 'msg-initial',
      sender: 'assistant',
      text: 'Hello. I can help analyze project risk, alerts, evidence, delays, and recommended officer actions.',
      timestamp: '24 Aug 2026, 09:00 IST',
    },
  ]);

  const [inputQuery, setInputQuery] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const chatBottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const generateResponse = (query: string): ChatMessage => {
    const q = query.toLowerCase().trim();
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const timestamp = `24 Aug 2026, ${timeString} IST`;

    // 1. Specific Ken-Betwa River Interlinking prompt (Requirement 7)
    if (
      q.includes('ken-betwa') ||
      q.includes('ken betwa') ||
      q.includes('kbrl') ||
      (q.includes('why') && q.includes('critical'))
    ) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        timestamp,
        text: 'Here is the comprehensive risk synthesis for Ken-Betwa River Interlinking (KBRL-01), based on active telemetry and milestone logs:',
        structuredData: {
          projectName: 'Ken-Betwa River Interlinking Project (Phase-I & II)',
          projectCode: 'KBRL-01',
          projectId: 'PRJ-002',
          overallRiskScore: 81,
          overallRiskBand: 'critical',
          scheduleDelay: '248 days / 6.4 months',
          reportedProgress: 28,
          visualEstimate: 16,
          variance: -12,
          costOverrunProbability: 72,
          evidence: ['reported', 'observed', 'ai-interpreted'],
          drivers: [
            'Progress-Evidence Divergence: Contractor/billing reported progress stands at 28%, whereas visual and observational satellite/sensor progress is estimated at only 16% (-12 percentage points variance).',
            'Milestone Slippage: Critical-path Daudhan Dam foundation excavation and barrage embankment are running 248 days (6.4 months) behind baseline schedule.',
            'Declining Site Activity: Optical sensor telemetry indicates a 38% reduction in active heavy earthmoving machinery on site without prior scheduled stoppage.',
            'Capital Run-Rate Discrepancy: Capital expenditure disbursements pace at 1.4× physical progress rate, exposing the project to an estimated 72% probability of substantial cost escalation.',
          ],
          recommendedActions: [
            'Verify Site Progress: Dispatch independent regional monitoring engineer for physical ground audit.',
            'Request Updated Report: Issue formal notice requiring updated monthly physical progress report within 5 days.',
            'Schedule Technical Inspection: Review contractor recovery schedule and equipment mobilization baseline.',
          ],
        },
      };
    }

    // 2. Top Risk Drivers (Requirement 3)
    if (q.includes('top risk driver') || q.includes('driver') || q.includes('risk factors')) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        timestamp,
        text: 'Across the monitored infrastructure portfolio, our multi-source telemetry identifies the following top primary risk drivers:',
        topDriversList: [
          {
            title: 'Progress-Evidence Discrepancy',
            category: 'Integrity & Verification',
            severity: 'Critical',
            evidence: ['reported', 'observed', 'ai-interpreted'],
            description:
              'Significant gaps detected between contractor self-reported physical milestones and independent optical/SAR satellite observations (average divergence of -8.4%).',
          },
          {
            title: 'Critical-Path Milestone Slippage',
            category: 'Schedule Risk',
            severity: 'Critical',
            evidence: ['observed', 'predicted'],
            description:
              'Major structural foundations, tunneling headings, and embankment packages showing unmitigated delays exceeding 120+ days.',
          },
          {
            title: 'Equipment & Activity Density Decline',
            category: 'Operational Telemetry',
            severity: 'High',
            evidence: ['observed', 'ai-interpreted'],
            description:
              'Machinery motion tracking and thermal activity density drops on active work packages during peak construction windows.',
          },
          {
            title: 'Capital Expenditure Run-Rate Disconnect',
            category: 'Financial Risk',
            severity: 'High',
            evidence: ['reported', 'predicted'],
            description:
              'Front-loaded financial disbursements pacing ahead of verifiable physical deliverables, creating 65%+ probability of budget overrun.',
          },
          {
            title: 'Monsoon Hydrological & Seasonal Exposure',
            category: 'Environmental Model',
            severity: 'Moderate',
            evidence: ['predicted', 'verified'],
            description:
              'Historical contractor seasonal deferrals in riverine and flood-prone corridors (e.g., Brahmaputra, Ken-Betwa, Teesta).',
          },
        ],
      };
    }

    // 3. Severe schedule delays (Requirement 3)
    if (q.includes('delay') || q.includes('schedule') || q.includes('slippage')) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        timestamp,
        text: 'The following critical-priority infrastructure projects exhibit the most severe schedule slippages against baseline milestones:',
        severeDelaysList: [
          {
            name: 'Ken-Betwa River Interlinking',
            id: 'PRJ-002',
            delay: '248 days (6.4 months)',
            score: 81,
            band: 'critical',
            variance: '-12% progress divergence',
          },
          {
            name: 'Polavaram Headworks Dam & Spillway',
            id: 'PRJ-014',
            delay: '210 days (5.5 months)',
            score: 79,
            band: 'critical',
            variance: '-9% progress divergence',
          },
          {
            name: 'Brahmaputra Flood Embankment Package-IV',
            id: 'PRJ-006',
            delay: '185 days (4.8 months)',
            score: 78,
            band: 'critical',
            variance: '-11% progress divergence',
          },
          {
            name: 'Kolkata East-West Metro Corridor',
            id: 'PRJ-011',
            delay: '160 days (4.2 months)',
            score: 73,
            band: 'high',
            variance: '-7% progress divergence',
          },
          {
            name: 'Zojila Strategic Tunnel Package-II',
            id: 'PRJ-015',
            delay: '140 days (3.6 months)',
            score: 69,
            band: 'high',
            variance: '-6% progress divergence',
          },
        ],
      };
    }

    // 4. Latest active alert explanation (Requirement 3)
    if (q.includes('alert') || q.includes('warning') || q.includes('latest alert')) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        timestamp,
        text: 'Here is the detailed breakdown of the highest-priority active alert across the national network:',
        activeAlertExplanation: true,
      };
    }

    // 5. Evidence taxonomy & supporting evidence (Requirement 3 & 8)
    if (
      q.includes('evidence') ||
      q.includes('distinguish') ||
      q.includes('taxonomy') ||
      q.includes('support')
    ) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        timestamp,
        text: 'InfraSight AI employs a strict 5-tier Evidence Classification Protocol to ensure rigorous separation between official claims and algorithmic projections:',
        evidenceExplanation: true,
      };
    }

    // General fallback contextual response
    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      timestamp,
      text: `Based on current telemetry across ${projects.length} monitored national projects, I can provide risk syntheses, evidence verification breakdowns, and recommended supervisory officer actions. 

You can ask about specific projects (e.g., "Ken-Betwa River Interlinking", "Mumbai Coastal Road", "Teesta Stage IV"), query top portfolio risk drivers, or inspect evidence tiers.`,
    };
  };

  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    // Mock thinking delay
    setTimeout(() => {
      const assistantMsg = generateResponse(query);
      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 450);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'msg-initial',
        sender: 'assistant',
        text: 'Hello. I can help analyze project risk, alerts, evidence, delays, and recommended officer actions.',
        timestamp: '24 Aug 2026, 09:00 IST',
      },
    ]);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="InfraSight AI Assistant"
        description="Ask questions about projects, risks, alerts, evidence, and infrastructure status."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'AI Assistant' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetChat}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset Chat
            </Button>
          </div>
        }
      />

      <div className="flex flex-1 flex-col p-6 space-y-4 max-w-5xl mx-auto w-full">
        {/* 2. CHAT STREAM CONTAINER */}
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
                  v2.4 · Telemetry Sync Active
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-risk-low" />
              <span className="text-[11px] font-medium text-muted-foreground">
                Operational Support Model
              </span>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
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
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-border bg-primary/10 text-primary mt-0.5">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={cn(
                      'max-w-2xl rounded-sm p-4 space-y-3',
                      isAssistant
                        ? 'border border-border bg-muted/30 text-foreground'
                        : 'bg-primary text-primary-foreground font-medium'
                    )}
                  >
                    {/* Message Header */}
                    <div className="flex items-center justify-between gap-4 border-b border-border/50 pb-2 text-[10px]">
                      <span className={cn('font-semibold uppercase tracking-wider', isAssistant ? 'text-muted-foreground' : 'text-primary-foreground/80')}>
                        {isAssistant ? 'InfraSight AI Assistant' : 'Monitoring Officer'}
                      </span>
                      <span className={cn('font-mono', isAssistant ? 'text-muted-foreground' : 'text-primary-foreground/70')}>
                        {msg.timestamp}
                      </span>
                    </div>

                    {/* Regular Text Body */}
                    {msg.text && (
                      <p className="leading-relaxed whitespace-pre-line text-[13px]">
                        {msg.text}
                      </p>
                    )}

                    {/* 7. STRUCTURED RISK SYNTHESIS CARD (E.g. Ken-Betwa River Interlinking) */}
                    {msg.structuredData && (
                      <div className="space-y-3 pt-1">
                        {/* Summary Metrics Bar */}
                        <div className="rounded-sm border border-border bg-card p-3 shadow-2xs space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
                            <div>
                              <span className="font-mono text-[10px] uppercase text-muted-foreground">
                                {msg.structuredData.projectCode} · Water Resources
                              </span>
                              <h4 className="text-sm font-bold text-foreground">
                                {msg.structuredData.projectName}
                              </h4>
                            </div>
                            <div className="flex items-center gap-2">
                              <RiskBadge
                                band={msg.structuredData.overallRiskBand}
                                score={msg.structuredData.overallRiskScore}
                              />
                            </div>
                          </div>

                          {/* 7. Structured Data Metrics Grid */}
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 text-xs">
                            <div className="rounded-xs bg-muted/40 p-2">
                              <span className="text-[10px] uppercase text-muted-foreground block">
                                Overall Risk
                              </span>
                              <span className="font-mono font-bold text-risk-critical text-sm">
                                {msg.structuredData.overallRiskScore} / 100 ({msg.structuredData.overallRiskBand.toUpperCase()})
                              </span>
                            </div>

                            <div className="rounded-xs bg-muted/40 p-2">
                              <span className="text-[10px] uppercase text-muted-foreground block">
                                Schedule Delay
                              </span>
                              <span className="font-mono font-bold text-risk-critical text-sm">
                                {msg.structuredData.scheduleDelay}
                              </span>
                            </div>

                            <div className="rounded-xs bg-muted/40 p-2">
                              <span className="text-[10px] uppercase text-muted-foreground block">
                                Cost Overrun Exposure
                              </span>
                              <span className="font-mono font-bold text-risk-high text-sm">
                                {msg.structuredData.costOverrunProbability}% Probability
                              </span>
                            </div>

                            <div className="rounded-xs bg-muted/40 p-2">
                              <span className="text-[10px] uppercase text-muted-foreground block">
                                Reported Physical Progress
                              </span>
                              <span className="font-mono font-semibold text-foreground">
                                {msg.structuredData.reportedProgress}% (Billing log)
                              </span>
                            </div>

                            <div className="rounded-xs bg-muted/40 p-2">
                              <span className="text-[10px] uppercase text-muted-foreground block">
                                Visual Progress Estimate
                              </span>
                              <span className="font-mono font-semibold text-risk-high">
                                {msg.structuredData.visualEstimate}% (Observational)
                              </span>
                            </div>

                            <div className="rounded-xs bg-muted/40 p-2">
                              <span className="text-[10px] uppercase text-muted-foreground block">
                                Progress Variance
                              </span>
                              <span className="font-mono font-bold text-risk-critical">
                                {msg.structuredData.variance} percentage points
                              </span>
                            </div>
                          </div>

                          {/* Key Evidence Chips */}
                          <div className="flex items-center gap-2 pt-1 border-t border-border/50 text-[11px]">
                            <span className="text-muted-foreground font-medium">Key Evidence:</span>
                            <div className="flex flex-wrap gap-1">
                              {msg.structuredData.evidence.map((e) => (
                                <EvidenceChip key={e} type={e} />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Top Supporting Drivers */}
                        <div className="space-y-1.5 rounded-sm border border-border/80 bg-card p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Decomposed Risk Drivers:
                          </p>
                          <ul className="space-y-1.5 text-xs text-foreground list-disc pl-4">
                            {msg.structuredData.drivers.map((d, i) => (
                              <li key={i} className="leading-relaxed">
                                {d}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Recommended Officer Actions */}
                        <div className="space-y-1.5 rounded-sm border border-primary/30 bg-primary/5 p-3">
                          <div className="flex items-center gap-1.5 text-primary">
                            <ShieldCheck className="h-4 w-4" />
                            <p className="text-[11px] font-bold uppercase tracking-wider">
                              Recommended Officer Actions (Authorization Required):
                            </p>
                          </div>
                          <ul className="space-y-1 text-xs text-foreground list-disc pl-4">
                            {msg.structuredData.recommendedActions.map((act, i) => (
                              <li key={i} className="leading-relaxed">
                                {act}
                              </li>
                            ))}
                          </ul>
                          <div className="pt-2">
                            <Link href={`/projects/${msg.structuredData.projectId}`}>
                              <Button size="sm" className="gap-1.5 text-xs font-semibold">
                                Open Ken-Betwa Risk Dossier
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 8. EVIDENCE CLASSIFICATION PROTOCOL BREAKDOWN */}
                    {msg.evidenceExplanation && (
                      <div className="space-y-2 pt-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {/* 1. Reported */}
                          <div className="rounded-sm border border-border bg-card p-2.5">
                            <div className="flex items-center justify-between">
                              <EvidenceChip type="reported" />
                              <span className="font-mono text-[10px] text-muted-foreground">Tier 1</span>
                            </div>
                            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                              <strong className="text-foreground">Reported:</strong> Official contractor billing logs, agency monthly progress submissions, and claimed expenditure filings.
                            </p>
                          </div>

                          {/* 2. Observed */}
                          <div className="rounded-sm border border-border bg-card p-2.5">
                            <div className="flex items-center justify-between">
                              <EvidenceChip type="observed" />
                              <span className="font-mono text-[10px] text-muted-foreground">Tier 2</span>
                            </div>
                            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                              <strong className="text-foreground">Observed:</strong> Multi-spectral optical satellite imagery, synthetic aperture radar (SAR), and on-site CCTV visual telemetry.
                            </p>
                          </div>

                          {/* 3. AI-interpreted */}
                          <div className="rounded-sm border border-border bg-card p-2.5">
                            <div className="flex items-center justify-between">
                              <EvidenceChip type="ai-interpreted" />
                              <span className="font-mono text-[10px] text-muted-foreground">Tier 3</span>
                            </div>
                            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                              <strong className="text-foreground">AI-interpreted:</strong> Algorithmic machine learning models estimating variance between reported claims and direct sensor telemetry.
                            </p>
                          </div>

                          {/* 4. Verified */}
                          <div className="rounded-sm border border-border bg-card p-2.5">
                            <div className="flex items-center justify-between">
                              <EvidenceChip type="verified" />
                              <span className="font-mono text-[10px] text-muted-foreground">Tier 4</span>
                            </div>
                            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                              <strong className="text-foreground">Verified:</strong> Formal ground inspection reports and audit sign-offs conducted by certified government monitoring officers.
                            </p>
                          </div>
                        </div>

                        <div className="rounded-xs border border-risk-high/30 bg-risk-high/10 p-2.5 text-[11px] leading-relaxed text-muted-foreground">
                          <strong className="font-semibold text-foreground">Integrity Principle:</strong> AI-interpreted and predicted data are strictly treated as advisory risk signals to guide human officer scrutiny, not legal declarations of non-compliance.
                        </div>
                      </div>
                    )}

                    {/* TOP DRIVERS LIST */}
                    {msg.topDriversList && (
                      <div className="space-y-2 pt-1">
                        {msg.topDriversList.map((driver, idx) => (
                          <div key={idx} className="rounded-sm border border-border bg-card p-2.5 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-foreground text-xs">{driver.title}</span>
                              <div className="flex items-center gap-1">
                                {driver.evidence.map((e) => (
                                  <EvidenceChip key={e} type={e} />
                                ))}
                              </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              {driver.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* SEVERE DELAYS LIST */}
                    {msg.severeDelaysList && (
                      <div className="space-y-2 pt-1">
                        {msg.severeDelaysList.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between rounded-sm border border-border bg-card p-2.5"
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[10px] text-muted-foreground uppercase">{p.id}</span>
                                <span className="font-semibold text-foreground text-xs">{p.name}</span>
                              </div>
                              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                                <span className="text-risk-critical font-medium">Delay: {p.delay}</span>
                                <span>·</span>
                                <span>{p.variance}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <RiskBadge band={p.band} score={p.score} />
                              <Link href={`/projects/${p.id}`}>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ACTIVE ALERT BREAKDOWN */}
                    {msg.activeAlertExplanation && (
                      <div className="rounded-sm border border-border bg-card p-3 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 items-center rounded-xs bg-risk-critical/15 px-1.5 font-mono text-[10px] font-bold text-risk-critical">
                              CRITICAL ALERT · ALT-1045
                            </span>
                            <span className="font-semibold text-foreground text-xs">
                              Ken-Betwa River Interlinking
                            </span>
                          </div>
                          <span className="font-mono text-[10px] text-muted-foreground">Logged 6h ago</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          <strong className="text-foreground">Title:</strong> Progress-evidence divergence detected across active work fronts.
                          <br />
                          <strong className="text-foreground">Description:</strong> Optical satellite passes and machinery movement sensors indicate slower physical rate than self-reported monthly billing log. Human site verification recommended.
                        </p>
                        <div className="flex items-center justify-between border-t border-border/60 pt-2 text-[11px]">
                          <div className="flex items-center gap-1">
                            <EvidenceChip type="observed" />
                            <EvidenceChip type="ai-interpreted" />
                            <EvidenceChip type="reported" />
                          </div>
                          <Link href="/projects/PRJ-002">
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                              Review Alert in Project <ArrowRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
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
                <div className="flex items-center gap-1.5 rounded-sm border border-border bg-muted/30 px-3 py-2 text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span className="text-xs">Analyzing telemetry logs & evidence signatures...</span>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* 3. EXAMPLE QUESTION CARDS (Requirement 3) */}
          <div className="border-t border-border/80 bg-muted/10 px-4 py-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Example Queries / Quick Prompts
            </p>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLE_QUESTIONS.map((question) => (
                <button
                  key={question}
                  onClick={() => handleSendMessage(question)}
                  className="inline-flex items-center gap-1 rounded-sm border border-border bg-card px-2.5 py-1 text-xs text-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary cursor-pointer text-left"
                >
                  <Sparkles className="h-3 w-3 text-primary shrink-0" />
                  <span>{question}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4 & 5. CHAT INPUT BAR (Requirement 4 & 5) */}
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
                placeholder="Ask InfraSight AI..."
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

            {/* 9. STATUTORY DISCLAIMER (Requirement 9) */}
            <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <Info className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span>
                AI-generated analysis is decision support. Officer actions require human authorization.
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
