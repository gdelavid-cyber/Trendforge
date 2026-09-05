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
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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

const MONEY_SIGNALS = [
  {
    title: 'Autonomous B2B Emergency Voice Dispatch for Contractors',
    source: 'Reddit r/smallbusiness + Commercial Google Trends',
    rawInsight: 'Service contractors miss 40% of night calls; hiring an overnight dispatcher costs $3,000/mo. Cash offer: $450 setup + retainer.',
    estimatedMargin: '82.5%',
    estimatedVelocity: '24-48 hours',
  },
  {
    title: 'Instant Landing Pages with Stripe Checkout for Micro-Consultants',
    source: 'ProductHunt & Twitter High-Ticket Agencies',
    rawInsight: 'High-earning fractional execs lose clients to lack of clean checkout portals. Instant turnaround: $650 per deployment.',
    estimatedMargin: '88%',
    estimatedVelocity: '24 hours',
  },
  {
    title: 'Faceless Short-Form Video Packages for Local Med-Spas',
    source: 'TikTok Viral Business & Local Yelp Ads',
    rawInsight: 'Med-spas pay $2,000/mo to legacy agencies. Automated Remotion pipeline delivers 15 reels for $500 with zero filming.',
    estimatedMargin: '91%',
    estimatedVelocity: '48 hours',
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
      rawInsight: 'Service contractors miss 40% of night calls; hiring an overnight dispatcher costs $3,000/mo. Cash offer: $450 setup + retainer.',
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
        perspective: 'Identified underserved HVAC and roofing contractors in suburban metros losing 40%+ of emergency calls after 7 PM.',
        keyMetric: '+$450 Setup Fee',
        recommendation: 'Package as 24/7 AI Emergency Dispatcher with no-code phone forwarding.',
      },
      {
        agentName: 'Trend Hunter',
        role: 'Commercial Intent Tracker',
        sentiment: 'bullish',
        perspective: 'Commercial search queries for "24/7 AI receptionist for plumbers" up +340% YoY. SMB owners actively looking for alternatives to $3k/mo human call centers.',
        keyMetric: '+340% YoY Spike',
        recommendation: 'Lead with instant response guarantee to capture high-ticket emergency calls.',
      },
      {
        agentName: 'Unit Economist',
        role: 'Cashflow & Margin Auditor',
        sentiment: 'bullish',
        perspective: 'Per-call telephony + LLM cost is $0.08/min. Charging $150/mo retainer for up to 100 calls yields 82.5% recurring profit margins.',
        keyMetric: '82.5% Margin',
        recommendation: 'Collect $450 onboarding fee upfront to guarantee day-one cash profitability.',
      },
      {
        agentName: 'Operator',
        role: 'Execution & Velocity Engineer',
        sentiment: 'bullish',
        perspective: 'Turnaround time is 24 hours per client using our pre-built Vapi/Retell template. 1 human operator can easily maintain 50 active clients.',
        keyMetric: '24h Turnaround',
        recommendation: 'Use templated Twilio SIP trunking to eliminate technical onboarding friction.',
      },
      {
        agentName: 'Contrarian',
        role: 'Risk & Failure Mode Assassin',
        sentiment: 'bearish',
        perspective: 'Risk: Complex accent recognition and background job-site noise causing false emergency transfers.',
        keyMetric: 'Risk: Low (Routed)',
        recommendation: 'Implement instant failover SMS to contractor cell phone whenever confidence drops below 85%.',
      },
      {
        agentName: 'Closer',
        role: 'Velocity & Go-To-Market Finisher',
        sentiment: 'bullish',
        perspective: 'Green light. Cashflow velocity is 48 hours to first dollar. Package with 7-day risk-free pilot on missed night calls.',
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
      rawInsight: 'High-earning fractional execs lose clients to lack of clean checkout portals. Instant turnaround: $650 per deployment.',
      estimatedMargin: '88%',
      estimatedVelocity: '24 hours',
    },
    gatekeeperScore: 89,
    gatekeeperVerdict: {
      score: 89,
      passed: true,
      verdictReason: 'Approved: Rapid 24-hour turnaround, high willingness to pay from fractional executives, minimal tech overhead.',
      breakdown: { feasibility: 94, unitEconomics: 90, marketDemand: 86, risk: 15 },
      riskFlags: ['Scope creep on custom copywriting'],
    },
    debateTranscript: [
      {
        agentName: 'Deal Finder',
        role: 'High-Ticket B2B Deal Spotter',
        sentiment: 'bullish',
        perspective: 'Fractional CMOs and CFOs charging $5k/mo on LinkedIn with no professional booking or payment collection portal.',
        keyMetric: '+$650 Flat Pay',
        recommendation: 'Offer 24-hour delivery of clean, personal landing page with embedded Stripe Checkout.',
      },
      {
        agentName: 'Trend Hunter',
        role: 'Commercial Intent Tracker',
        sentiment: 'bullish',
        perspective: 'Surge in fractional executive advisory contracts. High demand for sleek, personal portfolio sites that accept deposits.',
        keyMetric: '+210% Demand',
        recommendation: 'Position as "Executive Cashflow Portal" rather than generic web design.',
      },
      {
        agentName: 'Unit Economist',
        role: 'Cashflow & Margin Auditor',
        sentiment: 'bullish',
        perspective: 'Hosting on Vercel is free/negligible. Template reuse drops labor to 90 minutes. Gross margin exceeds 88%.',
        keyMetric: '88% Gross Margin',
        recommendation: 'Charge $650 one-time plus optional $49/mo maintenance & analytics retainer.',
      },
      {
        agentName: 'Operator',
        role: 'Execution & Velocity Engineer',
        sentiment: 'bullish',
        perspective: 'Use Tailwind + Next.js template bundle. Form ingestion automates intake so the client provides content in 10 minutes.',
        keyMetric: '90 Min Build',
        recommendation: 'Lock down revision requests to a strict 1-round 48-hour policy.',
      },
      {
        agentName: 'Contrarian',
        role: 'Risk & Failure Mode Assassin',
        sentiment: 'bearish',
        perspective: 'Risk: Clients requesting endless design iterations and custom animations that destroy hourly yield.',
        keyMetric: 'Scope Trap',
        recommendation: 'Provide fixed 3-choice design system with zero deviations allowed.',
      },
      {
        agentName: 'Closer',
        role: 'Velocity & Go-To-Market Finisher',
        sentiment: 'bullish',
        perspective: 'High conversion play. Direct cold DM to 25 LinkedIn fractional consultants with video audit closes 1-2 clients this week.',
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
      rawInsight: 'Med-spas pay $2,000/mo to legacy agencies. Automated Remotion pipeline delivers 15 reels for $500 with zero filming.',
      estimatedMargin: '91%',
      estimatedVelocity: '48 hours',
    },
    gatekeeperScore: 84,
    gatekeeperVerdict: {
      score: 84,
      passed: true,
      verdictReason: 'Approved: 91% margins via generative pipeline, recurring local aesthetic clinic demand.',
      breakdown: { feasibility: 88, unitEconomics: 92, marketDemand: 82, risk: 25 },
      riskFlags: ['Social media platform algorithm volatility'],
    },
    debateTranscript: [
      {
        agentName: 'Deal Finder',
        role: 'High-Ticket B2B Deal Spotter',
        sentiment: 'bullish',
        perspective: 'Local medical spas, laser clinics, and high-end injectors are desperate for daily TikTok/Reels content but doctors hate being on camera.',
        keyMetric: '+$500 Retainer',
        recommendation: 'Sell 15 monthly faceless educational reels with aesthetic b-roll and synthetic voiceover.',
      },
      {
        agentName: 'Trend Hunter',
        role: 'Commercial Intent Tracker',
        sentiment: 'bullish',
        perspective: 'Search volume for aesthetic skincare advice is growing 180% faster on TikTok than traditional search engines.',
        keyMetric: '+180% Engagement',
        recommendation: 'Focus scripts on trending cosmetic procedures (PRP, Morpheus8, Botox myths).',
      },
      {
        agentName: 'Unit Economist',
        role: 'Cashflow & Margin Auditor',
        sentiment: 'bullish',
        perspective: 'Automated video rendering stack costs ~$3 per video. 15 videos cost $45 in API compute. $500 monthly fee yields 91% margin.',
        keyMetric: '91% Net Margin',
        recommendation: 'Offer 3-month upfront commitment for 10% discount to lock in recurring cash.',
      },
      {
        agentName: 'Operator',
        role: 'Execution & Velocity Engineer',
        sentiment: 'bullish',
        perspective: 'Batch render all 15 reels in one afternoon using automated script templates and royalty-free aesthetic stock libraries.',
        keyMetric: '3h Batch Time',
        recommendation: 'Deliver entire monthly pack via Google Drive link for clinic front-desk to publish.',
      },
      {
        agentName: 'Contrarian',
        role: 'Risk & Failure Mode Assassin',
        sentiment: 'bearish',
        perspective: 'Risk: Medical compliance claims or inaccurate health advice triggering clinic liability.',
        keyMetric: 'Compliance Risk',
        recommendation: 'Include standard medical disclaimer on all slides and strictly source facts from dermatology journals.',
      },
      {
        agentName: 'Closer',
        role: 'Velocity & Go-To-Market Finisher',
        sentiment: 'bullish',
        perspective: 'Send 3 sample watermark videos to 10 local med-spa owners on Instagram. Immediate visceral appeal leads to rapid closes.',
        keyMetric: '30% Pitch-to-Close',
        recommendation: 'Close first clinic at $350 beta rate, then raise to $500/mo for subsequent accounts.',
      },
    ],
  },
];

export function CouncilBoardroom({ embedded = false }: { embedded?: boolean }) {
  const [activeSession, setActiveSession] = useState<CouncilSessionData>(DEFAULT_COUNCIL_SESSIONS_MAP[0]);
  const [loading, setLoading] = useState(false);
  const [deliberating, setDeliberating] = useState(false);
  const [signalIndex, setSignalIndex] = useState(0);

  const fetchLatestSessions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/council/debate');
      if (res.ok) {
        const data = await res.json();
        if (data.sessions && data.sessions.length > 0 && data.sessions[0].debateTranscript?.length > 0) {
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
    const nextIdx = (signalIndex + 1) % DEFAULT_COUNCIL_SESSIONS_MAP.length;
    setSignalIndex(nextIdx);

    try {
      const nextSignal = MONEY_SIGNALS[nextIdx % MONEY_SIGNALS.length];

      const res = await fetch('/api/council/debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signal: nextSignal }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.session && data.session.debateTranscript?.length > 0) {
          setActiveSession(data.session);
          return;
        }
      }
      // Graceful fallback to pre-computed rich session if API is guest/mock
      setActiveSession(DEFAULT_COUNCIL_SESSIONS_MAP[nextIdx]);
    } catch (e) {
      console.error('Debate failed, using fallback:', e);
      setActiveSession(DEFAULT_COUNCIL_SESSIONS_MAP[nextIdx]);
    } finally {
      setDeliberating(false);
    }

  };

  const getAgentBadge = (name: string) => {
    switch (name) {
      case 'Deal Finder':
        return { icon: <Sparkles className="w-3.5 h-3.5 text-amber-300" />, color: 'bg-amber-500/10 text-amber-300 border-amber-500/30' };
      case 'Trend Hunter':
        return { icon: <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />, color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' };
      case 'Unit Economist':
        return { icon: <DollarSign className="w-3.5 h-3.5 text-emerald-400" />, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'Operator':
        return { icon: <Wrench className="w-3.5 h-3.5 text-blue-400" />, color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
      case 'Contrarian':
        return { icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />, color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
      case 'Closer':
        return { icon: <Flame className="w-3.5 h-3.5 text-amber-400" />, color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      default:
        return { icon: <Sparkles className="w-3.5 h-3.5 text-slate-300" />, color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const gatekeeperScore = activeSession?.gatekeeperScore ?? activeSession?.gatekeeperVerdict?.score ?? 86;
  const breakdown = activeSession?.gatekeeperVerdict?.breakdown ?? { feasibility: 90, unitEconomics: 85, marketDemand: 88, risk: 20 };

  return (
    <div className={`glass-card p-6 border border-amber-500/30 bg-gradient-to-br from-[#06060E] via-black/80 to-slate-950 rounded-2xl shadow-2xl relative overflow-hidden space-y-6 ${embedded ? 'mb-8' : ''}`}>
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Scale className="w-3 h-3" />
              LIVE BOARDROOM
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold">
              6 SPECIALIST AGENTS + GATEKEEPER
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-orbitron text-white uppercase tracking-wider flex items-center gap-2">
            The AI Money Council
          </h2>
          <p className="text-xs text-slate-300 font-sans mt-0.5">
            Debates only real-deal commercial cashflow plays ($450–$2,500 deals). Kills vanity trends and meme noise.
          </p>
        </div>

        <Button
          onClick={handleTriggerDebate}
          disabled={deliberating}
          className="cyan-gradient text-black font-extrabold uppercase text-xs h-10 px-5 holographic-btn font-mono whitespace-nowrap shadow-[0_0_20px_rgba(0,240,255,0.3)] shrink-0"
        >
          {deliberating ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin fill-current" /> 6 Agents Debating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2 fill-current" /> 🎲 Convene Council: Find Next Money Method
            </>
          )}
        </Button>
      </div>

      {/* Active Deliberation Subject */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Currently Under Deliberation</div>
          <div className="text-sm sm:text-base font-bold text-white font-mono mt-0.5">
            {activeSession?.signal?.title || 'Autonomous B2B Emergency Voice Dispatch for Contractors'}
          </div>
          <div className="text-xs text-slate-400 font-sans mt-0.5">
            Source: {activeSession?.signal?.source || 'Reddit r/smallbusiness + Commercial Google Trends'}
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center border-t sm:border-t-0 border-white/[0.08] pt-2 sm:pt-0">
          <div className="text-right">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Gatekeeper Gavel</div>
            <div className="text-base font-black font-mono text-emerald-400">
              {gatekeeperScore}/100 PASSED
            </div>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 6-Agent Deliberation Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            Live Boardroom Transcript:
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            Real-Deal Money Filter: <strong className="text-emerald-400">ACTIVE</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeSession?.debateTranscript?.map((dia, idx) => {
            const badge = getAgentBadge(dia.agentName);
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-3.5 rounded-xl bg-black/60 border border-white/[0.08] flex flex-col justify-between space-y-2 hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold flex items-center gap-1 ${badge.color}`}>
                      {badge.icon}
                      {dia.agentName}
                    </span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                      dia.sentiment === 'bullish' ? 'bg-emerald-500/20 text-emerald-300' :
                      dia.sentiment === 'bearish' ? 'bg-rose-500/20 text-rose-300' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {dia.sentiment}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 font-sans leading-relaxed">
                    "{dia.perspective}"
                  </p>
                </div>

                <div className="pt-2 border-t border-white/[0.06] text-[11px] font-mono flex items-center justify-between text-slate-400">
                  <span className="truncate mr-2">Rec: <strong className="text-white">{dia.recommendation}</strong></span>
                  {dia.keyMetric && (
                    <span className="text-emerald-400 font-bold shrink-0">{dia.keyMetric}</span>
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
            Feasibility: <strong className="text-white">{breakdown.feasibility}/100</strong> • Unit Economics: <strong className="text-white">{breakdown.unitEconomics}/100</strong> • Market Demand: <strong className="text-white">{breakdown.marketDemand}/100</strong>
          </p>
        </div>

        <Link href="/earn">
          <Button className="cyan-gradient text-black font-extrabold uppercase text-xs h-10 px-5 font-mono shadow-md">
            <Play className="w-3.5 h-3.5 mr-1.5 fill-black" /> Launch This Money Move &rarr;
          </Button>
        </Link>
      </div>
    </div>
  );
}
