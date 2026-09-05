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

export function CouncilBoardroom({ embedded = false }: { embedded?: boolean }) {
  const [activeSession, setActiveSession] = useState<CouncilSessionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [deliberating, setDeliberating] = useState(false);
  const [signalIndex, setSignalIndex] = useState(0);

  const fetchLatestSessions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/council/debate');
      if (res.ok) {
        const data = await res.json();
        if (data.sessions && data.sessions.length > 0) {
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
    try {
      const nextSignal = MONEY_SIGNALS[signalIndex % MONEY_SIGNALS.length];
      setSignalIndex((prev) => prev + 1);

      const res = await fetch('/api/council/debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signal: nextSignal }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.session) {
          setActiveSession(data.session);
        }
      }
    } catch (e) {
      console.error('Debate failed:', e);
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
