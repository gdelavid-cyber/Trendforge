'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  Coins,
  Cpu,
  DollarSign,
  Flame,
  Layers,
  Lock,
  Send,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface EarnLandingClientProps {
  userEarnings?: number;
  completedOutreach?: boolean;
}

const FIVE_STEPS = [
  {
    step: '01',
    title: 'Pick What To Sell',
    desc: 'Choose from 3 pre-vetted trends with verified demand data, buyer price ranges, and active prospect counts.',
    icon: Flame,
    color: 'text-[#00F0FF] border-[#00F0FF]/20 bg-[#00F0FF]/10',
  },
  {
    step: '02',
    title: 'AI Brainstorm & Plan',
    desc: 'Watch the AI formulate your complete 5-point execution blueprint: product, buyer avatar, pricing, and sales angle.',
    icon: Sparkles,
    color: 'text-[#FFD700] border-[#FFD700]/20 bg-[#FFD700]/10',
  },
  {
    step: '03',
    title: 'Swarm Executes (Split-Screen)',
    desc: 'Parallel execution: the builder creates your deliverable assets while the buyer scout simultaneously discovers qualified leads.',
    icon: Cpu,
    color: 'text-[#FF007A] border-[#FF007A]/20 bg-[#FF007A]/10',
  },
  {
    step: '04',
    title: 'Pick Buyers & Authorize Outreach',
    desc: 'Inspect 5-10 pre-qualified buyers. Review tailored proposal messages. Outreach defaults to Manual Mode so you stay in control.',
    icon: UserCheck,
    color: 'text-[#9D00FF] border-[#9D00FF]/20 bg-[#9D00FF]/10',
  },
  {
    step: '05',
    title: 'Track Deals & Get Paid',
    desc: 'Manage replies in your real-time Kanban pipeline, generate Stripe invoices, and track genuine settled earnings.',
    icon: DollarSign,
    color: 'text-[#00FF66] border-[#00FF66]/20 bg-[#00FF66]/10',
  },
];

const UNLOCK_TIERS = [
  {
    tier: 'STAGE 1',
    title: 'The Guided First $500 Flow',
    status: 'ACTIVE NOW',
    unlocked: true,
    desc: 'Turnkey client deliverable generation and direct buyer outreach for your first $500 in revenue.',
  },
  {
    tier: 'STAGE 2',
    title: 'Marketplace Packaging & 10% Referrals',
    status: 'UNLOCKS AFTER STEP 4',
    unlocked: false,
    desc: 'Package deliverable templates to sell repeatedly on the marketplace (70-80% split) and share your referral link.',
  },
  {
    tier: 'STAGE 3',
    title: 'Turnkey Micro-SaaS & Sales Automation',
    status: 'UNLOCKS AT FIRST PAYMENT',
    unlocked: false,
    desc: 'Deploy full Next.js recurring subscription applications and activate automated outreach sequences.',
  },
  {
    tier: 'STAGE 4',
    title: 'The Advanced Lab: Sovereign Agents & Prediction Markets',
    status: 'UNLOCKS AT $1,000 EARNED',
    unlocked: false,
    desc: 'Deploy autonomous Web4 wallet workers and algorithmic prediction market arbitrage. Strict risk disclosure required.',
  },
];

export function EarnLandingClient({
  userEarnings = 0,
  completedOutreach = false,
}: EarnLandingClientProps) {
  return (
    <div className="max-w-[1200px] mx-auto px-4 py-12 text-center">
      {/* =========================================================================
          HERO: THE SINGULAR CALL TO ACTION
      ========================================================================== */}
      <div className="relative py-16 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-xs font-mono text-[#00F0FF] mb-6 shadow-[0_0_20px_rgba(0,240,255,0.15)]"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="font-bold">THE GUIDED EARN SYSTEM · 5 SEQUENTIAL PHASES</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight max-w-4xl"
        >
          Make Your First{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-white to-[#00FF66]">
            $500
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-base sm:text-lg text-[#8E9BB4] max-w-2xl mb-10 leading-relaxed font-sans"
        >
          Turn real market demand into client revenue in one seamless, 5-step guided flow. The AI executes the research, compiles the deliverable, and hunts qualified buyers — you review and approve.
        </motion.p>

        {/* The ONE Primary Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-16"
        >
          <Link href="/earn/start">
            <Button
              size="lg"
              className="cyan-gradient text-black font-extrabold uppercase text-base h-14 px-10 rounded-xl font-mono shadow-[0_0_35px_rgba(0,240,255,0.5)] hover:shadow-[0_0_50px_rgba(0,240,255,0.8)] transition-all hover:scale-105"
            >
              Make Your First $500 <ArrowRight className="w-5 h-5 ml-2.5" />
            </Button>
          </Link>
          <div className="text-[11px] font-mono text-[#8E9BB4] mt-3">
            Takes ~10 minutes · No upfront capital · Manual approval at every step
          </div>
        </motion.div>
      </div>

      {/* =========================================================================
          THE 5-STEP JOURNEY OVERVIEW
      ========================================================================== */}
      <div className="mb-20 text-left">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold font-mono text-white mb-2">
            HOW THE 5-STEP FLOW WORKS
          </h2>
          <p className="text-xs sm:text-sm font-mono text-[#8E9BB4]">
            Linear, cinematic, and fully transparent. You advance only by completing real actions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {FIVE_STEPS.map((st) => {
            const Icon = st.icon;
            return (
              <div
                key={st.step}
                className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col justify-between hover:border-white/20 transition-all font-mono"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-[#8E9BB4]">{st.step}</span>
                    <div className={`p-2 rounded-xl border ${st.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-2 font-sans">{st.title}</h3>
                  <p className="text-xs text-[#8E9BB4] leading-relaxed font-sans">{st.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          PROGRESSIVE UNLOCK SYSTEM ROADMAP
      ========================================================================== */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-6 sm:p-10 mb-16 text-left font-mono backdrop-blur-md">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-[#00FF66]" />
          <h3 className="text-base font-bold text-white uppercase tracking-wider">
            PROGRESSIVE UNLOCK ROADMAP
          </h3>
        </div>
        <p className="text-xs text-[#8E9BB4] mb-8">
          Advanced tools and alternative earning vectors unlock sequentially as you hit verified milestones.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {UNLOCK_TIERS.map((tier) => (
            <div
              key={tier.tier}
              className={`p-5 rounded-xl border transition-all ${
                tier.unlocked
                  ? 'bg-[#00F0FF]/[0.04] border-[#00F0FF]/30'
                  : 'bg-black/40 border-white/5 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-[#8E9BB4] font-bold">{tier.tier}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                    tier.unlocked
                      ? 'bg-[#00FF66]/10 text-[#00FF66] border-[#00FF66]/20'
                      : 'bg-white/5 text-[#8E9BB4] border-white/10'
                  }`}
                >
                  {tier.status}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mb-1">{tier.title}</h4>
              <p className="text-xs text-[#8E9BB4] leading-relaxed">{tier.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#8E9BB4]">
            Ready to begin? Start Step 1 with 3 pre-vetted trends.
          </div>
          <Link href="/earn/start">
            <Button size="sm" className="cyan-gradient text-black font-extrabold uppercase px-6 h-10 font-mono">
              Start Guided Flow &rarr;
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}