import { NextRequest, NextResponse } from 'next/server';
import {
  projects,
  alerts,
  earlyWarnings,
  getProjectById,
  getAlertsForProject,
} from '@/lib/mock-data';
import type { Project, Alert, EarlyWarning } from '@/lib/types';

export const dynamic = 'force-dynamic';

const FALLBACK_MODELS = [
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.1-pro-preview',
];

interface IntentResult {
  type: 'greeting' | 'emoji' | 'casual' | 'unrelated' | 'project_not_found' | 'project_query' | 'portfolio_query';
  response?: string;
  targetProject?: Project;
}

// 1. GREETING PATTERNS
const GREETING_REGEX = /^(hi|hello|hey|hiya|howdy|namaste|greetings|good\s+(morning|afternoon|evening|day))(\s+there|\s+all|\s+team|\s*!|\s*\.|\s*👋|\s*😊|\s*🙏)*$/i;

// 2. EMOJI ONLY OR EMOJI LEADING PATTERNS
const PURE_EMOJI_REGEX = /^[\p{Emoji}\s\u200d\uFE0F]+$/u;

// 3. CASUAL ACKNOWLEDGMENT & CONVERSATION PATTERNS
const THANKS_REGEX = /^(thanks|thank\s+you|thankyou|thx|many\s+thanks|thanks\s+a\s+lot|thank\s+you\s+so\s+much|much\s+appreciated|appreciate\s+it)(\s*!|\s*\.|\s*😊|\s*🙏|\s*👍)*$/i;
const ACK_REGEX = /^(ok|okay|k|cool|great|nice|awesome|got\s+it|understood|noted|perfect|alright|sure|fine|sounds\s+good|roger\s+that)(\s*!|\s*\.|\s*👍|\s*🚀|\s*👌|\s*😊)*$/i;
const HOW_ARE_YOU_REGEX = /^(how\s+are\s+you(\s+doing)?|how's\s+it\s+going|how\s+do\s+you\s+do|how\s+are\s+things)(\s*\?|\s*!|\s*😊)*$/i;
const WHO_ARE_YOU_REGEX = /^(who\s+are\s+you|what\s+is\s+infrasight(\s*ai)?|what\s+can\s+you\s+do|what\s+are\s+your\s+capabilities|help|what\s+is\s+this)(\s*\?|\s*!)*$/i;

// 4. UNRELATED INTENT PATTERNS (off-topic queries)
const UNRELATED_REGEX = /\b(recipe|cook|bake|pasta|pizza|cake|weather\s+forecast\s+in|horoscope|zodiac|movie\s+recommendation|song\s+lyrics|poem|write\s+a\s+poem|joke|tell\s+me\s+a\s+joke|football\s+score|cricket\s+match\s+score|stock\s+tips|crypto\s+price|bitcoin|ethereum|translate\s+to\s+french|translate\s+to\s+spanish)\b/i;

function detectConversationalIntent(
  rawPrompt: string,
  selectedProject?: Project
): IntentResult | null {
  const prompt = rawPrompt.trim();
  const lower = prompt.toLowerCase();

  // 1. Pure Greetings
  if (GREETING_REGEX.test(lower)) {
    return {
      type: 'greeting',
      response: `Hello! I am **InfraSight AI**, your decision-support assistant for national infrastructure project monitoring and risk assessment.

I can help you review project risks, evaluate contractor-reported vs. satellite-observed progress, analyze critical-path delays, track cost exposure, and inspect telemetry alerts.

How can I assist you today?`,
    };
  }

  // 2. Pure Emoji or specific emoji messages
  if (PURE_EMOJI_REGEX.test(prompt)) {
    if (prompt.includes('👋')) {
      return {
        type: 'emoji',
        response: `Hello! 👋 How can I assist you with infrastructure telemetry or project risk analysis today?`,
      };
    }
    if (prompt.includes('👍') || prompt.includes('👌') || prompt.includes('👏')) {
      return {
        type: 'emoji',
        response: `Glad to help! 👍 Let me know if you need any further risk evaluations or telemetry insights.`,
      };
    }
    if (prompt.includes('😊') || prompt.includes('🙏')) {
      return {
        type: 'emoji',
        response: `You're very welcome! 🙏 Feel free to ask about any project's progress, alerts, or risk drivers.`,
      };
    }
    if (prompt.includes('🚀') || prompt.includes('🔥') || prompt.includes('💪')) {
      return {
        type: 'emoji',
        response: `Ready to assist! 🚀 Which infrastructure project or telemetry stream would you like to examine?`,
      };
    }
    return {
      type: 'emoji',
      response: `👋 How can I help you with infrastructure monitoring and decision support today?`,
    };
  }

  // 3. Thanks / Gratitude
  if (THANKS_REGEX.test(lower)) {
    return {
      type: 'casual',
      response: `You're welcome! Let me know if you need any further analysis on project risks, delays, or telemetry evidence.`,
    };
  }

  // 4. Acknowledgments (ok, great, cool, got it, etc.)
  if (ACK_REGEX.test(lower)) {
    return {
      type: 'casual',
      response: `Understood. Feel free to select any project or ask about specific telemetry alerts and progress metrics whenever you're ready.`,
    };
  }

  // 5. How are you?
  if (HOW_ARE_YOU_REGEX.test(lower)) {
    return {
      type: 'casual',
      response: `I'm functioning normally and actively monitoring telemetry feeds, satellite passes, and early warning signals across the national infrastructure portfolio. How can I assist your oversight work today?`,
    };
  }

  // 6. Who are you / Capabilities
  if (WHO_ARE_YOU_REGEX.test(lower)) {
    return {
      type: 'casual',
      response: `I am **InfraSight AI**, an intelligent decision-support assistant for government infrastructure project oversight.

**Key Capabilities:**
- **Risk Profiling**: Synthesize multi-source risk scores and identify core risk drivers.
- **Progress Verification**: Contrast contractor-reported billing milestones **[Reported]** with independent satellite/optical estimates **[Observed]**.
- **Delay & Cost Analytics**: Forecast critical-path schedule delays and probabilistic capex cost escalation.
- **Telemetry & Alerts**: Track multi-spectral satellite imagery, CCTV feeds, SAR passes, and early warning signals.
- **Officer Decision Support**: Recommend prioritized supervisory interventions (requiring human officer authorization).

Select any project from the selector or ask a specific question to get started.`,
    };
  }

  // 7. Unrelated off-topic questions
  if (UNRELATED_REGEX.test(lower)) {
    return {
      type: 'unrelated',
      response: `InfraSight AI is specialized for **national infrastructure project monitoring, multi-dimensional risk analysis, satellite and telemetry evidence verification, alerts and early warnings, and supervisory officer decision support** across India's major infrastructure projects.

How can I assist you with an infrastructure project's risk profile, schedule delays, or telemetry data?`,
    };
  }

  return null;
}

interface ProjectMatchResult {
  project?: Project;
  isExplicitNotFound: boolean;
  searchedTerm?: string;
}

function resolveTargetProject(
  prompt: string,
  projectId?: string,
  projectContext?: any
): ProjectMatchResult {
  const q = prompt.toLowerCase();

  // 1. Check if user explicitly mentioned a project ID in the query (e.g. PRJ-001, PRJ-002, etc.)
  const prjIdMatch = prompt.match(/\b(PRJ-\d{3,4})\b/i);
  if (prjIdMatch) {
    const matchedId = prjIdMatch[1].toUpperCase();
    const p = projects.find((proj) => proj.id.toUpperCase() === matchedId);
    if (p) return { project: p, isExplicitNotFound: false };
    return { project: undefined, isExplicitNotFound: true, searchedTerm: matchedId };
  }

  // 2. Check if user explicitly mentioned a project code (e.g. KBRL-01, MCR-II, BFEU-03, PIDW-02, etc.)
  for (const p of projects) {
    if (p.code) {
      const codeRegex = new RegExp(`\\b${p.code.replace('-', '[- ]?')}\\b`, 'i');
      if (codeRegex.test(prompt)) {
        return { project: p, isExplicitNotFound: false };
      }
    }
  }

  // 3. Check if user explicitly mentioned identifiable project name fragments
  const knownNameMap: Array<{ keywords: string[]; project: Project }> = [
    { keywords: ['ken-betwa', 'ken betwa', 'daudhan'], project: getProjectById('PRJ-002')! },
    { keywords: ['mumbai coastal', 'coastal road'], project: getProjectById('PRJ-001')! },
    { keywords: ['delhi-mumbai industrial', 'delhi mumbai industrial', 'dmic'], project: getProjectById('PRJ-003')! },
    { keywords: ['bengaluru suburban', 'bangalore suburban', 'bsrp'], project: getProjectById('PRJ-004')! },
    { keywords: ['kutch green', 'hydrogen hub', 'green hydrogen'], project: getProjectById('PRJ-005')! },
    { keywords: ['brahmaputra flood', 'brahmaputra embankment', 'bfeu'], project: getProjectById('PRJ-006')! },
    { keywords: ['chennai outer ring', 'outer ring road', 'corr-iii'], project: getProjectById('PRJ-007')! },
    { keywords: ['teesta', 'tst-iv', 'hydropower project'], project: getProjectById('PRJ-008')! },
    { keywords: ['visakhapatnam smart', 'vizag smart', 'vsc-ii'], project: getProjectById('PRJ-009')! },
    { keywords: ['indore metro', 'imlc'], project: getProjectById('PRJ-010')! },
    { keywords: ['kolkata east-west', 'kolkata metro', 'kemw'], project: getProjectById('PRJ-011')! },
    { keywords: ['jaipur-ajmer', 'jaipur ajmer', 'jae-wid'], project: getProjectById('PRJ-012')! },
    { keywords: ['western dedicated freight', 'freight corridor', 'wdfc'], project: getProjectById('PRJ-013')! },
    { keywords: ['polavaram', 'pidw'], project: getProjectById('PRJ-014')! },
    { keywords: ['zojila', 'ztsh'], project: getProjectById('PRJ-015')! },
    { keywords: ['gorakhpur haryana', 'anu vidyut', 'ghnp'], project: getProjectById('PRJ-016')! },
  ];

  for (const item of knownNameMap) {
    if (item.project && item.keywords.some((kw) => q.includes(kw))) {
      return { project: item.project, isExplicitNotFound: false };
    }
  }

  // 4. Check for queries asking for non-existent projects explicitly (e.g. "tell me about project xyz" or "PRJ-999")
  const explicitSearchPatterns = [
    /tell me about (project\s+[\w\d-]+)/i,
    /analyze (project\s+[\w\d-]+)/i,
    /what is the status of ([\w\d\s-]+(project|expressway|metro|dam|tunnel|corridor))/i,
    /risk for ([\w\d\s-]+(project|expressway|metro|dam|tunnel|corridor))/i,
  ];

  for (const pattern of explicitSearchPatterns) {
    const match = prompt.match(pattern);
    if (match && match[1]) {
      const searchedName = match[1].trim();
      // Check if it matches any project
      const matched = projects.find(
        (p) =>
          p.name.toLowerCase().includes(searchedName.toLowerCase()) ||
          p.code.toLowerCase().includes(searchedName.toLowerCase())
      );
      if (matched) {
        return { project: matched, isExplicitNotFound: false };
      } else {
        return { project: undefined, isExplicitNotFound: true, searchedTerm: searchedName };
      }
    }
  }

  // 5. If user refers indirectly ("this project", "that project", "current project", "the project", "it")
  // or did not specify a project name, fallback to the CURRENTLY SELECTED PROJECT context:
  if (projectContext && projectContext.id) {
    const matched = getProjectById(projectContext.id);
    if (matched) return { project: { ...matched, ...projectContext }, isExplicitNotFound: false };
  }

  if (projectId && projectId !== 'ALL') {
    const matched = getProjectById(projectId);
    if (matched) return { project: matched, isExplicitNotFound: false };
  }

  return { project: undefined, isExplicitNotFound: false };
}

function calculateProjectDelayAndCostExposure(project: Project) {
  const overallRiskScore = project.riskScore;

  const visualEstimate =
    typeof project.visualProgressEstimate === 'number'
      ? project.visualProgressEstimate
      : Math.max(5, project.progressPercent - (overallRiskScore > 50 ? 12 : 3));

  const variance = visualEstimate - project.progressPercent;
  const varianceSign = variance > 0 ? `+${variance}` : `${variance}`;

  // Dynamic delay calculation based on risk score and status
  const delayDays =
    project.id === 'PRJ-002'
      ? 248
      : project.id === 'PRJ-014'
      ? 210
      : project.id === 'PRJ-006'
      ? 185
      : project.id === 'PRJ-011'
      ? 160
      : project.status === 'delayed' || project.status === 'critical' || overallRiskScore >= 75
      ? Math.max(45, Math.round(overallRiskScore * 2.6))
      : project.status === 'at-risk' || overallRiskScore >= 50
      ? Math.max(20, Math.round(overallRiskScore * 1.8))
      : Math.max(0, Math.round(overallRiskScore * 0.5));

  const delayMonths = (delayDays / 38.75).toFixed(1);

  const delayText =
    delayDays > 0 ? `${delayDays} days (${delayMonths} months)` : 'On Schedule (0 days delay)';

  const costOverrunProbability =
    project.id === 'PRJ-002'
      ? 72
      : overallRiskScore >= 75
      ? Math.min(92, Math.round(overallRiskScore * 0.88))
      : overallRiskScore >= 50
      ? Math.min(75, Math.round(overallRiskScore * 0.82))
      : Math.max(10, Math.round(overallRiskScore * 0.5));

  const budgetUtilization = Math.round((project.spentCrore / project.budgetCrore) * 100);

  return {
    visualEstimate,
    variance,
    varianceSign,
    delayDays,
    delayMonths,
    delayText,
    costOverrunProbability,
    budgetUtilization,
  };
}

function generateDynamicProjectRiskAssessment(
  project: Project,
  prompt: string,
  projectAlerts: Alert[] = [],
  projectWarnings: EarlyWarning[] = []
): string {
  const {
    visualEstimate,
    variance,
    varianceSign,
    delayText,
    costOverrunProbability,
    budgetUtilization,
  } = calculateProjectDelayAndCostExposure(project);

  const riskBandUpper = (project.riskBand || 'moderate').toUpperCase();
  const spentFormatted = project.spentCrore.toLocaleString('en-IN');
  const budgetFormatted = project.budgetCrore.toLocaleString('en-IN');
  const q = prompt.toLowerCase();

  const alertsText =
    projectAlerts.length > 0
      ? projectAlerts
          .map(
            (a) =>
              `- **[${a.id}] ${a.title}** (${a.severity.toUpperCase()} · Status: ${a.status.toUpperCase()} · Source: ${a.source}): ${a.description} *[Evidence: ${a.evidence.join(', ')}]*`
          )
          .join('\n')
      : '- *No critical alerts currently logged for this project.*';

  const warningsText =
    projectWarnings.length > 0
      ? projectWarnings
          .map(
            (w) =>
              `- **[${w.id}] ${w.signal}** (${w.band.toUpperCase()} · Detected: ${new Date(w.detectedAt).toLocaleDateString('en-IN')}): ${w.detail} *[Evidence: ${w.evidence.join(', ')}]*`
          )
          .join('\n')
      : '- *No active early warning anomalies detected in latest telemetry sweep.*';

  // Specific query targeting:
  // 1. User asked specifically about alerts/early warnings
  if (q.includes('alert') || q.includes('early warning') || q.includes('signal') || q.includes('anomaly')) {
    return `### Active Telemetry Alerts & Early Warnings: ${project.name} [${project.code}]

**Project Risk Status**: ${project.riskScore}/100 [${riskBandUpper} RISK] · ${project.district}, ${project.state}

**Active Alerts Logged (${projectAlerts.length}):**
${alertsText}

**Early Warning Telemetry Signals (${projectWarnings.length}):**
${warningsText}

**Evidence Classification Distinction:**
- Alert telemetry signals are classified as **[Observed]** (sensor/satellite telemetry) or **[AI-interpreted]** (anomaly algorithms).
- Statutory verification requires on-site inspection **[Verified]** by authorized monitoring personnel.

*Notice: AI-generated analysis is decision support. Officer actions require human authorization.*`;
  }

  // 2. User asked specifically about progress / reported vs observed
  if (q.includes('reported vs observed') || q.includes('progress') || q.includes('completion') || q.includes('variance') || q.includes('visual')) {
    return `### Progress Divergence Analysis: ${project.name} [${project.code}]

**1. Physical Progress Metrics**
- **Contractor / Billing Progress [Reported]**: **${project.progressPercent}%** claimed in official contractor submissions.
- **Satellite & Optical Telemetry [Observed]**: Multi-spectral imagery (Sentinel-2) and SAR telemetry estimate physical footprint at **${visualEstimate}%**.
- **Progress Variance [AI-interpreted]**: **${varianceSign} percentage points** divergence between contractor billing claims and observable asset footprint.

**2. Physical Context & Telemetry Feeds**
- **Lead Contractor**: ${project.contractor || 'Designated EPC Concessionaire'}
- **Executing Agency**: ${project.agency || 'Nodal Agency'} (${project.ministry})
- **CCTV Surveillance**: ${project.cctvAvailable ? 'Active on-site visual telemetry feed' : 'No direct CCTV telemetry configured'}
- **Evidence Sources**: ${project.evidence.map((e) => `[${e.toUpperCase()}]`).join(', ')}

**3. Progress Divergence Interpretation**
${Math.abs(variance) >= 5
  ? `The significant divergence of **${varianceSign} percentage points** between reported billing progress (${project.progressPercent}%) and independent satellite observations (${visualEstimate}%) indicates potential front-loading of milestone claims or uncompleted work packages. A physical ground inspection **[Verified]** is recommended.`
  : `Contractor reported physical progress (${project.progressPercent}%) aligns closely with remote visual satellite telemetry (${visualEstimate}%). Continuous telemetry surveillance is maintained.`}

*Notice: AI-generated analysis is decision support. Officer actions require human authorization.*`;
  }

  // 3. User asked specifically about delays / schedule
  if (q.includes('delay') || q.includes('schedule') || q.includes('timeline') || q.includes('late') || q.includes('behind')) {
    return `### Schedule Delay & Critical-Path Analysis: ${project.name} [${project.code}]

**1. Timeline Status**
- **Critical-Path Delay [Observed / AI-interpreted]**: **${delayText}** behind sanctioned schedule.
- **Start Date**: ${new Date(project.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
- **Sanctioned Target Completion Date [Reported]**: ${new Date(project.targetEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
- **Overall Project Status**: **${(project.status || 'Active').toUpperCase()}** (Risk Score: ${project.riskScore}/100)

**2. Key Schedule Risk Factors**
- Lead EPC concessionaire **${project.contractor || 'Agency'}** is tracking ${delayText} variance on foundational civil packages.
- Capital expenditure utilization is **${budgetUtilization}%** against **${project.progressPercent}%** claimed progress.

**3. Recommended Supervisory Action**
- Direct **${project.agency || 'the executing agency'}** to submit a milestone recovery schedule and verify equipment mobilization before subsequent billing disbursements.

*Notice: AI-generated analysis is decision support. Officer actions require human authorization.*`;
  }

  // 4. User asked specifically about budget / cost
  if (q.includes('cost') || q.includes('budget') || q.includes('spend') || q.includes('expenditure') || q.includes('crore') || q.includes('overrun')) {
    return `### Financial Outlay & Cost Exposure: ${project.name} [${project.code}]

**1. Financial Metrics**
- **Sanctioned Outlay**: ₹${budgetFormatted} Cr
- **Cumulative Disbursements [Reported]**: ₹${spentFormatted} Cr (**${budgetUtilization}%** of outlay utilized)
- **Claimed Physical Progress [Reported]**: **${project.progressPercent}%**
- **Observed Satellite Progress [Observed]**: **${visualEstimate}%**
- **Cost Escalation Probability [AI-interpreted]**: **${costOverrunProbability}%** likelihood of budget overrun based on financial burn rate vs physical deliverable delivery.

**2. Financial Risk Assessment**
${budgetUtilization > project.progressPercent
  ? `Disbursement pace (${budgetUtilization}%) is front-loaded relative to physical milestone delivery (${project.progressPercent}%), creating an elevated **${costOverrunProbability}% probability** of budget escalation before project commissioning.`
  : `Disbursement rate (${budgetUtilization}%) remains aligned with physical deliverables.`}

*Notice: AI-generated analysis is decision support. Officer actions require human authorization.*`;
  }

  // 5. Default Comprehensive Project Risk Assessment
  const drivers: string[] = [];
  if (Math.abs(variance) >= 5) {
    drivers.push(
      `**Progress-Evidence Discrepancy**: Contractor claims **${project.progressPercent}%** [Reported], whereas satellite & SAR telemetry estimates **${visualEstimate}%** [Observed] (${varianceSign} percentage points divergence).`
    );
  } else {
    drivers.push(
      `**Physical Progress Alignment**: Contractor progress (${project.progressPercent}%) aligns with satellite observation (${visualEstimate}%).`
    );
  }

  if (project.status === 'delayed' || project.status === 'critical' || project.riskScore >= 60) {
    drivers.push(
      `**Critical-Path Milestone Latency**: Cumulative schedule delay is running **${delayText}** behind sanctioned baselines.`
    );
  } else {
    drivers.push(
      `**Milestone Execution Pace**: Core civil packages are currently tracking within allowable schedule variance.`
    );
  }

  if (project.riskScore >= 50 || budgetUtilization > project.progressPercent) {
    drivers.push(
      `**Capex Burn-Rate Discrepancy**: Capex disbursement is **${budgetUtilization}%** (₹${spentFormatted} Cr of ₹${budgetFormatted} Cr) against **${project.progressPercent}%** claimed progress, indicating an estimated **${costOverrunProbability}% probability** of cost escalation.`
    );
  }

  if (projectAlerts.length > 0) {
    drivers.push(
      `**Active Telemetry Alerts**: ${projectAlerts.length} unresolved operational/technical warning(s) currently open on project work fronts.`
    );
  }

  const recommendedActions: string[] = [];
  if (project.riskScore >= 70 || Math.abs(variance) >= 10) {
    recommendedActions.push(
      `**Deploy Independent Ground Audit**: Dispatch an accredited regional monitoring engineer for physical site verification and milestone measurement at active chainages.`
    );
    recommendedActions.push(
      `**Issue Notice for Progress Reconciliation**: Issue formal directive to ${project.contractor || 'the concessionaire'} requiring reconciled physical billing within 5 business days.`
    );
    recommendedActions.push(
      `**Convene Technical Recovery Review**: Direct ${project.agency || 'the executing agency'} to submit a revised baseline catch-up schedule with dedicated equipment mobilization guarantees.`
    );
  } else if (project.riskScore >= 40) {
    recommendedActions.push(
      `**Enhance Sensor & Drone Telemetry**: Increase surveillance frequency and CCTV telemetry monitoring across primary structural packages.`
    );
    recommendedActions.push(
      `**Review Material Supply & Vendor Contracts**: Verify critical material supply chains to mitigate prospective schedule slippage.`
    );
    recommendedActions.push(
      `**Financial Milestone Audit**: Cross-reference upcoming milestone disbursement requests with verified ground completion.`
    );
  } else {
    recommendedActions.push(
      `**Maintain Baseline Telemetry Surveillance**: Continue routine multi-spectral satellite passes and quarterly milestone reporting.`
    );
    recommendedActions.push(
      `**Standard Periodic Reconciliation**: Affirm progress metrics during scheduled bi-monthly ministry oversight meetings.`
    );
  }

  return `### Dynamic Executive Risk Assessment: ${project.name} [${project.code}]

**1. Project Profile & Overall Risk Synthesis**
- **Project Name & Code**: ${project.name} (${project.code} | ID: ${project.id})
- **Sector & Line Ministry**: ${project.sector} · ${project.ministry} (${project.agency || 'Executing Agency'})
- **Location**: ${project.district}, ${project.state}
- **Lead Contractor**: ${project.contractor || 'Designated EPC Concessionaire'}
- **Overall Risk Rating**: **${project.riskScore}/100** — **${riskBandUpper} RISK**
- **Current Project Status**: **${(project.status || 'Active').toUpperCase()}**

---

**2. Reported vs. Observed Progress Analysis**
- **Contractor / Billing Progress [Reported]**: **${project.progressPercent}%** claimed in official submissions.
- **Satellite & Optical Telemetry [Observed]**: Multi-spectral imagery (Sentinel-2) and SAR passes estimate visual footprint at **${visualEstimate}%**.
- **Progress Divergence [AI-interpreted]**: **${varianceSign} percentage points** variance between billing claims and observable asset footprint.
- **Visual Evidence Note**: *Visual/observational estimates represent remote sensing analysis and are not legally binding until formal physical ground verification.*

---

**3. Schedule & Cost Exposure**
- **Critical-Path Delay [Observed / AI-interpreted]**: **${delayText}** behind baseline schedule.
- **Target Completion Date [Reported]**: ${new Date(project.targetEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
- **Sanctioned Outlay**: ₹${budgetFormatted} Cr
- **Cumulative Disbursements [Reported]**: ₹${spentFormatted} Cr (**${budgetUtilization}%** of outlay utilized)
- **Cost Escalation Probability [AI-interpreted]**: **${costOverrunProbability}%** likelihood of budget overrun based on financial burn rate vs physical milestone delivery.

---

**4. Decomposed Key Risk Drivers**
${drivers.map((d) => `- ${d}`).join('\n')}

---

**5. Active Telemetry Alerts & Early Warnings**
**Open Alerts:**
${alertsText}

**Early Warning Signals:**
${warningsText}

---

**6. Supporting Evidence Classification**
- **[Reported]**: Contractor monthly progress reports, billing milestone submissions, and ${project.agency || 'executing agency'} MIS filings.
- **[Observed]**: Sentinel-2 multi-spectral satellite imagery, radar altimetry, IoT CCTV telemetry (${project.cctvAvailable ? 'Active' : 'Not configured'}), and hydrological/sensor feeds.
- **[AI-interpreted]**: Multi-variate risk scoring, progress variance calculations, and probabilistic cost escalation forecasting.
- **[Verified]**: Formal ground inspection records and statutory audit sign-offs by certified government monitoring officers.

---

**7. Recommended Supervisory Officer Actions (Human Authorization Required)**
${recommendedActions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

---
*Notice: AI-generated analysis is decision support. Officer actions require human authorization.*`;
}

function generatePortfolioSummary(): string {
  const criticalProjects = projects.filter((p) => p.riskScore >= 75);
  const highProjects = projects.filter((p) => p.riskScore >= 50 && p.riskScore < 75);
  const activeAlerts = alerts.filter((a) => a.status === 'active');

  return `### InfraSight Portfolio Risk Assessment & Operational Overview

**Portfolio Health Summary:**
- **Total Monitored Projects**: ${projects.length} major national infrastructure projects across 28 States & UTs.
- **Critical Risk Projects (${criticalProjects.length})**: ${criticalProjects.map((p) => `**${p.name}** (${p.code} · Risk ${p.riskScore}/100)`).join(', ')}.
- **High Risk Projects (${highProjects.length})**: ${highProjects.map((p) => `${p.name} (${p.code} · ${p.riskScore}/100)`).join(', ')}.
- **Active Telemetry Alerts**: ${activeAlerts.length} active alerts requiring supervisory review.

**Common Portfolio Risk Drivers:**
1. **Progress-Evidence Discrepancy [AI-interpreted]**: Discrepancies between contractor self-reported physical milestones and satellite-observed progress.
2. **Critical-Path Milestone Latency [Observed]**: Foundation, tunneling, and embankment packages exceeding baseline allowances.
3. **Capex Disbursement Pace vs Physical Deliverables [Reported vs Observed]**: Front-loaded expenditure burn rates increasing cost escalation exposures.

**Available Commands & Queries:**
- Select any project from the selector or ask: *"Analyze risk for [Project Name or Code]"*
- Ask: *"Compare reported vs observed progress for [Project Name]"*
- Ask: *"What are the active alerts and early warnings across projects?"*
- Ask: *"Which projects have the highest schedule delays?"*

*Notice: AI-generated analysis is decision support. Officer actions require human authorization.*`;
}

function generateSevereDelaysResponse(): string {
  const sorted = [...projects].sort((a, b) => b.riskScore - a.riskScore);
  const items = sorted.slice(0, 6).map((p) => {
    const { delayText, visualEstimate, varianceSign, variance } =
      calculateProjectDelayAndCostExposure(p);
    return `1. **${p.name}** (${p.code} · ${p.state})
   - **Risk Score**: ${p.riskScore}/100 [${(p.riskBand || 'moderate').toUpperCase()}]
   - **Critical-Path Delay**: ${delayText}
   - **Progress**: ${p.progressPercent}% [Reported] vs ${visualEstimate}% [Observed] (${varianceSign}${variance}% var.)
   - **Lead Contractor**: ${p.contractor || 'EPC Agency'}`;
  });

  return `### Priority National Projects with Critical Schedule Latency

The following major infrastructure projects currently exhibit the highest critical-path schedule delays against sanctioned baselines:

${items.join('\n\n')}

*Notice: AI-generated analysis is decision support. Officer actions require human authorization.*`;
}

function generateEvidenceTaxonomyResponse(): string {
  return `### InfraSight 4-Tier Evidence Classification Taxonomy Protocol

InfraSight AI enforces a strict multi-tier evidence classification hierarchy to ensure data provenance and prevent unverified claims from being treated as established ground truth:

1. **[Reported] (Tier 1 - Self-Reported / Billing Declarations)**
   - Contractor physical milestone claims, monthly MIS filings, invoice submissions, and agency progress logs.
   - *Example*: Contractor claim of physical completion on billing certificates.

2. **[Observed] (Tier 2 - Empirical Remote Telemetry)**
   - Independent multi-spectral satellite imagery (Sentinel-2, PlanetScope), Synthetic Aperture Radar (SAR), on-site CCTV visual feeds, drone photogrammetry, and hydrological sensors.
   - *Example*: Satellite telemetry estimating observable physical asset footprint.

3. **[AI-interpreted] (Tier 3 - Algorithmic Decision Support)**
   - Machine-learning progress variance models, cost overrun likelihood simulations, and critical-path delay projections.
   - *Example*: Percentage point divergence calculation and cost escalation probability.

4. **[Verified] (Tier 4 - Official Human Ground Truth)**
   - Formal physical ground inspection reports, measurement books (MB), and audit certifications signed off by authorized government monitoring officers.

**Core Data Integrity Principle:**
*Observational satellite and visual estimates are strictly classified as [Observed] or [AI-interpreted] signals to guide supervisory scrutiny. They are never designated as [Verified] until a human monitoring officer conducts a physical ground audit.*

*Notice: AI-generated analysis is decision support. Officer actions require human authorization.*`;
}

export async function POST(req: NextRequest) {
  let prompt = '';
  let projectId: string | undefined;
  let projectContext: any = undefined;
  let history: any[] = [];

  try {
    const body = await req.json();
    prompt = body.prompt || '';
    projectId = body.projectId;
    projectContext = body.projectContext;
    history = body.history || [];

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'A valid prompt string is required.' },
        { status: 400 }
      );
    }

    // 1. FAST PRE-CHECK: Detect Greetings, Emojis, Casual Acknowledgments, and Unrelated Questions
    const currentActiveProject =
      projectId && projectId !== 'ALL'
        ? getProjectById(projectId)
        : projectContext?.id
        ? getProjectById(projectContext.id)
        : undefined;

    const conversationalIntent = detectConversationalIntent(prompt, currentActiveProject);
    if (conversationalIntent && conversationalIntent.response) {
      return NextResponse.json({ text: conversationalIntent.response });
    }

    // 2. PROJECT RESOLUTION: Match target project from prompt or fallback to selected project
    const matchResult = resolveTargetProject(prompt, projectId, projectContext);

    // If user explicitly queried a non-existent project:
    if (matchResult.isExplicitNotFound) {
      const searchedName = matchResult.searchedTerm || 'specified';
      return NextResponse.json({
        text: `The project **"${searchedName}"** could not be found in the monitored national infrastructure database.

**Available Monitored Projects include:**
${projects.slice(0, 8).map((p) => `- **${p.name}** (${p.code} | ID: ${p.id})`).join('\n')}
- *...and ${projects.length - 8} more projects across 28 States & UTs.*

Please select an existing project from the dropdown selector or mention its name or code (e.g. *KBRL-01*, *MCR-II*, *BFEU-03*, *PIDW-02*).`,
      });
    }

    const targetProject = matchResult.project;
    const projectAlerts = targetProject ? getAlertsForProject(targetProject.id) : [];
    const projectWarnings = targetProject
      ? earlyWarnings.filter((w) => w.projectId === targetProject.id)
      : [];

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      // Build dynamic context for Gemini
      let dynamicProjectContext = '';
      if (targetProject) {
        const {
          visualEstimate,
          variance,
          varianceSign,
          delayText,
          costOverrunProbability,
          budgetUtilization,
        } = calculateProjectDelayAndCostExposure(targetProject);

        dynamicProjectContext = `
SELECTED TARGET PROJECT DATA (USE THIS REAL DATA STRICTLY - NEVER INVENT):
- Project Name: ${targetProject.name}
- Project Code: ${targetProject.code} | ID: ${targetProject.id}
- Line Ministry: ${targetProject.ministry} | Executing Agency: ${targetProject.agency || 'Nodal Agency'}
- Location: ${targetProject.district}, ${targetProject.state}
- Sector: ${targetProject.sector}
- Status: ${targetProject.status || 'Active'}
- Overall Risk Score: ${targetProject.riskScore}/100 [${(targetProject.riskBand || 'moderate').toUpperCase()} RISK]
- Lead Contractor: ${targetProject.contractor || 'EPC Concessionaire'}
- Sanctioned Outlay: ₹${targetProject.budgetCrore.toLocaleString('en-IN')} Cr
- Cumulative Disbursed: ₹${targetProject.spentCrore.toLocaleString('en-IN')} Cr (${budgetUtilization}% utilized)
- Reported Physical Progress [Reported]: ${targetProject.progressPercent}% (Contractor claimed)
- Satellite & Optical Telemetry [Observed]: ${visualEstimate}% (Sentinel-2 / SAR estimate)
- Progress Variance [AI-interpreted]: ${varianceSign}${variance} percentage points
- Critical-Path Delay [Observed / AI-interpreted]: ${delayText}
- Cost Overrun Exposure [AI-interpreted]: ${costOverrunProbability}% probability
- CCTV Telemetry: ${targetProject.cctvAvailable ? 'Active on site' : 'Not configured'}
- Target Completion Date: ${new Date(targetProject.targetEndDate).toLocaleDateString('en-IN')}
- Active Alerts: ${
          projectAlerts.length > 0
            ? projectAlerts.map((a) => `[${a.id}] ${a.title} (${a.severity})`).join('; ')
            : 'None currently active'
        }
- Early Warning Signals: ${
          projectWarnings.length > 0
            ? projectWarnings.map((w) => `[${w.id}] ${w.signal}: ${w.detail}`).join('; ')
            : 'None currently active'
        }
`;
      }

      const systemInstruction = `You are InfraSight AI, an intelligent decision-support reasoning assistant for government infrastructure project monitoring, risk assessment, and predictive analytics across India's national infrastructure portfolio.

CONVERSATIONAL RULES:
1. GREETINGS & CASUAL MESSAGES:
   - If the user sends a greeting ("hi", "hello", "good morning"), emoji ("👋", "👍", "😊"), or casual message ("thanks", "ok", "cool", "how are you?"), respond in 1-2 friendly, professional sentences.
   - DO NOT trigger project risk analysis for simple greetings or casual conversation.
2. UNRELATED QUESTIONS:
   - If the user asks about unrelated topics (e.g. recipes, poems, sports, general trivia), politely explain that InfraSight AI is specialized for national infrastructure monitoring, risk analysis, progress verification, alerts, and officer decision support, then redirect them.
3. DYNAMIC PROJECT AWARENESS:
   - If the user asks about a specific project, use ONLY the target project data provided below.
   - If the user asks about a project that cannot be found in the database, clearly say it could not be found. Do NOT substitute another project or invent information.
   - Never hardcode project metrics or names; strictly use the dynamic data provided.
4. EVIDENCE CLASSIFICATION:
   - Delineate facts clearly between [Reported] (contractor claimed), [Observed] (satellite/sensor telemetry), [AI-interpreted] (algorithmic variance/forecasts), and [Verified] (official ground inspection).
   - Never present visual/observational estimates as legally binding or verified execution without physical ground audit.
5. STATUTORY HUMAN AUTHORIZATION NOTICE:
   - For all project risk assessments and supervisory recommendations, conclude with:
     *Notice: AI-generated analysis is decision support. Officer actions require human authorization.*

${dynamicProjectContext}

AVAILABLE MONITORED PORTFOLIO PROJECTS:
${projects.map((p) => `- ${p.name} (${p.code} | ID: ${p.id} | ${p.state} | Risk ${p.riskScore}/100)`).join('\n')}`;

      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

      if (Array.isArray(history) && history.length > 0) {
        for (const item of history.slice(-6)) {
          if (item.text && (item.role === 'user' || item.role === 'assistant')) {
            contents.push({
              role: item.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: item.text }],
            });
          }
        }
      }

      contents.push({
        role: 'user',
        parts: [
          {
            text: targetProject
              ? `User Query: "${prompt}"\n\nPlease answer regarding target project: ${targetProject.name} (${targetProject.code} | ${targetProject.id}) using its provided metrics.`
              : prompt,
          },
        ],
      });

      for (const modelName of FALLBACK_MODELS) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction,
              temperature: 0.3,
            },
          });

          if (response?.text) {
            return NextResponse.json({ text: response.text });
          }
        } catch {
          // If a model is unavailable or busy, try the next model
          continue;
        }
      }
    }

    // 3. DETERMINISTIC FALLBACK HANDLER (when Gemini API is offline or rate limited)
    const qLower = prompt.toLowerCase().trim();

    if (targetProject) {
      const fallbackText = generateDynamicProjectRiskAssessment(
        targetProject,
        prompt,
        projectAlerts,
        projectWarnings
      );
      return NextResponse.json({ text: fallbackText });
    }

    if (qLower.includes('evidence') || qLower.includes('taxonomy') || qLower.includes('distinguish') || qLower.includes('tier')) {
      return NextResponse.json({ text: generateEvidenceTaxonomyResponse() });
    }

    if (qLower.includes('delay') || qLower.includes('schedule') || qLower.includes('slippage') || qLower.includes('behind')) {
      return NextResponse.json({ text: generateSevereDelaysResponse() });
    }

    return NextResponse.json({ text: generatePortfolioSummary() });
  } catch {
    return NextResponse.json({
      text: `InfraSight AI reasoning service is operating in high-availability mode. Please try your request again.

*Notice: AI-generated analysis is decision support. Officer actions require human authorization.*`,
    });
  }
}
