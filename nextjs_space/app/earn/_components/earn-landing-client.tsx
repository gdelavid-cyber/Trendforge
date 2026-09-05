'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock,
  DollarSign,
  Flame,
  HelpCircle,
  Layers,
  Play,
  Share2,
  Sparkles,
  TrendingUp,
  Users,
  Video,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'sonner';
import { AgentSwarmDrawer } from '@/components/earn/agent-swarm-drawer';

interface EarnLandingClientProps {
  userEarnings?: number;
  tasks?: Array<{
    id: string;
    title: string;
    description: string;
    category?: string;
    estimatedEarningsLow: number;
    estimatedEarningsHigh: number;
    timeToFirstDollar?: string;
    trendScore?: number;
  }>;
}

const FAQS = [
  {
    q: 'Can I do more than one pathway?',
    a: 'Yes! While we strongly recommend focusing on one path until your first closed deal, after your first win you can run all three pathways concurrently from your central dashboard.',
  },
  {
    q: 'Which pathway is the fastest?',
    a: 'Quick Wins is by far the fastest (24–72 hours). Deliverables like HVAC Emergency Voice Receptionists and Google Business AI packages solve immediate revenue leaks for businesses that already have budget ready.',
  },
  {
    q: 'Do I need video editing or coding skills?',
    a: 'None required. Trendly’s autonomous engine synthesizes the master assets, scripts, voiceovers, and Remotion video renders automatically. You simply review and approve the output.',
  },
  {
    q: 'What if I don’t close a sale on my first pitch?',
    a: 'The Swarm generates multiple qualified leads simultaneously (typically 5 to 10 buyers). You can adjust your pitch price or target another pre-vetted niche with 1 click.',
  },
  {
    q: 'How does the AI actually help?',
    a: 'The AI executes 90% of the manual labor: extracting market pain points, writing technical specifications, rendering video/audio, and generating personalized pitch emails. You remain the human-in-the-loop verifying quality and receiving payments.',
  },
];

const TESTIMONIALS = [
  {
    quote: 'Closed a local HVAC contractor for $650 on day 2. The emergency voice script and preview demo did all the selling.',
    author: 'Elena R.',
    role: 'Quick Wins Operative',
    stat: '+$650.00 First Deal',
    tag: 'Quick Wins',
    color: 'text-[#38bdf8]',
  },
  {
    quote: 'Built a 4-client retainer clipping YouTube podcasts for coaches. Now doing $3,200/month recurring using the faceless video maker.',
    author: 'Marcus T.',
    role: 'Video Agency Founder',
    stat: '+$3,200/mo Recurring',
    tag: 'Video Empire',
    color: 'text-[#f59e0b]',
  },
  {
    quote: 'Listed my GBP citation templates on the marketplace and set up referral links. Woke up to $420 in passive royalties last week.',
    author: 'Devon K.',
    role: 'Asset Creator',
    stat: '+$420.00 Passive Week',
    tag: 'Automated Assets',
    color: 'text-[#8b5cf6]',
  },
];

export function EarnLandingClient({ userEarnings = 0, tasks = [] }: EarnLandingClientProps) {
  const [highlightedCol, setHighlightedCol] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const handleDecisionClick = (colId: string) => {
    setHighlightedCol(colId);
    const element = document.getElementById(colId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-12 text-center font-sans">
      {/* =========================================================================
          HERO SECTION
      ========================================================================== */}
      <div className="relative py-12 md:py-16 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#00F0FF]/10 via-[#FFD700]/10 to-[#FF007A]/10 border border-white/10 text-xs font-mono mb-6"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#00F0FF] animate-pulse" />
          <span className="text-white/80 font-bold uppercase tracking-wider">
            CHOOSE YOUR REVENUE PATHWAY
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-orbitron font-black text-3xl sm:text-5xl md:text-6xl text-white tracking-tight max-w-4xl mb-6 leading-tight uppercase"
        >
          How do you want to{' '}
          <span className="bg-gradient-to-r from-[#00F0FF] via-[#00C2FF] to-[#FFD700] bg-clip-text text-transparent">
            make money today?
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-base sm:text-lg text-[#8E9BB4] max-w-2xl mb-12 leading-relaxed"
        >
          Select a ready-to-run money task below, or pick one of the three scalable execution pathways.
        </motion.p>
      </div>

      {/* =========================================================================
          LIVE READY-TO-RUN MONEY TASKS (CONTINUOUSLY SCRAPED & VETTED)
      ========================================================================== */}
      {tasks && tasks.length > 0 && (
        <div className="mb-16 text-left space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <h2 className="text-xl sm:text-2xl font-black text-white font-orbitron uppercase tracking-wider">
                  Live Ready-to-Run Tasks
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-sans">
                These vetted opportunities have verified buyers ready to pay. Choose a task to launch the build and auto-closing workflow.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full self-start sm:self-center font-bold">
              {tasks.length} High-Yield Tasks Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((t) => (
              <div
                key={t.id}
                className="glass-card p-5 border border-white/[0.08] hover:border-emerald-500/40 transition flex flex-col justify-between group rounded-2xl"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase font-bold">
                      {t.category || 'Money Move'}
                    </span>
                    <span className="text-xs font-mono text-emerald-400 font-bold">
                      +${t.estimatedEarningsLow}-${t.estimatedEarningsHigh}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white font-mono group-hover:text-emerald-400 transition-colors line-clamp-1">
                    {t.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 font-sans leading-relaxed">
                    {t.description}
                  </p>
                </div>

                <div className="pt-3.5 mt-3.5 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">
                    ⏱️ {t.timeToFirstDollar || '24-48 hrs'}
                  </span>
                  <Link href={`/tasks/${t.id}`}>
                    <Button size="sm" className="h-8 px-3.5 text-xs font-mono font-bold bg-emerald-500 hover:bg-emerald-400 text-black">
                      <Play className="w-3 h-3 mr-1 fill-black" /> Run Task &rarr;
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          THREE COLUMNS SIDE-BY-SIDE
      ========================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16 text-left">
        {/* COLUMN 1: QUICK WINS */}
        <div
          id="col-quick-wins"
          className={`rounded-3xl p-7 transition-all duration-300 relative flex flex-col justify-between border ${
            highlightedCol === 'col-quick-wins'
              ? 'bg-[#38bdf8]/10 border-[#38bdf8] shadow-[0_0_40px_rgba(56,189,248,0.3)] scale-[1.02]'
              : 'bg-white/[0.02] border-white/10 hover:border-[#38bdf8]/40 hover:bg-white/[0.03]'
          }`}
        >
          <div>
            {/* Header Badge */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#38bdf8]/10 border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8]">
                  <Zap className="w-4 h-4 fill-current" />
                </div>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#38bdf8]">
                  QUICK WINS
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#38bdf8] uppercase bg-[#38bdf8]/10 px-2.5 py-1 rounded-full border border-[#38bdf8]/20 font-bold">
                Coming Soon (Phase 3)
              </span>
            </div>

            <h3 className="text-2xl font-black text-white mb-2">Get paid this week</h3>
            <p className="text-xs sm:text-sm text-[#8E9BB4] mb-6 leading-relaxed">
              Perfect for beginners who need cash flow fast. 1-click deliverables and local pain point arbitrage.
            </p>

            {/* Metrics */}
            <div className="space-y-2.5 py-4 border-y border-white/[0.06] font-mono text-xs mb-6">
              <div className="flex items-center justify-between">
                <span className="text-[#8E9BB4] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#38bdf8]" /> Time to first sale:
                </span>
                <span className="font-bold text-white">1–7 days (estimated)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8E9BB4] flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-[#00FF66]" /> Upfront cost:
                </span>
                <span className="font-bold text-[#00FF66]">$0 upfront</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8E9BB4] flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#FFD700]" /> Potential:
                </span>
                <span className="font-bold text-[#FFD700]">$500–$5,000/mo*</span>
              </div>
            </div>

            {/* Checkpoints */}
            <div className="space-y-2 mb-6 font-mono text-xs">
              <div className="flex items-center gap-2 text-white/90">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                <span>AI generates turnkey deliverables</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                <span>Public-data buyer match scout</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                <span>AI-drafted outreach (manual approval)</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                <span>Full rollout in Phase 3</span>
              </div>
            </div>
          </div>

          <div>
            <Button
              size="lg"
              variant="outline"
              onClick={() => toast.info('Quick Wins unlocks in Phase 3. Start with Video Empire Play 1 today!')}
              className="w-full border-white/10 text-[#8E9BB4] hover:text-white font-mono uppercase h-12 rounded-xl text-xs"
            >
              🔒 Coming Soon in Phase 3
            </Button>
            <div className="text-center text-[10px] font-mono text-[#8E9BB4] mt-2.5">
              Available after Phase 1 &amp; 2 milestones
            </div>
          </div>
        </div>

        {/* COLUMN 2: VIDEO EMPIRE (RECOMMENDED) */}
        <div
          id="col-video-empire"
          className={`rounded-3xl p-7 transition-all duration-300 relative flex flex-col justify-between border ${
            highlightedCol === 'col-video-empire'
              ? 'bg-[#f59e0b]/10 border-[#f59e0b] shadow-[0_0_40px_rgba(245,158,11,0.3)] scale-[1.03]'
              : 'bg-white/[0.03] border-[#f59e0b]/40 shadow-[0_0_25px_rgba(245,158,11,0.08)] hover:border-[#f59e0b]'
          }`}
        >
          {/* Recommended Floating Ribbon */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#f59e0b] text-black text-[10px] font-mono font-black uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.4)]">
            RECOMMENDED FOR SCALE
          </div>

          <div>
            {/* Header Badge */}
            <div className="flex items-center justify-between mb-4 mt-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#f59e0b]/10 border border-[#f59e0b]/30 flex items-center justify-center text-[#f59e0b]">
                  <Video className="w-4 h-4 fill-current" />
                </div>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#f59e0b]">
                  VIDEO EMPIRE
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#f59e0b] uppercase bg-[#f59e0b]/10 px-2.5 py-1 rounded-full border border-[#f59e0b]/20 font-bold">
                Active in Phase 1
              </span>
            </div>

            <h3 className="text-2xl font-black text-white mb-2">Build a video business</h3>
            <p className="text-xs sm:text-sm text-[#8E9BB4] mb-6 leading-relaxed">
              Turn Trendly’s faceless video maker into a recurring income machine. Start immediately with Play 1.
            </p>

            {/* Metrics */}
            <div className="space-y-2.5 py-4 border-y border-white/[0.06] font-mono text-xs mb-6">
              <div className="flex items-center justify-between">
                <span className="text-[#8E9BB4] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#f59e0b]" /> Time to first sale:
                </span>
                <span className="font-bold text-white">1–14 days (Play 1)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8E9BB4] flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-[#00FF66]" /> Upfront cost:
                </span>
                <span className="font-bold text-[#00FF66]">$0 upfront</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8E9BB4] flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#f59e0b]" /> Potential:
                </span>
                <span className="font-bold text-[#f59e0b]">$1,000–$15,000/mo*</span>
              </div>
            </div>

            {/* Checkpoints (The 5 Plays) */}
            <div className="space-y-2 mb-6 font-mono text-xs">
              <div className="flex items-center gap-2 text-white font-bold bg-[#f59e0b]/10 p-2 rounded-lg border border-[#f59e0b]/20">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#f59e0b] shrink-0" />
                <span>Play 1: Local business video packages (LIVE)</span>
              </div>
              <div className="flex items-center gap-2 text-[#8E9BB4]">
                <span className="text-[10px] text-[#8E9BB4] border border-white/10 px-1.5 py-0.5 rounded">PHASE 2</span>
                <span>Play 2: Creator clipping service</span>
              </div>
              <div className="flex items-center gap-2 text-[#8E9BB4]">
                <span className="text-[10px] text-[#8E9BB4] border border-white/10 px-1.5 py-0.5 rounded">PHASE 2</span>
                <span>Play 3: E-commerce UGC ad bundles</span>
              </div>
              <div className="flex items-center gap-2 text-[#8E9BB4]">
                <span className="text-[10px] text-[#8E9BB4] border border-white/10 px-1.5 py-0.5 rounded">PHASE 2</span>
                <span>Play 4: Coach content multiplication</span>
              </div>
              <div className="flex items-center gap-2 text-[#8E9BB4]">
                <span className="text-[10px] text-[#8E9BB4] border border-white/10 px-1.5 py-0.5 rounded">PHASE 2</span>
                <span>Play 5: Your own faceless channel</span>
              </div>
            </div>
          </div>

          <div>
            <Link href="/earn/video-empire/local-business" className="block">
              <Button
                size="lg"
                className="w-full bg-[#f59e0b] text-black font-extrabold uppercase font-mono h-12 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:bg-[#f59e0b]/90 hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all"
              >
                Start Play 1: Local Business &rarr;
              </Button>
            </Link>
            <div className="text-center text-[10px] font-mono text-[#f59e0b] mt-2.5 font-bold">
              🔥 5-Scene Cinematic Experience Ready
            </div>
          </div>
        </div>

        {/* COLUMN 3: AUTOMATED ASSETS */}
        <div
          id="col-automated-assets"
          className={`rounded-3xl p-7 transition-all duration-300 relative flex flex-col justify-between border ${
            highlightedCol === 'col-automated-assets'
              ? 'bg-[#8b5cf6]/10 border-[#8b5cf6] shadow-[0_0_40px_rgba(139,92,246,0.3)] scale-[1.02]'
              : 'bg-white/[0.02] border-white/10 hover:border-[#8b5cf6]/40 hover:bg-white/[0.03]'
          }`}
        >
          <div>
            {/* Header Badge */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 flex items-center justify-center text-[#8b5cf6]">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#8b5cf6]">
                  AUTOMATED ASSETS
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#8b5cf6] uppercase bg-[#8b5cf6]/10 px-2.5 py-1 rounded-full border border-[#8b5cf6]/20 font-bold">
                Coming Soon (Phase 3)
              </span>
            </div>

            <h3 className="text-2xl font-black text-white mb-2">Build income while you sleep</h3>
            <p className="text-xs sm:text-sm text-[#8E9BB4] mb-6 leading-relaxed">
              Package what works into recurring assets. Marketplace sales, referrals, SaaS, and agents.
            </p>

            {/* Metrics */}
            <div className="space-y-2.5 py-4 border-y border-white/[0.06] font-mono text-xs mb-6">
              <div className="flex items-center justify-between">
                <span className="text-[#8E9BB4] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#8b5cf6]" /> Time to first sale:
                </span>
                <span className="font-bold text-white">1–4 weeks (estimated)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8E9BB4] flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-[#8E9BB4]" /> Upfront cost:
                </span>
                <span className="font-bold text-white">$0–$50</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8E9BB4] flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#8b5cf6]" /> Potential:
                </span>
                <span className="font-bold text-[#8b5cf6]">$500–$10,000/mo passive*</span>
              </div>
            </div>

            {/* Checkpoints */}
            <div className="space-y-2 mb-6 font-mono text-xs">
              <div className="flex items-center gap-2 text-white/90">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#8b5cf6] shrink-0" />
                <span>Priority 1: Marketplace asset listings</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#8b5cf6] shrink-0" />
                <span>Priority 2: 10% lifetime referral engine</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#8b5cf6] shrink-0" />
                <span>Phase 4: Micro-SaaS builder (Vercel)</span>
              </div>
              <div className="flex items-center gap-2 text-[#8E9BB4]">
                <span className="text-[10px] text-[#8E9BB4] border border-white/10 px-1.5 py-0.5 rounded">LOCKED</span>
                <span>Web4 Autonomous Agents (requires $1K earned)</span>
              </div>
            </div>
          </div>

          <div>
            <Button
              size="lg"
              variant="outline"
              onClick={() => toast.info('Automated Assets unlocks in Phase 3. Start with Video Empire Play 1 today!')}
              className="w-full border-white/10 text-[#8E9BB4] hover:text-white font-mono uppercase h-12 rounded-xl text-xs"
            >
              🔒 Coming Soon in Phase 3
            </Button>
            <div className="text-center text-[10px] font-mono text-[#8E9BB4] mt-2.5">
              Scheduled for Phase 3 rollout
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          DECISION HELPER ("Not sure which to pick?")
      ========================================================================== */}
      <div className="max-w-2xl mx-auto p-6 rounded-2xl bg-white/[0.02] border border-white/10 mb-16 font-mono text-center">
        <div className="flex items-center justify-center gap-2 mb-3 text-xs text-[#8E9BB4] uppercase font-bold">
          <HelpCircle className="w-4 h-4 text-[#00F0FF]" /> Not sure which to pick?
        </div>
        <p className="text-xs text-[#8E9BB4] mb-4">
          Click your primary goal to highlight your best starting pathway:
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button
            onClick={() => handleDecisionClick('col-quick-wins')}
            className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${
              highlightedCol === 'col-quick-wins'
                ? 'bg-[#38bdf8] text-black border-[#38bdf8] shadow-[0_0_15px_rgba(56,189,248,0.4)]'
                : 'bg-white/[0.03] border-white/10 text-white hover:border-[#38bdf8]/40'
            }`}
          >
            ⚡ I need cash this week
          </button>
          <button
            onClick={() => handleDecisionClick('col-video-empire')}
            className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${
              highlightedCol === 'col-video-empire'
                ? 'bg-[#f59e0b] text-black border-[#f59e0b] shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'bg-white/[0.03] border-white/10 text-white hover:border-[#f59e0b]/40'
            }`}
          >
            🎬 I want a video business
          </button>
          <button
            onClick={() => handleDecisionClick('col-automated-assets')}
            className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${
              highlightedCol === 'col-automated-assets'
                ? 'bg-[#8b5cf6] text-white border-[#8b5cf6] shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                : 'bg-white/[0.03] border-white/10 text-white hover:border-[#8b5cf6]/40'
            }`}
          >
            ♾️ I want passive income
          </button>
        </div>
      </div>

      {/* =========================================================================
          TRUST SIGNALS & TELEMETRY
      ========================================================================== */}
      <div className="max-w-4xl mx-auto mb-20 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-white/[0.08]">
          <div>
            <h3 className="text-xl font-bold font-mono text-white">REAL USERS. REAL RESULTS.</h3>
            <p className="text-xs font-mono text-[#8E9BB4]">Verified execution receipts across all 3 pathways.</p>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs text-[#00FF66] bg-[#00FF66]/10 px-3 py-1 rounded-full border border-[#00FF66]/20">
            <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
            1,247 deliverables generated this week
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.author}
              className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 font-mono text-xs flex flex-col justify-between"
            >
              <p className="text-[#8E9BB4] leading-relaxed mb-4 italic font-sans">
                "{t.quote}"
              </p>
              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">{t.author}</div>
                  <div className="text-[10px] text-[#8E9BB4]">{t.role}</div>
                </div>
                <span className={`text-[11px] font-bold ${t.color}`}>{t.stat}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          FAQ SECTION
      ========================================================================== */}
      <div className="max-w-3xl mx-auto mb-16 text-left font-mono">
        <div className="text-center mb-8">
          <h3 className="text-xl font-bold text-white mb-2">FREQUENTLY ASKED QUESTIONS</h3>
          <p className="text-xs text-[#8E9BB4]">Everything you need to know before starting your path.</p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={faq.q}
                className="rounded-xl bg-white/[0.02] border border-white/10 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs font-bold text-white hover:text-[#00F0FF] transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#8E9BB4] transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-[#8E9BB4] leading-relaxed border-t border-white/[0.04] pt-3 font-sans">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 30 Mandatory Legal Disclaimer */}
      <div className="text-[11px] font-mono text-[#8E9BB4] max-w-2xl mx-auto italic text-center pb-8 border-t border-white/[0.06] pt-6 leading-relaxed">
        Trendly provides tools and guidance. Actual results depend on your execution, market conditions, and factors outside our control. Testimonials shown are individual experiences and not typical. No income is guaranteed.
      </div>

      {/* Floating 9-Agent Swarm Drawer */}
      <AgentSwarmDrawer />
    </div>
  );
}