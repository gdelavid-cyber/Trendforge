'use client';

import { motion } from 'framer-motion';
import {
  Flame,
  Star,
  Zap,
  Award,
  Trophy,
  ChevronRight,
  Play,
  Target,
  DollarSign,
  Bot,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getWealthPoints, getLevelInfo, getStreak, getBadges } from '@/app/gamification';
import { OnboardingTour } from '@/components/onboarding/onboarding-tour';
import { Gift } from 'lucide-react';

interface DashboardClientProps {
  user: {
    name: string | null;
    role: string;
    totalEarnings: number;
    completedCount: number;
    userTasks: any[];
    favorCredits: number;
  } | null;
  trendingMoves: any[];
  userTaskIds: string[];
  trendSummary: string;
}

export function DashboardClient({ user, trendingMoves, userTaskIds, trendSummary }: DashboardClientProps) {
  const earnings = user?.totalEarnings ?? 0;
  const completedCount = user?.completedCount ?? 0;
  const userTasksList = user?.userTasks ?? [];

  const points = getWealthPoints(earnings);
  const lvlInfo = getLevelInfo(earnings);
  const streak = getStreak(userTasksList);
  const badgesList = getBadges(earnings, completedCount);

  const badgeConfig: { [key: string]: { name: string; desc: string; icon: any; color: string } } = {
    first_move: { name: 'Initiate', desc: 'Completed First Power Move', icon: Target, color: 'text-[#00F0FF] bg-[#00F0FF]/10 border-[#00F0FF]/20' },
    hundred_club: { name: 'Centurion', desc: 'Crossed $100 in Earnings', icon: Award, color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
    thousand_club: { name: 'Titan', desc: 'Crossed $1,000 in Earnings', icon: Trophy, color: 'text-[#FFD700] bg-[#FFD700]/10 border-[#FFD700]/20' },
    ten_completed: { name: 'Operator', desc: 'Completed 10 Power Moves', icon: Zap, color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
    fifty_completed: { name: 'Mastermind', desc: 'Completed 50 Power Moves', icon: Star, color: 'text-[#FF007A] bg-[#FF007A]/10 border-[#FF007A]/20' },
  };

  const swarmShortcuts = [
    { name: 'Reddit Scraper', href: '/agents', yieldText: '$150-$1.5k', icon: '🤖' },
    { name: 'Polymarket Arb', href: '/agents', yieldText: '+4.5-18% ROI', icon: '📈' },
    { name: 'Micro-SaaS Builder', href: '/agents', yieldText: '$2k-$10k MRR', icon: '💻' },
    { name: 'AI Video Maker', href: '/agents', yieldText: '$300-$2.4k/mo', icon: '🎬' },
  ];

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-8">
      {/* Title & Mission Status */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-[#00F0FF] text-xs font-mono mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-ping" />
            <span>OPERATIVE COMMAND TERMINAL // ACTIVE SESSION</span>
          </div>
          <h1 className="font-orbitron text-2xl md:text-4xl text-white uppercase tracking-wider">
            Command Center // <span className="cyan-gold-gradient-text">{user?.name ?? 'OPERATIVE'}</span>
          </h1>
        </div>

        <div className="flex gap-2">
          <Link href="/dashboard/grants">
            <Button size="sm" variant="outline" className="border-[#FFD700]/30 text-xs font-mono uppercase h-9 px-4 text-[#FFD700] bg-[#FFD700]/10 hover:bg-[#FFD700]/20">
              <Gift className="w-3.5 h-3.5 mr-1.5" /> $25 Grant
            </Button>
          </Link>
          <Link href="/agents">
            <Button size="sm" className="cyan-gradient text-black font-extrabold uppercase text-xs h-9 px-4 holographic-btn font-mono">
              <Bot className="w-3.5 h-3.5 mr-1.5 fill-current" /> Deploy Swarm Agent
            </Button>
          </Link>
          <Link href="/workflows">
            <Button size="sm" variant="outline" className="border-white/10 text-xs font-mono uppercase h-9 px-4 text-white bg-white/[0.03]">
              <Layers className="w-3.5 h-3.5 mr-1.5 text-[#00F0FF]" /> Workflows
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* 5-Step Interactive Onboarding Modal */}
      <OnboardingTour user={user} />

      {/* Quick Launch Swarm Dock */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {swarmShortcuts.map((s, idx) => (
          <Link key={idx} href={s.href} className="glass-card p-3 flex items-center justify-between group hover:border-[#00F0FF]/40 transition-all">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{s.icon}</span>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-[#00F0FF] transition-colors font-mono">{s.name}</div>
                <div className="text-[10px] text-green-400 font-mono font-bold">{s.yieldText}</div>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[#8E9BB4] group-hover:text-[#00F0FF] group-hover:translate-x-0.5 transition-all" />
          </Link>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: DollarSign, label: 'Total Earnings', value: `$${earnings.toLocaleString()}`, color: 'text-green-400' },
          { icon: Star, label: 'Rank Bandwidth', value: `Lvl ${lvlInfo.level} (${lvlInfo.name})`, color: 'text-[#00F0FF]' },
          { icon: Flame, label: 'Active Streak', value: `${streak} Days`, color: 'text-[#FFD700]' },
          { icon: Award, label: 'Completed Moves', value: `${completedCount} Done`, color: 'text-[#FF007A]' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-5"
          >
            <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
            <div className="stat-number text-white text-xl md:text-2xl font-mono">{stat.value}</div>
            <div className="text-[10px] text-[#8E9BB4] uppercase tracking-widest mt-1 font-mono">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Level Progression Bandwidth */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6 mb-8"
      >
        <div className="flex items-center justify-between mb-3 text-xs font-mono">
          <span className="text-[#00F0FF] uppercase tracking-wider font-bold">Terminal Bandwidth Progression</span>
          <span className="text-[#8E9BB4]">
            ${earnings.toLocaleString()} / ${(lvlInfo.maxPoints / 100).toLocaleString()} ({Math.round(lvlInfo.progress)}%)
          </span>
        </div>
        <div className="h-3 w-full bg-black/50 rounded-full overflow-hidden border border-white/[0.08] p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#00F0FF] via-[#00C2FF] to-[#FFD700] shadow-[0_0_20px_rgba(0,240,255,0.6)] transition-all duration-500"
            style={{ width: `${Math.max(lvlInfo.progress, 5)}%` }}
          />
        </div>
        <p className="text-[10px] text-[#8E9BB4] mt-2 font-mono uppercase tracking-wider">
          Next level threshold: ${(lvlInfo.maxPoints / 100).toLocaleString()} in total earnings. Complete Power Moves and run Swarm Agents to level up.
        </p>
      </motion.div>

      {/* Main Grid: Live Pulse Opportunities & Badge Vault */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Live Pulse opportunity feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-orbitron text-lg text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF007A] animate-ping" />
              Hot Live Pulse Opportunities
            </h2>
            <Link href="/tasks" className="text-xs text-[#00F0FF] flex items-center gap-1 hover:translate-x-1 transition-transform font-mono">
              All Power Moves <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {trendingMoves.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/tasks/${task.id}`}>
                  <div className="glass-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] text-[#00F0FF] font-bold font-mono uppercase tracking-wider bg-[#00F0FF]/10 border border-[#00F0FF]/20 px-2 py-0.5 rounded">
                          {task.category}
                        </span>
                        <span className="text-[9px] text-[#FFD700] font-bold font-mono uppercase tracking-wider bg-[#FFD700]/10 border border-[#FFD700]/20 px-2 py-0.5 rounded">
                          Score: {task.trendScore.toFixed(1)}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white group-hover:text-[#00F0FF] transition-colors line-clamp-1 font-mono">
                        {task.title}
                      </h3>
                      <p className="text-xs text-[#8E9BB4] line-clamp-1 mt-1 font-sans">
                        {task.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/[0.06] pt-3 md:pt-0">
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-400 font-mono">
                          +${task.estimatedEarningsLow}-${task.estimatedEarningsHigh}
                        </div>
                        <div className="text-[10px] text-[#8E9BB4] font-mono">
                          ⏱️ {task.timeToFirstDollar ?? '1-7 days'}
                        </div>
                      </div>
                      <Button size="sm" className="h-9 px-4 text-[10px] cyan-gradient text-black font-extrabold uppercase font-mono flex items-center gap-1">
                        <Play className="w-2.5 h-2.5 fill-black" /> Run Move
                      </Button>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}

            {trendingMoves.length === 0 && (
              <div className="glass-card p-8 text-center text-[#8E9BB4] text-sm font-mono">
                No active trends on the Live Pulse. Run the pipeline to sync new moves.
              </div>
            )}
          </div>
        </div>

        {/* Badge Vault Sidebar */}
        <div className="space-y-6">
          <h2 className="font-orbitron text-lg text-white uppercase tracking-wider flex items-center gap-2">
            <Award className="w-5 h-5 text-[#FFD700]" /> Badge Vault
          </h2>

          <div className="glass-card p-5 space-y-3">
            {Object.keys(badgeConfig).map((key) => {
              const cfg = badgeConfig[key];
              const isUnlocked = badgesList.includes(key);
              const IconComp = cfg.icon;

              return (
                <div
                  key={key}
                  className={`flex gap-3 items-center p-3 rounded-xl border transition-all duration-300 ${
                    isUnlocked
                      ? `${cfg.color} opacity-100`
                      : 'border-white/[0.04] bg-white/[0.01] text-[#8E9BB4] opacity-40'
                  }`}
                >
                  <div className={`p-2 rounded-full border ${isUnlocked ? 'border-current' : 'border-white/10'}`}>
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-orbitron uppercase tracking-wider">
                      {cfg.name} {isUnlocked ? '✓' : '🔒'}
                    </h4>
                    <p className="text-[10px] text-[#8E9BB4] font-sans mt-0.5">{cfg.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
