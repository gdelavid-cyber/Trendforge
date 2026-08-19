export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { TrendingUp, Zap, ChevronRight, Check, Flame } from 'lucide-react';
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

  // 2050 Subscription terminal tiers
  const plans = [
    {
      name: 'Starter Terminal',
      price: '$0',
      description: 'Stream baseline wealth loops and access the core registry.',
      features: ['Unlimited Power Moves (Standard)', 'Basic Live Pulse telemetry', 'Global Leaderboard access', '3 Daily Favor credits'],
      cta: 'Start Forging',
      highlight: false,
    },
    {
      name: 'Pro Operator',
      price: '$19',
      description: 'Priority wealth channels with real-time neural triggers.',
      features: ['Early access to high-velocity Moves', 'Real-time Live Pulse telemetry', 'Multiplier bonus (+20% WP)', 'Advanced pipeline sandbox'],
      cta: 'Upgrade to Pro',
      highlight: true,
    },
    {
      name: 'Elite Architect',
      price: '$49',
      description: 'The ultimate autonomous wealth command interface.',
      features: ['Full terminal bandwidth access', 'Dedicated AI Wealth Agent', 'Exclusive high-yield arbitrage moves', '1-on-1 mentor guidance'],
      cta: 'Acquire Elite',
      highlight: false,
    },
  ];

  return (
    <div className="min-h-screen text-white overflow-x-hidden relative">
      <Header />

      {/* Hero Section */}
      <section className="relative max-w-[1200px] mx-auto px-4 pt-28 pb-20 text-center">
        {/* Release live indicator badge */}
        <div className="inline-flex items-center gap-2 bg-[#FFD700]/10 border border-[#FFD700]/20 rounded-full px-4 py-1.5 mb-6">
          <Flame className="w-4 h-4 text-[#FFD700]" />
          <span className="text-sm text-[#FFD700] font-medium">New task drops daily</span>
        </div>

        <h1 className="font-display font-bold text-4xl md:text-6xl tracking-tight mb-6">
          <span className="cyan-gold-gradient-text">Forge Wealth</span> from the<br />
          Week&apos;s Hottest Trends
        </h1>

        <p className="text-lg md:text-xl text-[#8892B0] max-w-2xl mx-auto mb-8 font-sans">
          Verified money-making tasks. From zero-cost side hustles to
          high-reward ventures — all backed by real success stories.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
          <Link href="/auth/signup">
            <Button size="lg" className="h-12 px-8 text-sm">
              Start Forging Free <ChevronRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
          <Link href="/pricing">
            <Button variant="outline" size="lg" className="h-12 px-8 text-sm">
              View Plans
            </Button>
          </Link>
        </div>

        {/* Stats Row: 3 Glass Cards with Space Grotesk Numbers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="glass-card p-6 text-center">
            <div className="stat-number text-[#00F0FF] mb-1">12,480+</div>
            <div className="text-xs text-[#8892B0] uppercase font-mono tracking-wider">Active Operatives</div>
          </div>
          <div className="glass-card p-6 text-center">
            <div className="stat-number text-[#FFD700] mb-1">15 min</div>
            <div className="text-xs text-[#8892B0] uppercase font-mono tracking-wider">Pipeline Cycle</div>
          </div>
          <div className="glass-card p-6 text-center">
            <div className="stat-number text-green-400 mb-1">94.8%</div>
            <div className="text-xs text-[#8892B0] uppercase font-mono tracking-wider">Success Ratio</div>
          </div>
        </div>
      </section>

      {/* Live Pulse Ticker */}
      {livePulses.length > 0 && (
        <section className="border-y border-white/[0.06] py-5 bg-black/40 backdrop-blur-md">
          <div className="max-w-[1200px] mx-auto px-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="live-pulse-dot">
                <span className="ping bg-[#FF6B9D]" />
                <span className="core bg-[#FF6B9D] shadow-[0_0_10px_#FF6B9D]" />
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-[#8892B0] font-mono">Live Pulse Telemetry</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {livePulses.map((pulse) => (
                <div key={pulse.id} className="glass-card p-3 text-left">
                  <div className="text-xs font-bold text-white truncate mb-1">{pulse.name}</div>
                  <div className="flex items-center gap-1.5">
                    <TrendCategoryBadge category={pulse.category} />
                    <span className="text-[10px] text-[#8892B0] flex items-center font-mono">
                      <TrendingUp className="w-2.5 h-2.5 text-green-400 mr-0.5" />
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
      <section className="py-24 max-w-[1200px] mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl text-white uppercase tracking-wider mb-2">
            Trending <span className="cyan-gold-gradient-text">Power Moves</span>
          </h2>
          <p className="text-[#8892B0] max-w-md mx-auto text-sm">
            Actionable wealth generation moves ready for deployment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredMoves.map((task) => (
            <div key={task.id} className="glass-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] text-[#00F0FF] font-bold font-mono uppercase tracking-wider bg-[#00F0FF]/10 border border-[#00F0FF]/20 px-2 py-0.5 rounded">
                    {task.category}
                  </span>
                  <span className="text-xs font-mono text-[#FFD700]">
                    {task.difficulty === 'ZERO' && '⭐'}
                    {task.difficulty === 'LOW' && '⭐⭐'}
                    {task.difficulty === 'MEDIUM' && '⭐⭐⭐'}
                    {task.difficulty === 'HIGH' && '⭐⭐⭐⭐'}
                  </span>
                </div>
                <h3 className="text-lg text-white mb-2 line-clamp-1">
                  {task.title}
                </h3>
                <p className="text-xs text-[#8892B0] line-clamp-2 mb-6">
                  {task.description}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs font-mono text-[#8892B0] border-t border-white/[0.06] pt-4">
                <div>
                  <span className="text-[#FFD700] font-bold">$</span>{task.startupCost} Setup
                </div>
                <div className="text-green-400 font-bold">
                  +{task.estimatedEarningsLow * 100}-{task.estimatedEarningsHigh * 100} WP
                </div>
                <div>
                  ⏱️ {task.timeToFirstDollar ?? '1d'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Win Stories Section */}
      <section className="py-24 border-t border-white/[0.06] bg-black/40">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl text-white uppercase tracking-wider mb-2">
              Verified <span className="text-[#FFD700]">Win Stories</span>
            </h2>
            <p className="text-[#8892B0] max-w-md mx-auto text-sm">
              Real wealth outcomes achieved by operatives across the globe.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {winStories.map((story) => (
              <div key={story.id} className="glass-card p-6 relative">
                <span className="absolute -top-3 left-6 bg-[#00F0FF] text-black text-[9px] font-bold px-2.5 py-0.5 rounded-full font-mono uppercase shadow-[0_0_10px_rgba(0,240,255,0.4)]">
                  VERIFIED WIN
                </span>
                <div className="mb-4 pt-2">
                  <div className="text-xl font-bold text-[#FFD700] font-mono">
                    +${story.earningsAmount.toLocaleString()} Yield
                  </div>
                  <div className="text-xs text-[#8892B0] mt-0.5 truncate">
                    Move: {story.task?.title}
                  </div>
                </div>
                <p className="text-xs text-[#8892B0] line-clamp-4 italic mb-6">
                  &ldquo;{story.description}&rdquo;
                </p>
                <div className="text-xs text-white font-bold border-t border-white/[0.06] pt-3 flex items-center justify-between font-mono">
                  <span>@{story.user?.name || 'anonymous'}</span>
                  <span className="text-green-400 text-[10px] uppercase">✓ Verified</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Terminal Pricing Tiers */}
      <section className="py-24 max-w-[1200px] mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl text-white uppercase tracking-wider mb-2">
            Acquire Your Terminal License
          </h2>
          <p className="text-[#8892B0] max-w-md mx-auto text-sm">
            Choose your connection bandwidth to the infinite wealth stream.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div key={plan.name} className={`glass-card p-7 flex flex-col justify-between relative ${plan.highlight ? 'border-[#00F0FF]/50 shadow-[0_0_30px_rgba(0,240,255,0.2)]' : ''}`}>
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#00F0FF] to-[#0088CC] text-black text-[9px] font-black px-3 py-1 rounded-full uppercase font-mono shadow-[0_0_15px_rgba(0,240,255,0.5)]">
                  RECOMMENDED
                </span>
              )}
              <div>
                <h3 className="text-base text-white mb-1 uppercase tracking-wider">{plan.name}</h3>
                <div className="mb-4">
                  <span className="stat-number text-white">{plan.price}</span>
                  <span className="text-xs text-[#8892B0] font-mono">/mo</span>
                </div>
                <p className="text-xs text-[#8892B0] mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-xs text-[#8892B0]">
                      <Check className="w-3.5 h-3.5 text-[#00F0FF] flex-shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
              <Link href={plan.price === '$0' ? '/auth/signup' : '/pricing'}>
                <Button className={`w-full text-xs h-11 ${plan.highlight ? '' : 'btn-secondary-2050'}`} variant={plan.highlight ? 'default' : 'outline'}>
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 text-center bg-black/60 text-[#8892B0] text-[10px]">
        <div className="max-w-[1200px] mx-auto px-4 font-mono">
          FORGE TERMINAL v2050 // ALL FUNCTIONAL CAPACITIES ONLINE // FOR RESEARCH & EDUCATIONAL SIMULATION ONLY
        </div>
      </footer>
    </div>
  );
}
