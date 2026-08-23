'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Swords, Zap, Shield, Brain } from 'lucide-react';
import { FighterStats } from '@/lib/cosmetics/stats';

export interface FighterStatsBarProps {
  stats: FighterStats;
  baseStats?: FighterStats;
  compact?: boolean;
  className?: string;
}

export function FighterStatsBar({
  stats,
  baseStats,
  compact = false,
  className = '',
}: FighterStatsBarProps) {
  const statRows = [
    {
      key: 'pwr' as const,
      label: 'PWR',
      fullLabel: 'Power / Yield',
      value: stats.pwr,
      base: baseStats?.pwr,
      color: 'from-amber-500 to-red-500',
      textColor: 'text-red-400',
      icon: Swords,
    },
    {
      key: 'spd' as const,
      label: 'SPD',
      fullLabel: 'Speed / Velocity',
      value: stats.spd,
      base: baseStats?.spd,
      color: 'from-cyan-400 to-blue-500',
      textColor: 'text-[#00F0FF]',
      icon: Zap,
    },
    {
      key: 'def' as const,
      label: 'DEF',
      fullLabel: 'Defense / Survival',
      value: stats.def,
      base: baseStats?.def,
      color: 'from-emerald-400 to-teal-500',
      textColor: 'text-emerald-400',
      icon: Shield,
    },
    {
      key: 'syn' as const,
      label: 'SYN',
      fullLabel: 'Synergy / Intelligence',
      value: stats.syn,
      base: baseStats?.syn,
      color: 'from-purple-400 to-pink-500',
      textColor: 'text-purple-400',
      icon: Brain,
    },
  ];

  return (
    <div className={`space-y-2.5 font-mono ${className}`}>
      {statRows.map((stat) => {
        const Icon = stat.icon;
        const delta = stat.base !== undefined ? stat.value - stat.base : 0;

        return (
          <div key={stat.key} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-[#8E9BB4] text-[11px] font-bold">
                <Icon className={`w-3.5 h-3.5 ${stat.textColor}`} />
                <span>{compact ? stat.label : stat.fullLabel}</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-white text-[11px]">{stat.value}</span>
                {delta !== 0 && (
                  <span
                    className={`text-[9px] font-bold px-1 py-0.2 rounded ${
                      delta > 0
                        ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                        : 'text-red-400 bg-red-500/10 border border-red-500/20'
                    }`}
                  >
                    {delta > 0 ? `+${delta}` : delta}
                  </span>
                )}
              </div>
            </div>
            {/* Stat Gauge Bar */}
            <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden border border-white/10 p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(5, stat.value))}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={`h-full rounded-full bg-gradient-to-r ${stat.color} shadow-[0_0_8px_currentColor]`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
