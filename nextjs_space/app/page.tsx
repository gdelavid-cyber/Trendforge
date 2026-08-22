export const dynamic = 'force-dynamic';

import Link from 'next/link';
import {
  TrendingUp,
  Zap,
  ChevronRight,
  Check,
  Flame,
  Bot,
  Terminal,
  Layers,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Clock,
  Play,
  Cpu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db';
import { Header } from '@/components/header';
import { TrendCategoryBadge } from '@/components/trend-badge';

export default async function LandingPage() {
  let featuredMoves: any[] = [];
  let winStories: any[] = [];
  let livePulses: any[] = [];

  try {
    featuredMoves = await prisma.task.findMany({
      where: { isFeatured: true },
      take: 4,
      orderBy: { generatedAt: 'desc' },
    });

    winStories = await prisma.successStory.findMany({
      where: { isPublished: true, verificationStatus: 'VERIFIED' },
      include: {
        user: { select: { name: true } },
        task: { select: { title: true } },
      },
      take: 3,
    });

    livePulses = await prisma.trend.findMany({
      where: { status: 'ACTIVE' },
      take: 6,
      orderBy: { mentionVelocity: 'desc' },
    });
  } catch (e) {
    console.error('Landing page database query failed:', e);
  }

  const swarmAgents = [
    { name: 'Reddit Problem Scraper', type: 'reddit_scraper', yieldText: '$150 - $1,500/client', desc: 'Mines organic customer pain points & synthesizes monetization roadmaps.', icon: '🤖' },
    { name: 'Prediction Arbitrage', type: 'prediction_arbitrage', yieldText: '+4.5% - +18.2% ROI', desc: 'Scans Polymarket orderbooks for delta-neutral probability spreads.', icon: '📈' },
    { name: 'OpenClaw VPS Deployer', type: 'openclaw_deployer', yieldText: '$500 - $3,000/mo', desc: 'Provisions dedicated headless scraping nodes with rotating proxy pools.', icon: '🖥️' },
    { name: 'AI Viral Video Maker', type: 'ai_video_maker', yieldText: '$300 - $2,400/mo', desc: 'Constructs high-retention 9:16 short-form video scripts & audio assets.', icon: '🎬' },
    { name: 'Micro-SaaS Scaffolder', type: 'micro_saas_builder', yieldText: '$2k - $10k+ MRR', desc: 'Builds full-stack Next.js web applications with Stripe billing in 20s.', icon: '💻' },
  ];

  const plans = [
    {
      name: 'Starter Terminal',
      price: '$0',
      description: 'Stream baseline wealth loops and deploy core swarm workers.',
      features: ['3 Swarm Agent runs / week', '+1 Weekly Featured Agent Bonus', 'Access to all Power Moves', 'Global Community & Quests access'],
      cta: 'Launch Starter',
      highlight: false,
    },
    {
      name: 'Pro Operator',
      price: '$19',
      description: 'Unlimited swarm bandwidth with high-velocity drops.',
      features: ['Unlimited Swarm Agent Runs', 'Multi-Agent Chained Workflows', 'High-Velocity Live Moves', 'Priority Execution Queue'],
      cta: 'Upgrade Pro Operator',
      highlight: true,
    },
    {
      name: 'Elite Architect',
      price: '$49',
      description: 'The ultimate autonomous wealth command interface.',
      features: ['Full pipeline concurrency', 'Bespoke scraping channels', '1-on-1 Mentorship matching', 'Dedicated VIP support node'],
      cta: 'Acquire Elite',
      highlight: false,
    },
  ];

  return (
    <div className="min-h-screen text-white overflow-x-hidden relative">
      <Header />

      {/* Hero Section */}
      <section className="relative max-w-[1240px] mx-auto px-4 pt-20 pb-20 text-center">
        {/* Release live indicator badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#FFD700]/15 via-white/[0.04] to-[#00F0FF]/15 border border-[#FFD700]/30 shadow-[0_0_20px_rgba(255,215,0,0.15)] mb-8">
          <Flame className="w-4 h-4 text-[#FFD700] animate-pulse" />
          <span className="text-xs font-mono font-bold tracking-wider text-[#FFD700]">
            NEW MONEY-MAKING TASK DROPS DAILY
          </span>
        </div>

        <h1 className="font-orbitron font-black text-4xl sm:text-6xl md:text-7xl tracking-tight leading-[1.08] mb-6 max-w-4xl mx-auto uppercase">
          <span className="cyan-gold-gradient-text">Forge Wealth</span> from the<br />
          Week&apos;s Hottest Trends
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-[#8E9BB4] max-w-2xl mx-auto mb-10 font-sans leading-relaxed">
          Verified money-making tasks. From zero-cost side hustles to high-reward ventures — all backed by real success stories.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Link href="/auth/signup">
            <Button
              size="lg"
              className="h-13 px-8 text-sm font-extrabold uppercase font-mono tracking-wider cyan-gradient text-black holographic-btn shadow-[0_0_30px_rgba(0,240,255,0.4)]"
            >
              Deploy Free Agent <ChevronRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
          <Link href="/workflows">
            <Button
              variant="outline"
              size="lg"
              className="h-13 px-8 text-sm font-mono uppercase tracking-wider border-white/10 hover:border-[#00F0FF]/40 text-white bg-white/[0.03] backdrop-blur-md"
            >
              <Layers className="w-4 h-4 mr-2 text-[#00F0FF]" /> Explore Workflows
            </Button>
          </Link>
        </div>

        {/* 5 Swarm Agent Constellation Dock */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 max-w-5xl mx-auto mb-16 text-left">
          {swarmAgents.map((bot, i) => (
            <Link key={i} href="/agents" className="glass-card p-4 flex flex-col justify-between group">
              <div>
                <div className="text-2xl mb-2">{bot.icon}</div>
                <div className="text-xs font-bold text-white group-hover:text-[#00F0FF] transition-colors font-mono line-clamp-1">
                  {bot.name}
                </div>
                <p className="text-[10px] text-[#8E9BB4] font-sans mt-1 line-clamp-2 leading-tight">
                  {bot.desc}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-white/[0.06] text-[10px] font-mono text-green-400 font-bold">
                {bot.yieldText}
              </div>
            </Link>
          ))}
        </div>

        {/* Telemetry Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <div className="glass-card p-6 text-center border-t-2 border-t-[#00F0FF]/50">
            <div className="stat-number text-3xl font-black text-[#00F0FF] mb-1 font-mono">12,480+</div>
            <div className="text-xs text-[#8E9BB4] uppercase font-mono tracking-wider">Active Operatives</div>
          </div>
          <div className="glass-card p-6 text-center border-t-2 border-t-[#FFD700]/50">
            <div className="stat-number text-3xl font-black text-[#FFD700] mb-1 font-mono">15 min</div>
            <div className="text-xs text-[#8E9BB4] uppercase font-mono tracking-wider">Scraper Ingestion Cycle</div>
          </div>
          <div className="glass-card p-6 text-center border-t-2 border-t-green-400/50">
            <div className="stat-number text-3xl font-black text-green-400 mb-1 font-mono">94.8%</div>
            <div className="text-xs text-[#8E9BB4] uppercase font-mono tracking-wider">Verified Success Ratio</div>
          </div>
        </div>
      </section>

      {/* Live Pulse Ticker */}
      {livePulses.length > 0 && (
        <section className="border-y border-white/[0.06] py-4 bg-black/50 backdrop-blur-xl">
          <div className="max-w-[1240px] mx-auto px-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#FF007A] animate-ping" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#8E9BB4] font-mono">
                Live Pulse Telemetry // Real-Time Market Spikes
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {livePulses.map((pulse) => (
                <div key={pulse.id} className="glass-card p-3 text-left">
                  <div className="text-xs font-bold text-white truncate mb-1">{pulse.name}</div>
                  <div className="flex items-center justify-between">
                    <TrendCategoryBadge category={pulse.category} />
                    <span className="text-[10px] text-green-400 font-mono font-bold flex items-center">
                      <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                      {Math.round(pulse.mentionVelocity)}/h
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Power Moves */}
      <section className="py-24 max-w-[1240px] mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/20 text-[#FFD700] text-xs font-mono mb-3">
            <Zap className="w-3.5 h-3.5" />
            <span>ACTIONABLE WEALTH CATALOG</span>
          </div>
          <h2 className="font-orbitron text-3xl md:text-5xl text-white uppercase tracking-wider mb-3">
            Trending <span className="cyan-gold-gradient-text">Power Moves</span>
          </h2>
          <p className="text-[#8E9BB4] max-w-md mx-auto text-sm font-sans">
            Pre-engineered execution blueprints with explicit dollar revenue targets.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredMoves.map((task) => (
            <div key={task.id} className="glass-card p-6 flex flex-col justify-between group">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] text-[#00F0FF] font-bold font-mono uppercase tracking-wider bg-[#00F0FF]/10 border border-[#00F0FF]/20 px-2.5 py-0.5 rounded">
                    {task.category}
                  </span>
                  <span className="text-xs font-mono text-[#FFD700]">
                    {task.difficulty === 'ZERO' && '⭐'}
                    {task.difficulty === 'LOW' && '⭐⭐'}
                    {task.difficulty === 'MEDIUM' && '⭐⭐⭐'}
                    {task.difficulty === 'HIGH' && '⭐⭐⭐⭐'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-[#00F0FF] transition-colors mb-2 line-clamp-1">
                  {task.title}
                </h3>
                <p className="text-xs text-[#8E9BB4] line-clamp-2 mb-6 font-sans">
                  {task.description}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs font-mono border-t border-white/[0.06] pt-4 items-center">
                <div className="text-[#8E9BB4]">
                  <span className="text-[#FFD700] font-bold">$</span>{task.startupCost} Setup
                </div>
                <div className="text-green-400 font-bold">
                  +${task.estimatedEarningsLow}-${task.estimatedEarningsHigh}
                </div>
                <div className="text-right">
                  <Link href={`/tasks/${task.id}`}>
                    <Button size="sm" className="cyan-gradient text-black font-extrabold uppercase text-[10px] h-7 px-3">
                      Run Move <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Subscription Pricing Matrix */}
      <section className="py-24 border-t border-white/[0.06] bg-black/40">
        <div className="max-w-[1240px] mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-orbitron text-3xl md:text-5xl text-white uppercase tracking-wider mb-3">
              Access <span className="cyan-gold-gradient-text">Terminals</span>
            </h2>
            <p className="text-[#8E9BB4] max-w-md mx-auto text-sm font-sans">
              Choose your bandwidth and deployment tier.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, idx) => (
              <div
                key={idx}
                className={`glass-card p-8 flex flex-col justify-between relative ${
                  plan.highlight ? 'border-[#00F0FF]/40 shadow-[0_0_40px_rgba(0,240,255,0.15)]' : ''
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#00F0FF] text-black font-mono font-black text-[10px] uppercase tracking-wider">
                    Most Popular
                  </div>
                )}
                <div>
                  <h4 className="text-lg font-bold text-white uppercase tracking-wider font-orbitron mb-1">{plan.name}</h4>
                  <p className="text-xs text-[#8E9BB4] mb-6 font-sans">{plan.description}</p>
                  <div className="text-4xl font-black text-white font-mono mb-6 flex items-baseline gap-1">
                    {plan.price}
                    <span className="text-xs text-[#8E9BB4] font-normal">/month</span>
                  </div>
                  <div className="space-y-3 mb-8">
                    {plan.features.map((feat, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-sans text-[#CCD6F6]">
                        <Check className="w-4 h-4 text-[#00F0FF] flex-shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link href="/auth/signup">
                  <Button
                    className={`w-full font-bold uppercase text-xs h-10 font-mono tracking-wider ${
                      plan.highlight
                        ? 'cyan-gradient text-black holographic-btn'
                        : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
