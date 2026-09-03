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

interface EarnLandingClientProps {
  userEarnings?: number;
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

export function EarnLandingClient({ userEarnings = 0 }: EarnLandingClientProps) {
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
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-[#00F0FF] mb-6 backdrop-blur-md"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="font-bold tracking-wider uppercase">
            THE 3 REVENUE ARCHITECTURES
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight max-w-4xl"
        >
          Choose Your Path To{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38bdf8] via-[#f59e0b] to-[#8b5cf6]">
            Earning
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-base sm:text-lg text-[#8E9BB4] max-w-2xl mb-12 leading-relaxed"
        >
          Three proven ways to make money with Trendly. Pick the one that fits your goals, schedule, and capital.
        </motion.p>
      </div>

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
              <span className="text-[10px] font-mono text-[#8E9BB4] uppercase bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/5">
                Fastest Cashflow
              </span>
            </div>

            <h3 className="text-2xl font-black text-white mb-2">Get paid this week</h3>
            <p className="text-xs sm:text-sm text-[#8E9BB4] mb-6 leading-relaxed">
              Perfect for beginners who need cash flow fast. AI builds the deliverable and finds the buyer.
            </p>

            {/* Metrics */}
            <div className="space-y-2.5 py-4 border-y border-white/[0.06] font-mono text-xs mb-6">
              <div className="flex items-center justify-between">
                <span className="text-[#8E9BB4] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#38bdf8]" /> Time to first $:
                </span>
                <span className="font-bold text-white">24–72 hours</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8E9BB4] flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-[#00FF66]" /> Upfront capital:
                </span>
                <span className="font-bold text-[#00FF66]">$0 upfront</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8E9BB4] flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#FFD700]" /> Potential:
                </span>
                <span className="font-bold text-[#FFD700]">$2K–$5K/mo</span>
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
                <span>AI scouts verified local buyers</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                <span>AI drafts personalized outreach</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                <span>You review, approve &amp; collect</span>
              </div>
            </div>
          </div>

          <div>
            <Link href="/earn/quick-wins" className="block">
              <Button
                size="lg"
                className="w-full bg-[#38bdf8] text-black font-extrabold uppercase font-mono h-12 rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.3)] hover:bg-[#38bdf8]/90 hover:shadow-[0_0_30px_rgba(56,189,248,0.5)] transition-all"
              >
                Start Quick Wins <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
            <div className="text-center text-[10px] font-mono text-[#8E9BB4] mt-2.5">
              ⭐⭐⭐⭐⭐ Most popular starting path
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
                5 Money Plays
              </span>
            </div>

            <h3 className="text-2xl font-black text-white mb-2">Build a video business</h3>
            <p className="text-xs sm:text-sm text-[#8E9BB4] mb-6 leading-relaxed">
              Turn Trendly’s faceless video maker into a recurring income machine. 5 proven money plays.
            </p>

            {/* Metrics */}
            <div className="space-y-2.5 py-4 border-y border-white/[0.06] font-mono text-xs mb-6">
              <div className="flex items-center justify-between">
                <span className="text-[#8E9BB4] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#f59e0b]" /> Time to first $:
                </span>
                <span className="font-bold text-white">1–14 days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8E9BB4] flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-[#00FF66]" /> Upfront capital:
                </span>
                <span className="font-bold text-[#00FF66]">$0 upfront</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8E9BB4] flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#f59e0b]" /> Potential:
                </span>
                <span className="font-bold text-[#f59e0b]">$5K–$15K/mo realistic</span>
              </div>
            </div>

            {/* Checkpoints (The 5 Plays) */}
            <div className="space-y-2 mb-6 font-mono text-xs">
              <div className="flex items-center gap-2 text-white/90">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#f59e0b] shrink-0" />
                <span>Play 1: Local business video packages</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#f59e0b] shrink-0" />
                <span>Play 2: Creator clipping service</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#f59e0b] shrink-0" />
                <span>Play 3: E-commerce UGC ad bundles</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#f59e0b] shrink-0" />
                <span>Play 4: Coach content multiplication</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#f59e0b] shrink-0" />
                <span>Play 5: Your own faceless channel</span>
              </div>
            </div>
          </div>

          <div>
            <Link href="/earn/video-empire" className="block">
              <Button
                size="lg"
                className="w-full bg-[#f59e0b] text-black font-extrabold uppercase font-mono h-12 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:bg-[#f59e0b]/90 hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all"
              >
                Start Video Empire <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
            <div className="text-center text-[10px] font-mono text-[#f59e0b] mt-2.5 font-bold">
              🔥 Best use of your faceless video maker
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
                Compounding
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
                  <Clock className="w-3.5 h-3.5 text-[#8b5cf6]" /> Time to first $:
                </span>
                <span className="font-bold text-white">1–3 weeks</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8E9BB4] flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-[#8E9BB4]" /> Upfront capital:
                </span>
                <span className="font-bold text-white">$0–$20 (domain)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8E9BB4] flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#8b5cf6]" /> Potential:
                </span>
                <span className="font-bold text-[#8b5cf6]">$10K–$50K/mo passive</span>
              </div>
            </div>

            {/* Checkpoints */}
            <div className="space-y-2 mb-6 font-mono text-xs">
              <div className="flex items-center gap-2 text-white/90">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#8b5cf6] shrink-0" />
                <span>Marketplace asset listing (70–80% split)</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#8b5cf6] shrink-0" />
                <span>10% lifetime recurring referral links</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#8b5cf6] shrink-0" />
                <span>Turnkey Next.js micro-SaaS deployments</span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <span className="text-[10px] text-[#FFD700] border border-[#FFD700]/30 bg-[#FFD700]/10 px-1.5 py-0.5 rounded mr-0.5">
                  LOCKED
                </span>
                <span>Web4 Sovereign Agents (unlocks at $1K)</span>
              </div>
            </div>
          </div>

          <div>
            <Link href="/earn/automated-assets" className="block">
              <Button
                size="lg"
                className="w-full bg-[#8b5cf6] text-white font-extrabold uppercase font-mono h-12 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:bg-[#8b5cf6]/90 hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all"
              >
                Start Building Assets <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
            <div className="text-center text-[10px] font-mono text-[#8E9BB4] mt-2.5">
              💎 Long-term wealth compounding
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

      {/* Honest Messaging Disclaimer */}
      <div className="text-[11px] font-mono text-[#8E9BB4] max-w-2xl mx-auto italic text-center pb-8 border-t border-white/[0.06] pt-6">
        Results vary. Requires consistent execution. Based on historical Trendly user data. Trendly does not make income promises or guarantees. All deliverables require your inspection and approval.
      </div>
    </div>
  );
}