'use client';

import { motion } from 'framer-motion';
import {
  Flame,
  Bot,
  Play,
  ArrowRight,
  DollarSign,
  Radio,
  Zap,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { AgentCompanionModal } from '@/components/chat/AgentCompanionModal';
import { MarketDebriefModal } from '@/components/debrief/MarketDebriefModal';

interface DashboardClientProps {
  user: {
    name: string | null;
    role: string;
    realIncomeUsdc: number;
    completedCount: number;
    userTasks: any[];
    favorCredits: number;
  } | null;
  trendingMoves: any[];
  userTaskIds: string[];
  trendSummary: string;
}

export function DashboardClient({ user, trendingMoves }: DashboardClientProps) {
  const [isCompanionOpen, setIsCompanionOpen] = useState(false);
  const [isDebriefOpen, setIsDebriefOpen] = useState(false);
  const realIncomeUsdc = user?.realIncomeUsdc ?? 0;
  const completedCount = user?.completedCount ?? 0;

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-8 space-y-8">
      {/* 1. Top Section: Verified Cash & The Face of Trendly */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Real Cash Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-5 glass-card p-6 border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 via-black/60 to-black/80 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" /> Verified Real Income
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Ledger Backed
              </span>
            </div>
            <div className="text-4xl sm:text-5xl font-extrabold font-mono text-white tracking-tight my-2">
              ${realIncomeUsdc.toFixed(2)}
              <span className="text-xs font-normal text-slate-400 ml-2 font-mono">USDC</span>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              Completed Deals: <strong className="text-white">{completedCount}</strong> closed and settled.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-white/[0.08] flex items-center justify-between">
            <Link href="/earn">
              <Button size="sm" className="cyan-gradient text-black font-extrabold uppercase text-xs h-9 px-4 font-mono">
                <Zap className="w-3.5 h-3.5 mr-1 fill-black" /> Make More Money
              </Button>
            </Link>
            <span className="text-[11px] text-slate-400 font-mono">100% Payouts Ready</span>
          </div>
        </motion.div>

        {/* The Face of Trendly: Visual AI Companion */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="lg:col-span-7 glass-card p-6 border border-[#00F0FF]/30 bg-gradient-to-r from-[#00F0FF]/10 via-black/60 to-[#FFD700]/10 flex flex-col justify-between"
        >
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-black/60 border border-[#00F0FF]/40 flex items-center justify-center text-4xl shadow-[0_0_25px_rgba(0,240,255,0.3)] shrink-0 animate-pulse">
              🤖
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#00F0FF]/20 text-[#00F0FF] px-2 py-0.5 rounded border border-[#00F0FF]/30">
                  THE FACE OF TRENDLY // VISUAL AI
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">LIVE BRIEF READY</span>
              </div>
              <h2 className="text-lg font-bold text-white font-mono">
                Spoken Market Intelligence & Opportunity Debrief
              </h2>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Listen to Trendly’s AI synthesize today’s highest-margin deals, Reddit demand spikes, and live buyer requests.
              </p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/[0.08] flex flex-wrap items-center gap-3">
            <Button
              onClick={() => setIsDebriefOpen(true)}
              className="cyan-gradient text-black font-extrabold uppercase text-xs h-9 px-4 holographic-btn font-mono"
            >
              <Bot className="w-4 h-4 mr-1.5 fill-current" /> 🎙️ Play Spoken Debrief
            </Button>
            <Button
              onClick={() => setIsCompanionOpen(true)}
              variant="outline"
              className="border-[#00F0FF]/40 text-[#00F0FF] bg-[#00F0FF]/10 text-xs font-mono uppercase h-9 px-4 hover:bg-[#00F0FF]/20"
            >
              💬 Talk to Trendly AI
            </Button>
          </div>
        </motion.div>
      </div>

      {/* 2. Middle Section: Today's High-Margin Money Tasks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-orbitron text-white uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              Today's Money Making Tasks
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Continuously scraped and vetted for high cash margins. Click any task to start closing.
            </p>
          </div>
          <Link
            href="/earn"
            className="text-xs text-[#00F0FF] hover:underline flex items-center gap-1 font-mono"
          >
            All Earn Options <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trendingMoves.slice(0, 6).map((task, idx) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="glass-card p-5 border border-white/[0.08] hover:border-[#00F0FF]/40 transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase font-semibold">
                    {task.category || 'Revenue Move'}
                  </span>
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    +${task.estimatedEarningsLow}-${task.estimatedEarningsHigh}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white font-mono group-hover:text-[#00F0FF] transition-colors line-clamp-1">
                  {task.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 font-sans leading-relaxed">
                  {task.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">
                  ⏱️ {task.timeToFirstDollar || '24-48 hrs'}
                </span>
                <Link href={`/tasks/${task.id}`}>
                  <Button size="sm" className="h-8 px-3.5 text-xs font-mono font-bold bg-white text-black hover:bg-slate-200">
                    <Play className="w-3 h-3 mr-1 fill-black" /> Run Move
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 3. Bottom Section: Trends Radar Preview */}
      <div className="glass-card p-6 border border-white/[0.08] bg-slate-950/60 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-[#00F0FF] animate-pulse" />
            <h3 className="font-bold text-white text-base font-orbitron uppercase tracking-wider">
              Trends Radar (Hot Topics & News)
            </h3>
          </div>
          <Link
            href="/trends"
            className="text-xs text-[#00F0FF] hover:underline flex items-center gap-1 font-mono"
          >
            Explore Full Radar <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <p className="text-xs text-slate-400 font-sans leading-relaxed">
          The continuous scraping engine captures viral cultural topics, trending searches, and breaking news. Viral topics live here; verified high-margin opportunities are promoted to Money Tasks above.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06]">
            <span className="text-[10px] font-mono text-cyan-400 font-semibold block mb-1">Reddit & TikTok</span>
            <div className="text-xs font-bold text-slate-200">AI Voice After-Hours Receptionists</div>
            <div className="text-[11px] text-emerald-400 font-mono mt-1">+140% Search Velocity</div>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06]">
            <span className="text-[10px] font-mono text-purple-400 font-semibold block mb-1">ProductHunt & X</span>
            <div className="text-xs font-bold text-slate-200">Instant Landing Pages with Stripe Checkout</div>
            <div className="text-[11px] text-emerald-400 font-mono mt-1">+85% Conversion Spike</div>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06]">
            <span className="text-[10px] font-mono text-amber-400 font-semibold block mb-1">Google Trends</span>
            <div className="text-xs font-bold text-slate-200">Faceless Video Monetization Templates</div>
            <div className="text-[11px] text-emerald-400 font-mono mt-1">+210% Search Growth</div>
          </div>
        </div>
      </div>

      {/* Global Modals */}
      <AgentCompanionModal
        isOpen={isCompanionOpen}
        onClose={() => setIsCompanionOpen(false)}
        user={user as any}
      />

      <MarketDebriefModal
        isOpen={isDebriefOpen}
        onClose={() => setIsDebriefOpen(false)}
      />
    </div>
  );
}
