'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Flame, BarChart3, Clock, Zap } from 'lucide-react';
import { TrendCategoryBadge } from '@/components/trend-badge';
import { Progress } from '@/components/ui/progress';

export function TrendsClient({ trends }: { trends: any[] }) {
  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl flex items-center gap-2 mb-1">
          <TrendingUp className="w-7 h-7 text-gold" /> Live Trends
        </h1>
        <p className="text-muted-foreground">Real-time trend detection from 11 sources</p>
      </div>

      <div className="space-y-4">
        {(trends ?? []).map((trend: any, i: number) => (
          <motion.div
            key={trend?.id ?? i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card-bg border border-border-subtle rounded-lg p-5 hover:border-gold/20 transition-all"
          >
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-live" />
                  <h3 className="font-display font-semibold text-lg">{trend?.name ?? 'Unknown'}</h3>
                </div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <TrendCategoryBadge category={trend?.category ?? 'OTHER'} />
                  {(trend?.sourcePlatforms ?? []).map((p: string) => (
                    <span key={p} className="text-xs bg-dark-navy px-2 py-0.5 rounded text-muted-foreground">{p}</span>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  Detected {Math.round(trend?.hoursSinceDetection ?? 0)}h ago
                  <span className="mx-2">·</span>
                  <Zap className="w-3 h-3" />
                  {trend?.taskCount ?? 0} tasks generated
                </div>
              </div>

              <div className="flex gap-6 flex-shrink-0">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-sm font-mono">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 font-bold">{Math.round(trend?.mentionVelocity ?? 0)}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">mentions/hr</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-mono">
                    <span className="text-gold font-bold">{((trend?.confidence ?? 0) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">confidence</div>
                </div>
                <div className="w-24">
                  <div className="text-[10px] text-muted-foreground mb-1">Sentiment</div>
                  <Progress value={(trend?.sentimentScore ?? 0) * 100} className="h-2 bg-dark-navy" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {(trends?.length ?? 0) === 0 && (
        <div className="bg-card-bg border border-border-subtle rounded-lg p-8 text-center">
          <Flame className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No trends detected yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
