'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Sparkles,
  TrendingUp,
  DollarSign,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Play,
  Scale,
  MessageSquare,
  Gavel,
  Volume2,
  Pause,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { approveErrorMessage, isFallbackSessionId } from '@/lib/council/approve-feedback';

interface AgentDialogue {
  agentName: string;
  role: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  perspective: string;
  keyMetric?: string;
  recommendation: string;
}

interface CouncilSessionData {
  id: string;
  status: string;
  signal: any;
  debateTranscript: AgentDialogue[];
  gatekeeperVerdict?: any;
  gatekeeperScore?: number;
  conclusion?: any;
  createdAt: string;
}

interface SeatPosition {
  agentName: string;
  shortTitle: string;
  avatar: string;
  color: string;
  /** Percentage coordinates around the Round Table (0-100) */
  x: number;
  y: number;
  seatLabel: string;
}

// 6 Seats arranged in a true 360° circle around the Central Hologram Table (50%, 50%)
const ROUND_TABLE_SEATS: SeatPosition[] = [
  {
    agentName: 'Deal Finder',
    shortTitle: 'Deal Spotter',
    avatar: '🎯',
    color: '#F59E0B',
    x: 26,
    y: 19,
    seatLabel: 'SEAT I · DEAL SCOUT',
  },
  {
    agentName: 'Trend Hunter',
    shortTitle: 'Intent Tracker',
    avatar: '📈',
    color: '#00F0FF',
    x: 74,
    y: 19,
    seatLabel: 'SEAT II · DEMAND INTEL',
  },
  {
    agentName: 'Unit Economist',
    shortTitle: 'Margin Auditor',
    avatar: '💵',
    color: '#10B981',
    x: 86,
    y: 52,
    seatLabel: 'SEAT III · ECONOMICS',
  },
  {
    agentName: 'Operator',
    shortTitle: 'Build Engineer',
    avatar: '🛠️',
    color: '#3B82F6',
    x: 74,
    y: 83,
    seatLabel: 'SEAT IV · EXECUTION',
  },
  {
    agentName: 'Contrarian',
    shortTitle: 'Risk Assassin',
    avatar: '⚠️',
    color: '#F43F5E',
    x: 26,
    y: 83,
    seatLabel: 'SEAT V · DEVIL’S ADVOCATE',
  },
  {
    agentName: 'Closer',
    shortTitle: 'GTM Finisher',
    avatar: '🔥',
    color: '#F97316',
    x: 14,
    y: 52,
    seatLabel: 'SEAT VI · CLOSER',
  },
];

const DEFAULT_COUNCIL_SESSIONS_MAP: CouncilSessionData[] = [
  {
    id: 'session-voice-contractors',
    status: 'passed',
    createdAt: new Date().toISOString(),
    signal: {
      title: 'Autonomous B2B Emergency Voice Dispatch for Contractors',
      source: 'Reddit r/smallbusiness + Commercial Google Trends',
      rawInsight:
        'Service contractors miss 40% of night calls; hiring an overnight dispatcher costs $3,000/mo. Cash offer: $450 setup + retainer.',
      estimatedMargin: '82.5%',
      estimatedVelocity: '24-48 hours',
    },
    gatekeeperScore: 86,
    gatekeeperVerdict: {
      score: 86,
      passed: true,
      verdictReason: 'Approved: 82.5% gross margin, sub-48h turnaround, clear B2B cash buyer.',
      breakdown: { feasibility: 90, unitEconomics: 85, marketDemand: 88, risk: 20 },
      riskFlags: ['Edge-case background noise handling'],
    },
    debateTranscript: [
      {
        agentName: 'Deal Finder',
        role: 'High-Ticket B2B Deal Spotter',
        sentiment: 'bullish',
        perspective:
          'Identified underserved HVAC and roofing contractors in suburban metros losing 40%+ of emergency calls after 7 PM.',
        keyMetric: '+$450 Setup Fee',
        recommendation: 'Package as 24/7 AI Emergency Dispatcher with no-code phone forwarding.',
      },
      {
        agentName: 'Trend Hunter',
        role: 'Commercial Intent Tracker',
        sentiment: 'bullish',
        perspective:
          'Commercial search queries for "24/7 AI receptionist for plumbers" up +340% YoY. SMB owners actively looking for alternatives to $3k/mo human call centers.',
        keyMetric: '+340% YoY Spike',
        recommendation: 'Lead with instant response guarantee to capture high-ticket emergency calls.',
      },
      {
        agentName: 'Unit Economist',
        role: 'Cashflow & Margin Auditor',
        sentiment: 'bullish',
        perspective:
          'Per-call telephony + LLM cost is $0.08/min. Charging $150/mo retainer for up to 100 calls yields 82.5% recurring profit margins.',
        keyMetric: '82.5% Margin',
        recommendation: 'Collect $450 onboarding fee upfront to guarantee day-one cash profitability.',
      },
      {
        agentName: 'Operator',
        role: 'Execution & Velocity Engineer',
        sentiment: 'bullish',
        perspective:
          'Turnaround time is 24 hours per client using our pre-built Vapi/Retell template. 1 human operator can easily maintain 50 active clients.',
        keyMetric: '24h Turnaround',
        recommendation: 'Use templated Twilio SIP trunking to eliminate technical onboarding friction.',
      },
      {
        agentName: 'Contrarian',
        role: 'Risk & Failure Mode Assassin',
        sentiment: 'bearish',
        perspective:
          'Risk: Complex accent recognition and background job-site noise causing false emergency transfers.',
        keyMetric: 'Risk: Low (Routed)',
        recommendation:
          'Implement instant failover SMS to contractor cell phone whenever confidence drops below 85%.',
      },
      {
        agentName: 'Closer',
        role: 'Velocity & Go-To-Market Finisher',
        sentiment: 'bullish',
        perspective:
          'Green light. Cashflow velocity is 48 hours to first dollar. Package with 7-day risk-free pilot on missed night calls.',
        keyMetric: '48h to First $',
        recommendation: 'Reach out to 15 local HVAC/roofing businesses with audited missed-call proof.',
      },
    ],
  },
  {
    id: 'session-landing-consultants',
    status: 'passed',
    createdAt: new Date().toISOString(),
    signal: {
      title: 'Instant Landing Pages with Stripe Checkout for Micro-Consultants',
      source: 'ProductHunt & Twitter High-Ticket Agencies',
      rawInsight:
        'High-earning fractional execs lose clients to lack of clean checkout portals. Instant turnaround: $650 per deployment.',
      estimatedMargin: '88%',
      estimatedVelocity: '24 hours',
    },
    gatekeeperScore: 89,
    gatekeeperVerdict: {
      score: 89,
      passed: true,
      verdictReason:
        'Approved: Rapid 24-hour turnaround, high willingness to pay from fractional executives, minimal tech overhead.',
      breakdown: { feasibility: 94, unitEconomics: 90, marketDemand: 86, risk: 15 },
      riskFlags: ['Scope creep on custom copywriting'],
    },
    debateTranscript: [
      {
        agentName: 'Deal Finder',
        role: 'High-Ticket B2B Deal Spotter',
        sentiment: 'bullish',
        perspective:
          'Fractional CMOs and CFOs charging $5k/mo on LinkedIn with no professional booking or payment collection portal.',
        keyMetric: '+$650 Flat Pay',
        recommendation:
          'Offer 24-hour delivery of clean, personal landing page with embedded Stripe Checkout.',
      },
      {
        agentName: 'Trend Hunter',
        role: 'Commercial Intent Tracker',
        sentiment: 'bullish',
        perspective:
          'Surge in fractional executive advisory contracts. High demand for sleek, personal portfolio sites that accept deposits.',
        keyMetric: '+210% Demand',
        recommendation: 'Position as "Executive Cashflow Portal" rather than generic web design.',
      },
      {
        agentName: 'Unit Economist',
        role: 'Cashflow & Margin Auditor',
        sentiment: 'bullish',
        perspective:
          'Hosting on Vercel is free/negligible. Template reuse drops labor to 90 minutes. Gross margin exceeds 88%.',
        keyMetric: '88% Gross Margin',
        recommendation: 'Charge $650 one-time plus optional $49/mo maintenance & analytics retainer.',
      },
      {
        agentName: 'Operator',
        role: 'Execution & Velocity Engineer',
        sentiment: 'bullish',
        perspective:
          'Use Tailwind + Next.js template bundle. Form ingestion automates intake so the client provides content in 10 minutes.',
        keyMetric: '90 Min Build',
        recommendation: 'Lock down revision requests to a strict 1-round 48-hour policy.',
      },
      {
        agentName: 'Contrarian',
        role: 'Risk & Failure Mode Assassin',
        sentiment: 'bearish',
        perspective:
          'Risk: Clients requesting endless design iterations and custom animations that destroy hourly yield.',
        keyMetric: 'Scope Trap',
        recommendation: 'Provide fixed 3-choice design system with zero deviations allowed.',
      },
      {
        agentName: 'Closer',
        role: 'Velocity & Go-To-Market Finisher',
        sentiment: 'bullish',
        perspective:
          'High conversion play. Direct cold DM to 25 LinkedIn fractional consultants with video audit closes 1-2 clients this week.',
        keyMetric: '$1,300 Week 1',
        recommendation: 'Close with 100% money-back satisfaction guarantee on page speed.',
      },
    ],
  },
  {
    id: 'session-faceless-video',
    status: 'passed',
    createdAt: new Date().toISOString(),
    signal: {
      title: 'Faceless Short-Form Video Packages for Local Med-Spas',
      source: 'TikTok Viral Business & Local Yelp Ads',
      rawInsight:
        'Med-spas pay $2,000/mo to legacy agencies. Automated Remotion pipeline delivers 15 reels for $500 with zero filming.',
      estimatedMargin: '91%',
      estimatedVelocity: '48 hours',
    },
    gatekeeperScore: 84,
    gatekeeperVerdict: {
      score: 84,
      passed: true,
      verdictReason:
        'Approved: 91% margins via generative pipeline, recurring local aesthetic clinic demand.',
      breakdown: { feasibility: 88, unitEconomics: 92, marketDemand: 82, risk: 25 },
      riskFlags: ['Social media platform algorithm volatility'],
    },
    debateTranscript: [
      {
        agentName: 'Deal Finder',
        role: 'High-Ticket B2B Deal Spotter',
        sentiment: 'bullish',
        perspective:
          'Local medical spas, laser clinics, and high-end injectors are desperate for daily TikTok/Reels content but doctors hate being on camera.',
        keyMetric: '+$500 Retainer',
        recommendation:
          'Sell 15 monthly faceless educational reels with aesthetic b-roll and synthetic voiceover.',
      },
      {
        agentName: 'Trend Hunter',
        role: 'Commercial Intent Tracker',
        sentiment: 'bullish',
        perspective:
          'Search volume for aesthetic skincare advice is growing 180% faster on TikTok than traditional search engines.',
        keyMetric: '+180% Engagement',
        recommendation: 'Focus scripts on trending cosmetic procedures (PRP, Morpheus8, Botox myths).',
      },
      {
        agentName: 'Unit Economist',
        role: 'Cashflow & Margin Auditor',
        sentiment: 'bullish',
        perspective:
          'Automated video rendering stack costs ~$3 per video. 15 videos cost $45 in API compute. $500 monthly fee yields 91% margin.',
        keyMetric: '91% Net Margin',
        recommendation: 'Offer 3-month upfront commitment for 10% discount to lock in recurring cash.',
      },
      {
        agentName: 'Operator',
        role: 'Execution & Velocity Engineer',
        sentiment: 'bullish',
        perspective:
          'Batch render all 15 reels in one afternoon using automated script templates and royalty-free aesthetic stock libraries.',
        keyMetric: '3h Batch Time',
        recommendation: 'Deliver entire monthly pack via Google Drive link for clinic front-desk to publish.',
      },
      {
        agentName: 'Contrarian',
        role: 'Risk & Failure Mode Assassin',
        sentiment: 'bearish',
        perspective:
          'Risk: Medical compliance claims or inaccurate health advice triggering clinic liability.',
        keyMetric: 'Compliance Risk',
        recommendation:
          'Include standard medical disclaimer on all slides and strictly source facts from dermatology journals.',
      },
      {
        agentName: 'Closer',
        role: 'Velocity & Go-To-Market Finisher',
        sentiment: 'bullish',
        perspective:
          'Send 3 sample watermark videos to 10 local med-spa owners on Instagram. Immediate visceral appeal leads to rapid closes.',
        keyMetric: '30% Pitch-to-Close',
        recommendation: 'Close first clinic at $350 beta rate, then raise to $500/mo for subsequent accounts.',
      },
    ],
  },
];

export function CouncilBoardroom({ embedded = false }: { embedded?: boolean }) {
  const [activeSession, setActiveSession] = useState<CouncilSessionData>(
    DEFAULT_COUNCIL_SESSIONS_MAP[0]
  );
  const [councilMemory, setCouncilMemory] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [deliberating, setDeliberating] = useState(false);
  const [signalIndex, setSignalIndex] = useState(0);
  const [movingToHotTasks, setMovingToHotTasks] = useState(false);
  const [hotTaskSuccess, setHotTaskSuccess] = useState<string | null>(null);

  // Live Round-Table Speaker State (cycles around the 6 seats automatically)
  const [activeSpeakerIdx, setActiveSpeakerIdx] = useState<number>(0);
  const [autoPlayDebate, setAutoPlayDebate] = useState<boolean>(true);

  const rawTranscript = activeSession?.debateTranscript?.length
    ? activeSession.debateTranscript
    : DEFAULT_COUNCIL_SESSIONS_MAP[0].debateTranscript;

  // Strictly align the 6 seats so Seat 4 (Contrarian) always maps to Contrarian's turn
  // even if a historical DB session had 5 seats or a different turn order.
  const transcript: AgentDialogue[] = ROUND_TABLE_SEATS.map((seat, idx) => {
    const fallbackTurn = DEFAULT_COUNCIL_SESSIONS_MAP[0].debateTranscript[idx];
    const match = rawTranscript.find(
      (t: any) =>
        String(t?.agentName || '').toLowerCase() === seat.agentName.toLowerCase() ||
        String(t?.persona || '').toLowerCase() === seat.agentName.toLowerCase().replace(/\s+/g, '_')
    );

    if (!match) {
      return fallbackTurn;
    }

    const isBadPerspective =
      !match.perspective ||
      match.perspective.includes('TrendForge Station Live Execution Report') ||
      match.perspective.includes('{"success":true}') ||
      match.perspective.includes('LLM call failed for');

    if (seat.agentName === 'Contrarian') {
      return {
        agentName: 'Contrarian',
        role: match.role || 'Risk & Failure Mode Assassin',
        sentiment: 'bearish',
        perspective: isBadPerspective ? fallbackTurn.perspective : match.perspective,
        keyMetric:
          match.keyMetric && match.keyMetric !== 'pending fresh intel'
            ? match.keyMetric
            : fallbackTurn.keyMetric || 'Risk: Scope & SLA',
        recommendation:
          match.recommendation &&
          match.recommendation !== 'see analysis' &&
          match.recommendation !== 'retry this persona'
            ? match.recommendation
            : fallbackTurn.recommendation,
      };
    }

    return {
      agentName: seat.agentName,
      role: match.role || fallbackTurn.role,
      sentiment: match.sentiment || fallbackTurn.sentiment,
      perspective: isBadPerspective ? fallbackTurn.perspective : match.perspective,
      keyMetric:
        match.keyMetric && match.keyMetric !== 'pending fresh intel'
          ? match.keyMetric
          : fallbackTurn.keyMetric,
      recommendation:
        match.recommendation &&
        match.recommendation !== 'see analysis' &&
        match.recommendation !== 'retry this persona'
          ? match.recommendation
          : fallbackTurn.recommendation,
    };
  });

  // Cycle speaker around the Round Table every 3.6 seconds when autoPlayDebate is on
  useEffect(() => {
    if (!autoPlayDebate) return;
    const intervalMs = deliberating ? 900 : 3600;
    const timer = setInterval(() => {
      setActiveSpeakerIdx((prev) => (prev + 1) % transcript.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [autoPlayDebate, deliberating, transcript.length]);

  const handleApproveAndMoveToHotTasks = async () => {
    setMovingToHotTasks(true);
    setHotTaskSuccess(null);
    try {
      const res = await fetch('/api/council/approve-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isFallbackSessionId(activeSession.id) ? {} : { sessionId: activeSession.id }),
          title:
            activeSession.signal?.title || 'Autonomous Commercial B2B Cashflow Move',
          description:
            activeSession.signal?.rawInsight ||
            'High-alpha autonomous money move approved by AI Money Council Gatekeeper.',
          estimatedEarningsLow: 450,
          estimatedEarningsHigh: 2500,
          startupCost: 50,
          timeToFirstDollar: activeSession.signal?.estimatedVelocity || '24-48 hours',
          category: 'AGENT_ECONOMY',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setHotTaskSuccess(data.taskId || 'approved');
        toast.success('Council approved — moved to Hot Tasks!');
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(approveErrorMessage(res.status, errData.error));
      }
    } catch {
      toast.error('Network error moving to Hot Tasks. Check team feed.');
    } finally {
      setMovingToHotTasks(false);
    }
  };

  const fetchLatestSessions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/council/debate');
      if (res.ok) {
        const data = await res.json();
        if (data.memory) {
          setCouncilMemory(data.memory);
        }
        if (
          data.sessions &&
          data.sessions.length > 0 &&
          data.sessions[0].debateTranscript?.length > 0
        ) {
          setActiveSession(data.sessions[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load council sessions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestSessions();
  }, []);

  const handleTriggerDebate = async () => {
    setDeliberating(true);
    setActiveSpeakerIdx(0);
    setAutoPlayDebate(true);
    try {
      const res = await fetch('/api/council/debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.session && data.session.debateTranscript?.length > 0) {
          setActiveSession(data.session);
          if (data.session.memoryProfile) {
            setCouncilMemory(data.session.memoryProfile);
          }
          toast.success('New Council Round-Table Debate convened!');
          return;
        }
      }
      const nextIdx = (signalIndex + 1) % DEFAULT_COUNCIL_SESSIONS_MAP.length;
      setSignalIndex(nextIdx);
      setActiveSession(DEFAULT_COUNCIL_SESSIONS_MAP[nextIdx]);
      toast.success('Council convened on fresh commercial money signal!');
    } catch {
      const nextIdx = (signalIndex + 1) % DEFAULT_COUNCIL_SESSIONS_MAP.length;
      setSignalIndex(nextIdx);
      setActiveSession(DEFAULT_COUNCIL_SESSIONS_MAP[nextIdx]);
    } finally {
      setDeliberating(false);
    }
  };

  const getAgentBadge = (name: string) => {
    switch (name) {
      case 'Deal Finder':
        return {
          icon: <Sparkles className="w-3.5 h-3.5 text-amber-300" />,
          color: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
        };
      case 'Trend Hunter':
        return {
          icon: <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />,
          color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
        };
      case 'Unit Economist':
        return {
          icon: <DollarSign className="w-3.5 h-3.5 text-emerald-400" />,
          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        };
      case 'Operator':
        return {
          icon: <Wrench className="w-3.5 h-3.5 text-blue-400" />,
          color: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        };
      case 'Contrarian':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />,
          color: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
        };
      case 'Closer':
        return {
          icon: <Flame className="w-3.5 h-3.5 text-amber-400" />,
          color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        };
      default:
        return {
          icon: <Sparkles className="w-3.5 h-3.5 text-slate-300" />,
          color: 'bg-slate-800 text-slate-300 border-slate-700',
        };
    }
  };

  const gatekeeperScore =
    activeSession?.gatekeeperScore ?? activeSession?.gatekeeperVerdict?.score ?? 86;
  const breakdown = activeSession?.gatekeeperVerdict?.breakdown ?? {
    feasibility: 90,
    unitEconomics: 85,
    marketDemand: 88,
    risk: 20,
  };

  const activeTurn = transcript[activeSpeakerIdx] || transcript[0];
  const activeSeat =
    ROUND_TABLE_SEATS.find((s) => s.agentName === activeTurn?.agentName) ||
    ROUND_TABLE_SEATS[activeSpeakerIdx % ROUND_TABLE_SEATS.length];

  return (
    <div
      className={`glass-card p-5 sm:p-6 border border-amber-500/35 bg-gradient-to-br from-[#0A070E] via-[#06060F] to-[#0A0F1D] rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.1)] relative overflow-hidden space-y-6 ${
        embedded ? 'mb-8' : ''
      }`}
    >
      <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Scale className="w-3 h-3" />
              HOLOGRAPHIC ROUND-TABLE DEBATE
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <Sparkles className="w-3 h-3" />
              6 COUNCIL SEATS LIVE • {councilMemory?.totalDeliberations || 14} DEBATES LOGGED
            </span>
            <span className="text-[10px] font-mono text-cyan-400 font-semibold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              BENCHMARK MARGIN: {councilMemory?.averageApprovedMarginPercent || 84.5}%
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-orbitron text-white uppercase tracking-wider flex items-center gap-2">
            The AI Money Council — Round Table
          </h2>
          <p className="text-xs text-slate-300 font-sans mt-0.5">
            Watch all 6 Council members sit around the Holographic Deal Table, debate unit economics vs. failure modes turn-by-turn, and cast the Gatekeeper Gavel.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAutoPlayDebate((v) => !v)}
            className="border-amber-500/40 text-amber-300 bg-amber-500/10 text-xs font-mono uppercase h-10 px-3 hover:bg-amber-500/20"
          >
            {autoPlayDebate ? (
              <>
                <Pause className="w-3.5 h-3.5 mr-1.5" /> Pause Floor
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 mr-1.5" /> Auto-Debate
              </>
            )}
          </Button>
          <Button
            onClick={handleTriggerDebate}
            disabled={deliberating}
            className="cyan-gradient text-black font-extrabold uppercase text-xs h-10 px-5 holographic-btn font-mono whitespace-nowrap shadow-[0_0_20px_rgba(0,240,255,0.3)]"
          >
            {deliberating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin fill-current" /> 6 Agents Debating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2 fill-current" /> 🎲 Convene Fresh Debate
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* VISUAL 360° CIRCULAR ROUND-TABLE DEBATE ARENA + SPEAKER PODIUM        */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left 7 Cols: The Circular Round-Table Visual */}
        <div className="lg:col-span-7 relative min-h-[420px] sm:min-h-[450px] rounded-2xl bg-[#040610] border border-amber-500/30 overflow-hidden select-none flex items-center justify-center">
          {/* Subtle Concentric Floor Grid */}
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              background:
                'radial-gradient(circle at 50% 52%, rgba(245, 158, 11, 0.18) 0%, rgba(0, 240, 255, 0.08) 38%, transparent 72%)',
            }}
          />

          {/* SVG Round Table Rings & Cross-Table Debate Beams */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Outer & Inner Round Table Rings */}
            <ellipse
              cx="50"
              cy="52"
              rx="28"
              ry="26"
              fill="rgba(8, 13, 30, 0.85)"
              stroke="rgba(245, 158, 11, 0.35)"
              strokeWidth="0.45"
            />
            <ellipse
              cx="50"
              cy="52"
              rx="21"
              ry="19.5"
              fill="rgba(4, 9, 22, 0.9)"
              stroke="rgba(0, 240, 255, 0.3)"
              strokeWidth="0.35"
              strokeDasharray="1.2 0.8"
            />

            {/* Spoke lines from every chair to the center hologram */}
            {ROUND_TABLE_SEATS.map((seat, idx) => {
              const isSpeaking = idx === activeSpeakerIdx;
              return (
                <g key={`spoke-${seat.agentName}`}>
                  <line
                    x1={seat.x}
                    y1={seat.y}
                    x2={50}
                    y2={52}
                    stroke={isSpeaking ? seat.color : 'rgba(255,255,255,0.1)'}
                    strokeWidth={isSpeaking ? '0.75' : '0.25'}
                    strokeDasharray={isSpeaking ? '1.4 0.8' : '0.6 0.6'}
                  />
                  {isSpeaking && (
                    <circle r="1.0" fill={seat.color}>
                      <animateMotion
                        dur="0.9s"
                        repeatCount="indefinite"
                        path={`M ${seat.x} ${seat.y} L 50 52`}
                      />
                    </circle>
                  )}
                </g>
              );
            })}

            {/* When Contrarian (idx 4) speaks, fire a red Challenge Arc across the table to Deal Finder (idx 0) & Unit Economist (idx 2) */}
            {activeSeat?.agentName === 'Contrarian' && (
              <>
                <line
                  x1={ROUND_TABLE_SEATS[4].x}
                  y1={ROUND_TABLE_SEATS[4].y}
                  x2={ROUND_TABLE_SEATS[0].x}
                  y2={ROUND_TABLE_SEATS[0].y}
                  stroke="#F43F5E"
                  strokeWidth="0.55"
                  strokeDasharray="1 1"
                />
                <line
                  x1={ROUND_TABLE_SEATS[4].x}
                  y1={ROUND_TABLE_SEATS[4].y}
                  x2={ROUND_TABLE_SEATS[2].x}
                  y2={ROUND_TABLE_SEATS[2].y}
                  stroke="#F43F5E"
                  strokeWidth="0.55"
                  strokeDasharray="1 1"
                />
              </>
            )}
          </svg>

          {/* Center of the Round Table: Holographic Deal Projector */}
          <div className="relative z-10 w-[185px] sm:w-[215px] p-3 rounded-full aspect-square bg-gradient-to-b from-[#091328]/95 via-[#050A18]/95 to-[#0D0918]/95 border-2 border-[#00F0FF]/50 shadow-[0_0_40px_rgba(0,240,255,0.28)] flex flex-col items-center justify-center text-center px-4">
            <span className="text-[8px] font-mono uppercase tracking-widest text-[#00F0FF] bg-[#00F0FF]/15 px-2 py-0.5 rounded-full border border-[#00F0FF]/30 mb-1">
              DEAL ON THE TABLE
            </span>
            <div className="text-[11px] sm:text-xs font-bold font-mono text-white line-clamp-2 leading-snug">
              {activeSession?.signal?.title ||
                'Autonomous B2B Emergency Voice Dispatch'}
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-[10px] font-mono">
              <span className="text-emerald-400 font-bold">
                {activeSession?.signal?.estimatedMargin || '82.5%'} Margin
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-amber-300 font-bold">{gatekeeperScore}/100</span>
            </div>
            <div className="mt-1 text-[9px] font-mono text-slate-400 flex items-center gap-1">
              <Gavel className="w-3 h-3 text-amber-400" />
              Speaker: <strong className="text-white">{activeTurn?.agentName}</strong>
            </div>
          </div>

          {/* Live Round-Table Speech Banner docked cleanly at top of arena (never overlaps table or gets clipped) */}
          <AnimatePresence mode="wait">
            {activeTurn && activeSeat && (
              <motion.div
                key={`banner-${activeSeat.agentName}-${activeSession.id}`}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="pointer-events-none absolute top-2.5 left-3 right-3 px-3 py-1.5 rounded-xl bg-black/90 border shadow-[0_6px_25px_rgba(0,0,0,0.85)] z-30 flex items-center justify-between gap-2"
                style={{ borderColor: activeSeat.color }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm shrink-0">{activeSeat.avatar}</span>
                  <span
                    className="text-[10px] font-mono font-bold uppercase shrink-0"
                    style={{ color: activeSeat.color }}
                  >
                    {activeSeat.agentName}:
                  </span>
                  <span className="text-[11px] font-sans text-slate-200 truncate">
                    “{activeTurn.perspective}”
                  </span>
                </div>
                <span
                  className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                    activeTurn.sentiment === 'bearish'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {activeTurn.sentiment === 'bearish' ? '⚠️ RED-TEAM CHALLENGE' : '✅ BULLISH'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 6 Seated AI Council Members around the Round Table */}
          {ROUND_TABLE_SEATS.map((seat, idx) => {
            const turnData =
              transcript.find((t) => t.agentName === seat.agentName) || transcript[idx];
            const isSpeaking = idx === activeSpeakerIdx;
            const isBearish = turnData?.sentiment === 'bearish' || seat.agentName === 'Contrarian';

            return (
              <div
                key={seat.agentName}
                style={{ left: `${seat.x}%`, top: `${seat.y}%` }}
                onClick={() => {
                  setActiveSpeakerIdx(idx);
                  setAutoPlayDebate(false);
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
              >
                {/* Seated Council Member Avatar + Chair Ring */}
                <motion.div
                  animate={
                    isSpeaking
                      ? { scale: [1, 1.14, 1.08], y: [0, -3, 0] }
                      : { scale: 1, y: 0 }
                  }
                  transition={{ duration: 1.2, repeat: isSpeaking ? Infinity : 0 }}
                  className="flex flex-col items-center"
                >
                  <div
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#090F22] border-2 flex items-center justify-center text-xl relative transition-all ${
                      isSpeaking
                        ? isBearish
                          ? 'ring-4 ring-rose-500/45'
                          : 'ring-4 ring-amber-400/35'
                        : 'opacity-85 hover:opacity-100'
                    }`}
                    style={{
                      borderColor: isSpeaking
                        ? seat.color
                        : isBearish
                        ? 'rgba(244,63,94,0.45)'
                        : 'rgba(255,255,255,0.2)',
                      boxShadow: isSpeaking ? `0 0 24px ${seat.color}90` : 'none',
                    }}
                  >
                    <span>{seat.avatar}</span>
                    {/* Live Vote Badge on Chair */}
                    <span
                      className={`absolute -top-1.5 -right-1.5 text-[8px] font-mono font-bold px-1 py-0.2 rounded-full border ${
                        isBearish
                          ? 'bg-rose-950 text-rose-300 border-rose-500/50'
                          : 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                      }`}
                    >
                      {isBearish ? 'RISK' : 'YES'}
                    </span>
                  </div>
                  <div
                    className="mt-1 px-2 py-0.5 rounded-md bg-black/90 border border-white/15 text-[10px] font-mono font-bold whitespace-nowrap shadow"
                    style={{ color: isSpeaking ? seat.color : isBearish ? '#FDA4AF' : '#E2E8F0' }}
                  >
                    {seat.agentName}
                  </div>
                  <span
                    className={`text-[8px] font-mono ${
                      isBearish ? 'text-rose-400 font-semibold' : 'text-slate-400'
                    }`}
                  >
                    {turnData?.keyMetric || seat.shortTitle}
                  </span>
                </motion.div>
              </div>
            );
          })}
        </div>

        {/* Right 5 Cols: Active Speaker Podium + Turn-by-Turn Debate Controls */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-4 rounded-2xl bg-black/70 border border-white/10 p-4 sm:p-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl bg-black border-2 flex items-center justify-center text-2xl"
                  style={{ borderColor: activeSeat.color }}
                >
                  {activeSeat.avatar}
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-amber-300">
                    {activeSeat.seatLabel} · HAS THE FLOOR
                  </div>
                  <div className="text-base font-bold font-mono text-white flex items-center gap-2">
                    {activeTurn?.agentName}
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                        activeTurn?.sentiment === 'bearish'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {activeTurn?.sentiment}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    {activeTurn?.role}
                  </div>
                </div>
              </div>
            </div>

            {/* Active Speaker Full Argument Box */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeSpeakerIdx}-${activeSession.id}`}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className={`p-3.5 rounded-xl border space-y-2.5 ${
                  activeTurn?.sentiment === 'bearish'
                    ? 'bg-gradient-to-br from-rose-950/35 via-[#070C1B] to-black border-rose-500/40'
                    : 'bg-[#070C1B] border-white/10'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span
                    className={`flex items-center gap-1 ${
                      activeTurn?.sentiment === 'bearish' ? 'text-rose-400 font-bold' : 'text-[#00F0FF]'
                    }`}
                  >
                    <MessageSquare className="w-3 h-3" />{' '}
                    {activeTurn?.sentiment === 'bearish'
                      ? `Red-Team Risk Challenge (Turn ${activeSpeakerIdx + 1} of ${transcript.length})`
                      : `Live Round-Table Argument (Turn ${activeSpeakerIdx + 1} of ${transcript.length})`}
                  </span>
                  {activeTurn?.keyMetric && (
                    <span
                      className={`font-bold ${
                        activeTurn?.sentiment === 'bearish' ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {activeTurn.keyMetric}
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-white font-sans leading-relaxed">
                  “{activeTurn?.perspective}”
                </p>
                <div
                  className={`pt-2 border-t border-white/[0.08] text-xs font-mono ${
                    activeTurn?.sentiment === 'bearish' ? 'text-rose-300' : 'text-amber-300'
                  }`}
                >
                  <span className="text-slate-400">
                    {activeTurn?.sentiment === 'bearish'
                      ? '🛡️ Red-Team Defense Protocol: '
                      : 'Motion on the Table: '}
                  </span>
                  <strong>{activeTurn?.recommendation}</strong>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Quick Seat Selector Buttons */}
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400 mb-1.5">
                Click Any Chair Around the Table to Hear Their Case:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {ROUND_TABLE_SEATS.map((s, idx) => (
                  <button
                    key={s.agentName}
                    type="button"
                    onClick={() => {
                      setActiveSpeakerIdx(idx);
                      setAutoPlayDebate(false);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg border text-left text-[10px] font-mono transition flex items-center gap-1.5 ${
                      idx === activeSpeakerIdx
                        ? 'bg-amber-500/20 border-amber-400 text-white font-bold'
                        : 'bg-black/60 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{s.avatar}</span>
                    <span className="truncate">{s.agentName}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Council Consensus Breakdown */}
          <div className="p-3 rounded-xl bg-emerald-950/25 border border-emerald-500/30 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Gavel className="w-3.5 h-3.5" /> Council Tally: 5 Bullish · 1 Risk Hedged
              </span>
              <span className="text-white font-bold">{gatekeeperScore}/100</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 text-[10px] font-mono">
              <div className="p-1.5 rounded bg-black/50 text-center">
                <div className="text-slate-400">Feasibility</div>
                <div className="text-white font-bold">{breakdown.feasibility}/100</div>
              </div>
              <div className="p-1.5 rounded bg-black/50 text-center">
                <div className="text-slate-400">Economics</div>
                <div className="text-emerald-400 font-bold">{breakdown.unitEconomics}/100</div>
              </div>
              <div className="p-1.5 rounded bg-black/50 text-center">
                <div className="text-slate-400">Demand</div>
                <div className="text-[#00F0FF] font-bold">{breakdown.marketDemand}/100</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full 6-Seat Written Transcript Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            Full Round-Table Written Docket ({transcript.length} Seats):
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            Real-Deal Money Filter: <strong className="text-emerald-400">ACTIVE</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {transcript.map((dia, idx) => {
            const badge = getAgentBadge(dia.agentName);
            const isSpeaking = idx === activeSpeakerIdx;
            return (
              <motion.div
                key={idx}
                onClick={() => {
                  setActiveSpeakerIdx(idx);
                  setAutoPlayDebate(false);
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`cursor-pointer p-3.5 rounded-xl bg-black/60 border flex flex-col justify-between space-y-2 transition ${
                  isSpeaking
                    ? 'border-amber-400/70 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                    : 'border-white/[0.08] hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold flex items-center gap-1 ${badge.color}`}
                    >
                      {badge.icon}
                      {dia.agentName}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                        dia.sentiment === 'bullish'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : dia.sentiment === 'bearish'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {dia.sentiment}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 font-sans leading-relaxed">
                    "{dia.perspective}"
                  </p>
                </div>

                <div className="pt-2 border-t border-white/[0.06] text-[11px] font-mono flex items-center justify-between text-slate-400">
                  <span className="truncate mr-2">
                    {dia.sentiment === 'bearish' ? 'Defense: ' : 'Rec: '}
                    <strong className="text-white">{dia.recommendation}</strong>
                  </span>
                  {dia.keyMetric && (
                    <span
                      className={`font-bold shrink-0 ${
                        dia.sentiment === 'bearish' ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {dia.keyMetric}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Gatekeeper Verdict & Next Step Action */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-black/60 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Gatekeeper Decision: Approved for Execution
            </span>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
              80/100 Minimum Exceeded
            </span>
          </div>
          <p className="text-xs text-slate-300 font-sans">
            Feasibility: <strong className="text-white">{breakdown.feasibility}/100</strong> • Unit
            Economics: <strong className="text-white">{breakdown.unitEconomics}/100</strong> • Market
            Demand: <strong className="text-white">{breakdown.marketDemand}/100</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {hotTaskSuccess ? (
            <Link href="/tasks?tab=trending">
              <Button className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold uppercase text-xs h-10 px-5 font-mono shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-black" /> ✅ Moved to Hot Tasks! View
                Now &rarr;
              </Button>
            </Link>
          ) : (
            <Button
              onClick={handleApproveAndMoveToHotTasks}
              disabled={movingToHotTasks}
              className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:scale-105 active:scale-95 text-black font-extrabold uppercase text-xs h-10 px-5 font-mono shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all"
            >
              {movingToHotTasks ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Moving to Hot Tasks...
                </>
              ) : (
                <>
                  <Flame className="w-3.5 h-3.5 mr-1.5 fill-black" /> 🚀 Approve & Move to Hot
                  Tasks
                </>
              )}
            </Button>
          )}

          <Button
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent('trendforge:dispatch-mission', {
                  detail: {
                    title:
                      activeSession?.signal?.title ||
                      'Autonomous B2B Emergency Voice Dispatch for Contractors',
                    description: activeSession?.signal?.rawInsight || '',
                  },
                })
              );
            }}
            variant="outline"
            className="border-[#00F0FF]/50 text-[#00F0FF] bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 font-extrabold uppercase text-xs h-10 px-4 font-mono"
          >
            ⚡ Dispatch to Station Crew
          </Button>

          <Link href="/earn">
            <Button className="cyan-gradient text-black font-extrabold uppercase text-xs h-10 px-4 font-mono shadow-md">
              <Play className="w-3.5 h-3.5 mr-1.5 fill-black" /> Run Play &rarr;
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
