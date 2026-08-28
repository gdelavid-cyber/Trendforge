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
  Radio,
  ShoppingBag,
  Gift,
  Palette,
  Coins,
  ShieldAlert,
  Trophy,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db';
import { Header } from '@/components/header';
import { TrendCategoryBadge } from '@/components/trend-badge';
import { CONTEST_MODE } from '@/lib/flags';
import { CompanionPortrait } from '@/components/avatar/CompanionPortrait';

export default async function LandingPage() {
  let featuredMoves: any[] = [];
  let winStories: any[] = [];
  let livePulses: any[] = [];
  let realStats = { runsCompleted: 0, artifactsProduced: 0, liveTasks: 0 };

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

    // Contest surface shows only numbers the database can prove.
    const [runsCompleted, artifactsProduced, liveTasks] = await Promise.all([
      prisma.userTask.count({ where: { status: 'COMPLETED' } }),
      prisma.taskArtifact.count(),
      prisma.task.count({
        where: { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      }),
    ]);
    realStats = { runsCompleted, artifactsProduced, liveTasks };
  } catch (e) {
    console.error('Landing page database query failed:', e);
  }

  const swarmAgents = [
    { name: 'Reddit Problem Scraper', type: 'reddit_scraper', yieldText: '$150 - $1,500/client', desc: 'Mines organic customer pain points & synthesizes monetization roadmaps.', avatar: 'cyber_humanoid' },
    { name: 'Prediction Arbitrage', type: 'prediction_arbitrage', yieldText: '+4.5% - +18.2% ROI', desc: 'Scans Polymarket orderbooks for delta-neutral probability spreads.', avatar: 'quantum_android' },
    { name: 'OpenClaw VPS Deployer', type: 'openclaw_deployer', yieldText: '$500 - $3,000/mo', desc: 'Provisions dedicated headless scraping nodes with rotating proxy pools.', avatar: 'cyber_humanoid' },
    { name: 'AI Viral Video Maker', type: 'ai_video_maker', yieldText: '$300 - $2,400/mo', desc: 'Constructs high-retention 9:16 short-form video scripts & audio assets.', avatar: 'cosmic_entity' },
    { name: 'Micro-SaaS Scaffolder', type: 'micro_saas_builder', yieldText: '$2k - $10k+ MRR', desc: 'Builds full-stack Next.js web applications with Stripe billing in 20s.', avatar: 'wall_street_titan' },
  ];

  const web4Pillars = [
    {
      title: 'No-Code Agent Studio',
      href: '/builder',
      icon: Layers,
      badge: '50+ Modular Skills',
      color: 'from-[#00F0FF]/20 to-blue-500/10 border-[#00F0FF]/40',
      textColor: 'text-[#00F0FF]',
      desc: 'Drag-and-drop DAG workflow canvas with real-time sandbox execution, compute cost tracking, and 1-click on-chain minting.',
      cta: 'Launch Builder Canvas',
    },
    {
      title: 'GTA Visual Avatar Studio',
      href: '/avatar-studio',
      icon: Palette,
      badge: '3D WebGL + Lip-Sync',
      color: 'from-[#FFD700]/20 to-amber-500/10 border-[#FFD700]/40',
      textColor: 'text-[#FFD700]',
      desc: '3D avatar customizer with 4 base archetypes, holographic visors, photon wings, plasma auras, and real-time audio viseme sync.',
      cta: 'Customize 3D Avatar',
    },
    {
      title: 'Sovereign Web4 Agents',
      href: '/agents/web4',
      icon: Bot,
      badge: 'Autonomous Crypto Wallets',
      color: 'from-green-500/20 to-emerald-500/10 border-green-500/40',
      textColor: 'text-green-400',
      desc: 'Autonomous economic citizens with EIP-8004 identity hashes, non-custodial Autonomous USDC wallets, and self-sustaining intelligence.',
      cta: 'Command Center',
    },
    {
      title: 'Trends Radar & Daily Intel',
      href: '/trends',
      icon: Radio,
      badge: 'Live Market Telemetry',
      color: 'from-[#00F0FF]/20 to-blue-500/10 border-[#00F0FF]/40',
      textColor: 'text-[#00F0FF]',
      desc: 'Real-time social and market scrapers filtering actionable money-making moves from macro tech news and daily intelligence.',
      cta: 'Explore Trends Radar',
    },
    {
      title: 'Official Web4 White Paper',
      href: '/manifesto',
      icon: BookOpen,
      badge: 'EIP-8004 Architecture',
      color: 'from-purple-500/20 to-indigo-500/10 border-purple-500/40',
      textColor: 'text-purple-400',
      desc: 'The complete architectural blueprint and economic thesis of sovereign autonomous AI agents with non-custodial capital.',
      cta: 'Read Web4 Manifesto',
    },
    {
      title: 'Bootstrap Micro-Grants',
      href: '/dashboard/grants',
      icon: Gift,
      badge: '$25 USDC Treasury Seed',
      color: 'from-amber-400/20 to-yellow-500/10 border-amber-400/40',
      textColor: 'text-amber-300',
      desc: 'Non-dilutive $25.00 USDC seed liquidity allocated from protocol commissions to fund your first autonomous agent deployments.',
      cta: 'Claim $25 Seed Grant',
    },
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

  // Shared sections — rendered by both the contest and full landing layouts.
  const livePulseSection = livePulses.length > 0 ? (
    <section className="border-y border-white/[0.06] py-4 bg-black/20 backdrop-blur-md">
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
  ) : null;

  const featuredSection = featuredMoves.length > 0 ? (
    <section className="py-24 max-w-[1240px] mx-auto px-4">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/20 text-[#FFD700] text-xs font-mono mb-3">
          <Zap className="w-3.5 h-3.5" />
          <span>{CONTEST_MODE ? 'LIVE TASK RADAR' : 'ACTIONABLE WEALTH CATALOG'}</span>
        </div>
        <h2 className="font-orbitron text-3xl md:text-5xl text-white uppercase tracking-wider mb-3">
          {CONTEST_MODE ? (
            <>Pick a task. <span className="cyan-gold-gradient-text">Watch it get done.</span></>
          ) : (
            <>Trending <span className="cyan-gold-gradient-text">Power Moves</span></>
          )}
        </h2>
        <p className="text-[#8E9BB4] max-w-md mx-auto text-sm font-sans">
          {CONTEST_MODE
            ? 'Real tasks from live trends. Your companion executes every step — you approve anything that leaves the building.'
            : 'Pre-engineered execution blueprints with explicit dollar revenue targets.'}
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
                +${task.estimatedEarningsLow}-${task.estimatedEarningsHigh} <span className="text-[#8E9BB4] font-normal">est.</span>
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
  ) : null;

  if (CONTEST_MODE) {
    return (
      <div className="min-h-screen text-white overflow-x-hidden relative">
        <Header />

        {/* Hero */}
        <section className="relative max-w-[1280px] mx-auto px-4 pt-16 pb-14 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#FFD700]/15 via-white/[0.04] to-[#00F0FF]/15 border border-[#FFD700]/30 shadow-[0_0_20px_rgba(255,215,0,0.15)] mb-6">
            <Flame className="w-4 h-4 text-[#FFD700] animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-wider text-[#FFD700]">
              NEW MONEY-MAKING TASKS DROP DAILY
            </span>
          </div>

          <h1 className="font-orbitron font-black text-4xl sm:text-6xl md:text-7xl tracking-tight leading-[1.08] mb-6 max-w-4xl mx-auto uppercase">
            <span className="cyan-gold-gradient-text">Forge Wealth</span> from the<br />
            Week&apos;s Hottest Trends
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-[#8E9BB4] max-w-2xl mx-auto mb-8 font-sans leading-relaxed">
            Verified money-making tasks. From zero-cost side hustles to high-reward ventures — all backed by real success stories.
          </p>

          <div className="flex flex-wrap gap-3 justify-center items-center mb-12">
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="h-12 px-6 text-xs sm:text-sm font-extrabold uppercase font-mono tracking-wider cyan-gradient text-black holographic-btn shadow-[0_0_30px_rgba(0,240,255,0.4)]"
              >
                <Sparkles className="w-4 h-4 mr-2 stroke-[3]" /> Forge Your Companion
              </Button>
            </Link>
            <Link href="/tasks">
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-6 text-xs sm:text-sm font-mono uppercase tracking-wider border-white/20 hover:border-[#FFD700]/50 text-white bg-white/[0.03] backdrop-blur-md"
              >
                <Coins className="w-4 h-4 mr-2 text-[#FFD700]" /> See Trending Tasks
              </Button>
            </Link>
          </div>

          {/* Provable numbers only — straight from the database */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div className="glass-card p-6 text-center border-t-2 border-t-[#00F0FF]/50">
              <div className="stat-number text-3xl font-black text-[#00F0FF] mb-1 font-mono">{realStats.runsCompleted}</div>
              <div className="text-xs text-[#8E9BB4] uppercase font-mono tracking-wider">Task Runs Completed</div>
            </div>
            <div className="glass-card p-6 text-center border-t-2 border-t-[#FFD700]/50">
              <div className="stat-number text-3xl font-black text-[#FFD700] mb-1 font-mono">{realStats.artifactsProduced}</div>
              <div className="text-xs text-[#8E9BB4] uppercase font-mono tracking-wider">Work Artifacts Delivered</div>
            </div>
            <div className="glass-card p-6 text-center border-t-2 border-t-green-400/50">
              <div className="stat-number text-3xl font-black text-green-400 mb-1 font-mono">{realStats.liveTasks}</div>
              <div className="text-xs text-[#8E9BB4] uppercase font-mono tracking-wider">Live Tasks On Radar</div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 border-t border-white/[0.08] bg-black/20 backdrop-blur-md">
          <div className="max-w-[1100px] mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: Sparkles,
                  title: 'Forge your companion',
                  desc: 'Pick a look and personality in the studio. Thirty seconds, yours forever.',
                },
                {
                  icon: Bot,
                  title: 'Point it at a task',
                  desc: 'Choose from the live radar and hit run. It executes every step while you watch.',
                },
                {
                  icon: ShieldCheck,
                  title: 'Approve & keep receipts',
                  desc: 'Anything that touches the outside world pauses for your OK. Every output lands as an artifact you keep.',
                },
              ].map((step, i) => (
                <div key={i} className="glass-card p-6 text-left relative overflow-hidden">
                  <span className="absolute top-4 right-5 font-orbitron font-black text-4xl text-white/[0.06]">{i + 1}</span>
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#00F0FF]/20 to-[#FFD700]/10 border border-[#00F0FF]/30 flex items-center justify-center mb-4">
                    <step.icon className="w-5 h-5 text-[#00F0FF]" />
                  </div>
                  <h3 className="font-orbitron text-base font-bold text-white uppercase mb-2">{step.title}</h3>
                  <p className="text-xs text-[#8E9BB4] font-sans leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {livePulseSection}

        {featuredSection}

        {/* Final CTA */}
        <section className="py-24 border-t border-white/[0.06] bg-black/20 backdrop-blur-md text-center">
          <div className="max-w-[900px] mx-auto px-4">
            <h2 className="font-orbitron text-3xl md:text-5xl text-white uppercase tracking-wider mb-4">
              Your first companion <span className="cyan-gold-gradient-text">works free.</span>
            </h2>
            <p className="text-sm text-[#8E9BB4] max-w-md mx-auto mb-8 font-sans">
              No card. No setup. Forge it, run one task, judge the receipts yourself.
            </p>
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="h-12 px-8 text-xs sm:text-sm font-extrabold uppercase font-mono tracking-wider cyan-gradient text-black holographic-btn shadow-[0_0_30px_rgba(0,240,255,0.4)]"
              >
                Launch Free <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white overflow-x-hidden relative">
      <Header />

      {/* Hero Section */}
      <section className="relative max-w-[1280px] mx-auto px-4 pt-16 pb-16 text-center">
        {/* Release live indicator badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#FFD700]/15 via-white/[0.04] to-[#00F0FF]/15 border border-[#FFD700]/30 shadow-[0_0_20px_rgba(255,215,0,0.15)] mb-6">
          <Flame className="w-4 h-4 text-[#FFD700] animate-pulse" />
          <span className="text-xs font-mono font-bold tracking-wider text-[#FFD700]">
            NEW MONEY-MAKING TASKS DROP DAILY
          </span>
        </div>

        <h1 className="font-orbitron font-black text-4xl sm:text-6xl md:text-7xl tracking-tight leading-[1.08] mb-6 max-w-4xl mx-auto uppercase">
          <span className="cyan-gold-gradient-text">Forge Wealth</span> from the<br />
          Week&apos;s Hottest Trends
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-[#8E9BB4] max-w-2xl mx-auto mb-8 font-sans leading-relaxed">
          Verified money-making tasks. From zero-cost side hustles to high-reward ventures — all backed by real success stories.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-center items-center mb-14">
          <Link href="/auth/signup">
            <Button
              size="lg"
              className="h-12 px-6 text-xs sm:text-sm font-extrabold uppercase font-mono tracking-wider cyan-gradient text-black holographic-btn shadow-[0_0_30px_rgba(0,240,255,0.4)]"
            >
              <Sparkles className="w-4 h-4 mr-2 stroke-[3]" /> Forge Your Companion
            </Button>
          </Link>
          <Link href="/tasks">
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-6 text-xs sm:text-sm font-mono uppercase tracking-wider border-white/20 hover:border-[#FFD700]/50 text-white bg-white/[0.03] backdrop-blur-md"
            >
              <Coins className="w-4 h-4 mr-2 text-[#FFD700]" /> See Trending Tasks
            </Button>
          </Link>
          <Link href="/agents">
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-6 text-xs sm:text-sm font-mono uppercase tracking-wider border-white/20 hover:border-green-400/50 text-white bg-white/[0.03] backdrop-blur-md"
            >
              <Bot className="w-4 h-4 mr-2 text-green-400" /> Web4 Agents
            </Button>
          </Link>
          <Link href="/trends">
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-6 text-xs sm:text-sm font-mono uppercase tracking-wider border-white/20 hover:border-[#00F0FF]/50 text-white bg-white/[0.03] backdrop-blur-md"
            >
              <Radio className="w-4 h-4 mr-2 text-[#00F0FF]" /> Trends Radar
            </Button>
          </Link>
        </div>

        {/* 5 Swarm Agent Constellation Dock */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 max-w-5xl mx-auto mb-16 text-left">
          {swarmAgents.map((bot, i) => (
            <Link key={i} href="/agents" className="glass-card p-4 flex flex-col justify-between group hover:border-[#00F0FF]/40 transition-all">
              <div>
                <div className="w-12 h-12 rounded-xl overflow-hidden mb-3 border border-white/10 shadow-[0_0_15px_rgba(0,240,255,0.15)] group-hover:scale-105 transition-transform bg-black/50">
                  <CompanionPortrait archetype={bot.avatar} className="w-full h-full" seed={i} />
                </div>
                <div className="text-xs font-bold text-white group-hover:text-[#00F0FF] transition-colors font-mono line-clamp-1">
                  {bot.name}
                </div>
                <p className="text-[10px] text-[#8E9BB4] font-sans mt-1 line-clamp-2 leading-tight">
                  {bot.desc}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-white/[0.06] text-[10px] font-mono text-green-400 font-bold">
                {bot.yieldText} (estimate)
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

      {/* WEB4 OPERATING SYSTEM LIVE ARCHITECTURE SHOWCASE */}
      <section className="py-20 border-t border-white/[0.08] bg-black/20 backdrop-blur-md">
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-[#00F0FF] text-xs font-mono mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>THE COMPLETE WEB4 WEALTH OPERATING SYSTEM</span>
            </div>
            <h2 className="font-orbitron text-3xl md:text-5xl font-black uppercase text-white tracking-wider">
              Explore the <span className="cyan-gold-gradient-text">Web4 Ecosystem</span>
            </h2>
            <p className="text-sm text-[#8E9BB4] font-sans max-w-xl mx-auto mt-2">
              Every tool and protocol is live in production. Click any module to launch directly into the application.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {web4Pillars.map((p, idx) => {
              const Icon = p.icon;
              return (
                <div
                  key={idx}
                  className={`glass-card p-6 rounded-2xl bg-gradient-to-br ${p.color} border flex flex-col justify-between hover:scale-[1.02] transition-all`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center">
                        <Icon className={`w-6 h-6 ${p.textColor}`} />
                      </div>
                      <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-black/40 border border-white/10 text-white">
                        {p.badge}
                      </span>
                    </div>

                    <h3 className="font-orbitron text-lg font-bold text-white uppercase mb-2">
                      {p.title}
                    </h3>
                    <p className="text-xs text-[#8E9BB4] font-sans leading-relaxed mb-6">
                      {p.desc}
                    </p>
                  </div>

                  <Link href={p.href}>
                    <Button className="w-full cyan-gradient text-black font-extrabold uppercase text-xs h-9 holographic-btn font-mono">
                      {p.cta} <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* DEDICATED WEB4 MANIFESTO & WHITE PAPER SHOWCASE BANNER */}
      <section className="py-16 border-y border-white/[0.08] bg-gradient-to-r from-purple-950/20 via-black/30 to-[#00F0FF]/10 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#00F0FF]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-[1240px] mx-auto px-4 relative z-10">
          <div className="glass-card p-8 md:p-12 rounded-3xl border border-[#00F0FF]/30 bg-black/40 backdrop-blur-md flex flex-col lg:flex-row items-center justify-between gap-8 shadow-[0_0_50px_rgba(0,240,255,0.15)]">
            <div className="space-y-4 max-w-2xl text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] text-xs font-mono tracking-widest uppercase">
                <BookOpen className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span>OFFICIAL WEBPAPER // THE WEB4 MANIFESTO</span>
              </div>

              <h2 className="font-orbitron font-black text-2xl md:text-4xl uppercase text-white tracking-wider">
                What is <span className="cyan-gold-gradient-text">Web4</span> &amp; Autonomous Capital?
              </h2>

              <p className="text-sm text-[#CCD6F6] font-sans leading-relaxed">
                Read the foundational thesis on how the internet transitioned from passive consumption (Web1), social harvesting (Web2), and human asset ownership (Web3) into <strong>Sovereign Autonomous AI Agents with non-custodial wallets and EIP-8004 identity (Web4)</strong>.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2 font-mono text-xs text-[#8E9BB4]">
                <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
                  <Check className="w-3.5 h-3.5 text-green-400" /> Non-Custodial Wallets
                </span>
                <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
                  <Check className="w-3.5 h-3.5 text-[#00F0FF]" /> EIP-8004 Identity
                </span>
                <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
                  <Check className="w-3.5 h-3.5 text-[#FFD700]" /> Human Command Layer
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 w-full sm:w-auto">
              <Link href="/manifesto">
                <Button className="w-full sm:w-auto cyan-gradient text-black font-extrabold uppercase text-xs h-11 px-6 holographic-btn font-mono shadow-[0_0_20px_rgba(0,240,255,0.3)]">
                  <BookOpen className="w-4 h-4 mr-2 fill-black" /> Read White Paper &rarr;
                </Button>
              </Link>
              <Link href="/agents/web4">
                <Button variant="outline" className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 text-xs font-mono uppercase h-11 px-6">
                  <Bot className="w-4 h-4 mr-2 text-[#00F0FF]" /> Launch Web4 Agents
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {livePulseSection}

      {featuredSection}

      {/* Subscription Pricing Matrix */}
      <section className="py-24 border-t border-white/[0.06] bg-black/20 backdrop-blur-md">
        <div className="max-w-[1240px] mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-orbitron text-3xl md:text-5xl text-white uppercase tracking-wider mb-3">
              Monetization <span className="cyan-gold-gradient-text">Bandwidth</span>
            </h2>
            <p className="text-[#8E9BB4] max-w-md mx-auto text-sm font-sans">
              Choose your autonomous extraction speed. Cancel or upgrade anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`glass-card p-8 flex flex-col justify-between relative ${
                  p.highlight ? 'border-[#00F0FF]/50 shadow-[0_0_30px_rgba(0,240,255,0.2)]' : ''
                }`}
              >
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#00F0FF] text-black text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Most Popular
                  </div>
                )}
                <div>
                  <h3 className="font-orbitron text-xl font-bold text-white mb-2">{p.name}</h3>
                  <div className="text-3xl font-black font-mono text-white mb-4">
                    {p.price}<span className="text-xs text-[#8E9BB4]">/mo</span>
                  </div>
                  <p className="text-xs text-[#8E9BB4] mb-6">{p.description}</p>
                  <div className="space-y-2 mb-8">
                    {p.features.map((feat) => (
                      <div key={feat} className="flex items-center text-xs text-[#CCD6F6]">
                        <Check className="w-3.5 h-3.5 text-green-400 mr-2 flex-shrink-0" />
                        {feat}
                      </div>
                    ))}
                  </div>
                </div>
                <Link href="/auth/signup">
                  <Button
                    className={`w-full text-xs font-mono uppercase font-bold h-10 ${
                      p.highlight ? 'cyan-gradient text-black' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                    }`}
                  >
                    {p.cta}
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
