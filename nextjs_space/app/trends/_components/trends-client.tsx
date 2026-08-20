'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Flame, Clock, Zap, ArrowRight, Play, DollarSign, Layers } from 'lucide-react';
import { TrendCategoryBadge } from '@/components/trend-badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function TrendsClient({ trends }: { trends: any[] }) {
  return (
    <div className="max-w-[1200px] mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/20 text-[#FFD700] text-xs font-mono mb-2">
          <Flame className="w-3.5 h-3.5 animate-pulse" />
          <span>LIVE MARKET PULSE // DEDUPLICATED TELEMETRY</span>
        </div>
        <h1 className="font-display font-bold text-3xl md:text-4xl text-white flex items-center gap-2">
          Trending <span className="cyan-gold-gradient-text">Opportunities</span>
        </h1>
        <p className="text-sm text-[#8892B0] font-sans mt-1">
          Surging internet demand signals mapped directly to actionable, zero-to-low cost money-making moves.
        </p>
      </div>

      <div className="space-y-6">
        {(trends ?? []).map((trend: any, i: number) => (
          <motion.div
            key={trend?.id ?? i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="glass-card p-6 border border-white/[0.08] hover:border-[#00F0FF]/30 transition-all group"
          >
            {/* Trend Summary Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="live-pulse-dot">
                    <span className="ping bg-[#00F0FF]" />
                    <span className="core bg-[#00F0FF]" />
                  </span>
                  <h3 className="font-display font-bold text-lg text-white group-hover:text-[#00F0FF] transition-colors">
                    {trend?.name ?? 'Emerging Opportunity'}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <TrendCategoryBadge category={trend?.category ?? 'AI_TOOLS'} />
                  {(trend?.sourcePlatforms ?? []).map((p: string) => (
                    <span key={p} className="text-[10px] font-mono bg-black/50 border border-white/5 px-2 py-0.5 rounded text-[#8892B0]">
                      {p}
                    </span>
                  ))}
                  <span className="text-[10px] font-mono text-[#8892B0] flex items-center gap-1 ml-2">
                    <Clock className="w-3 h-3 text-[#00F0FF]" /> Detected {Math.round(trend?.hoursSinceDetection ?? 0)}h ago
                  </span>
                </div>
              </div>

              {/* Metrics */}
              <div className="flex items-center gap-6 flex-shrink-0 font-mono">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-sm">
                    <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-green-400 font-bold">{Math.round(trend?.mentionVelocity ?? 12)}</span>
                  </div>
                  <div className="text-[9px] text-[#8892B0] uppercase">mentions/hr</div>
                </div>

                <div className="text-center">
                  <div className="text-sm">
                    <span className="text-[#FFD700] font-bold">{((trend?.confidence ?? 0.9) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="text-[9px] text-[#8892B0] uppercase">confidence</div>
                </div>

                <div className="w-24 hidden sm:block">
                  <div className="text-[9px] text-[#8892B0] uppercase mb-1">Sentiment</div>
                  <Progress value={(trend?.sentimentScore ?? 0.85) * 100} className="h-1.5 bg-black/60" />
                </div>
              </div>
            </div>

            {/* Linked Tasks for this trend */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#00F0FF] flex items-center gap-1">
                  <Layers className="w-3 h-3" /> Associated Power Moves ({trend?.taskCount ?? trend?.tasks?.length ?? 0}):
                </span>
                <Link
                  href={`/tasks?category=${trend?.category || 'AI_TOOLS'}`}
                  className="text-[11px] font-mono text-[#8892B0] hover:text-[#00F0FF] flex items-center gap-1"
                >
                  View All in Category <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {trend?.tasks && trend.tasks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                  {trend.tasks.map((task: any) => (
                    <Link key={task.id} href={`/tasks/${task.id}`} className="block">
                      <div className="bg-black/40 border border-white/[0.05] hover:border-[#00F0FF]/40 rounded-lg p-3 transition-all flex flex-col justify-between h-full">
                        <div>
                          <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-[#00F0FF]">
                            {task.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-[#8892B0]">
                            <span className="text-green-400 font-bold">
                              +${task.estimatedEarningsLow}-${task.estimatedEarningsHigh}
                            </span>
                            <span>·</span>
                            <span>${task.startupCost} setup</span>
                            <span>·</span>
                            <span>{task.timeToFirstDollar || '1-3d'}</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-white/[0.04] flex items-center justify-end">
                          <span className="text-[10px] font-mono text-[#00F0FF] flex items-center gap-1 font-bold">
                            Run Move <Play className="w-2.5 h-2.5 fill-[#00F0FF]" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-xs font-mono text-[#8892B0] py-2">
                  Automated tasks currently queuing in Swarm pipeline.
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {(trends?.length ?? 0) === 0 && (
        <div className="glass-card p-12 text-center">
          <Flame className="w-8 h-8 text-[#FFD700] mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white uppercase tracking-wider">No Active Trends</h3>
          <p className="text-xs text-[#8892B0] mt-1 font-sans">
            Scraper pipeline is actively refreshing from social and search nodes.
          </p>
        </div>
      )}
    </div>
  );
}
