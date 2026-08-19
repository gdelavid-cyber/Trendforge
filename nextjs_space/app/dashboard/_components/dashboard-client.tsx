'use client';

import { motion } from 'framer-motion';
import { Flame, Star, Zap, Award, Trophy, ChevronRight, Play, Target } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getWealthPoints, getLevelInfo, getStreak, getBadges } from '@/app/gamification';

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
  // Dynamically calculate metrics on the fly using standard schema inputs
  const earnings = user?.totalEarnings ?? 0;
  const completedCount = user?.completedCount ?? 0;
  const userTasksList = user?.userTasks ?? [];

  const points = getWealthPoints(earnings);
  const lvlInfo = getLevelInfo(earnings);
  const streak = getStreak(userTasksList);
  const badgesList = getBadges(earnings, completedCount);

  const badgeConfig: { [key: string]: { name: string; desc: string; icon: any; color: string } } = {
    first_move: { name: 'Initiate', desc: 'Completed First Power Move', icon: Target, color: 'text-[#00F0FF] bg-[#00F0FF]/10 border-[#00F0FF]/20' },
    hundred_club: { name: 'Centurion', desc: 'Crossed 10,000 WP ($100)', icon: Award, color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
    thousand_club: { name: 'Titan', desc: 'Crossed 100,000 WP ($1,000)', icon: Trophy, color: 'text-[#FFD700] bg-[#FFD700]/10 border-[#FFD700]/20' },
    ten_completed: { name: 'Operator', desc: 'Completed 10 Power Moves', icon: Zap, color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
    fifty_completed: { name: 'Mastermind', desc: 'Completed 50 Power Moves', icon: Star, color: 'text-[#FF6B9D] bg-[#FF6B9D]/10 border-[#FF6B9D]/20' },
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      {/* Title */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl md:text-4xl text-white uppercase tracking-wider flex items-center gap-2">
          Command Center // <span className="cyan-gold-gradient-text">{user?.name ?? 'OPERATIVE'}</span>
        </h1>
        <p className="text-xs text-[#8892B0] font-mono mt-1">AUTHORIZED CORE TERMINAL ACCESS GRANTED</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Zap, label: 'Wealth Points', value: `${points.toLocaleString()} WP`, color: 'text-[#FFD700]' },
          { icon: Star, label: 'Level Rank', value: `Lvl ${lvlInfo.level} (${lvlInfo.name})`, color: 'text-[#00F0FF]' },
          { icon: Flame, label: 'Active Streak', value: `${streak} Days`, color: 'text-[#FFD700]' },
          { icon: Award, label: 'Completed Moves', value: `${completedCount} Done`, color: 'text-[#FF6B9D]' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-6"
          >
            <stat.icon className={`w-5 h-5 ${stat.color} mb-3`} />
            <div className="stat-number text-white text-xl md:text-2xl">{stat.value}</div>
            <div className="text-[10px] text-[#8892B0] uppercase tracking-widest mt-1 font-mono">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Level Progression Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6 mb-8"
      >
        <div className="flex items-center justify-between mb-3 text-xs font-mono">
          <span className="text-[#00F0FF] uppercase tracking-wider font-bold">Terminal Upgrade Bandwidth</span>
          <span className="text-[#8892B0]">
            {points} / {lvlInfo.maxPoints} WP ({Math.round(lvlInfo.progress)}%)
          </span>
        </div>
        <div className="h-3 w-full bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.08] p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#00F0FF] to-[#0088CC] shadow-[0_0_15px_rgba(0,240,255,0.5)] transition-all duration-500"
            style={{ width: `${lvlInfo.progress}%` }}
          />
        </div>
        <p className="text-[10px] text-[#8892B0] mt-2 font-mono uppercase tracking-wider">
          Next level threshold: {lvlInfo.maxPoints} WP. Complete Power Moves to upgrade bandwidth.
        </p>
      </motion.div>

      {/* Main Grid: Live Pulse Opportunities & Badge Vault */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Live Pulse opportunity feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg text-white uppercase tracking-wider flex items-center gap-2">
              <span className="live-pulse-dot">
                <span className="ping bg-[#FF6B9D]" />
                <span className="core bg-[#FF6B9D]" />
              </span>
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
                      <h3 className="text-base text-white group-hover:text-[#00F0FF] transition-colors line-clamp-1">
                        {task.title}
                      </h3>
                      <p className="text-xs text-[#8892B0] line-clamp-1 mt-1 font-sans">
                        {task.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/[0.06] pt-3 md:pt-0">
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-400 font-mono">
                          +{task.estimatedEarningsLow * 100}-{task.estimatedEarningsHigh * 100} WP
                        </div>
                        <div className="text-[10px] text-[#8892B0] font-mono">
                          ⏱️ {task.timeToFirstDollar ?? '1-7 days'}
                        </div>
                      </div>
                      <Button size="sm" className="h-9 px-4 text-[10px] flex items-center gap-1">
                        <Play className="w-2.5 h-2.5 fill-black" /> Run
                      </Button>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}

            {trendingMoves.length === 0 && (
              <div className="glass-card p-8 text-center text-[#8892B0] text-sm">
                No active trends on the Live Pulse. Run the pipeline to sync new moves.
              </div>
            )}
          </div>
        </div>

        {/* Badge Vault Sidebar */}
        <div className="space-y-6">
          <h2 className="text-lg text-white uppercase tracking-wider flex items-center gap-2">
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
                      : 'border-white/[0.04] bg-white/[0.01] text-[#8892B0] opacity-40'
                  }`}
                >
                  <div className={`p-2 rounded-full border ${isUnlocked ? 'border-current' : 'border-white/10'}`}>
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-display uppercase tracking-wider">
                      {cfg.name} {isUnlocked ? '✓' : '🔒'}
                    </h4>
                    <p className="text-[10px] text-[#8892B0] font-sans mt-0.5">{cfg.desc}</p>
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
