'use client';

import Link from 'next/link';
import { Flame, TrendingUp, Zap, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { AnimatedCounter } from '@/components/counter';
import { TrendCategoryBadge } from '@/components/trend-badge';

export function LandingHero({ trends }: { trends: any[] }) {
  return (
    <section className="relative overflow-hidden">
      {/* Background effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-gold/5 via-transparent to-transparent" />
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[120px]" />

      <div className="relative max-w-[1200px] mx-auto px-4 pt-20 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5 mb-6">
            <Flame className="w-4 h-4 text-gold" />
            <span className="text-sm text-gold font-medium">New task drops daily</span>
          </div>

          <h1 className="font-display font-bold text-4xl md:text-6xl tracking-tight mb-6">
            <span className="gold-text">Forge Wealth</span> from the<br />
            Week&apos;s Hottest Trends
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Verified money-making tasks. From zero-cost side hustles to
            high-reward ventures — all backed by real success stories.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/auth/signup">
              <Button size="lg" className="gold-gradient text-black font-bold text-lg px-8 h-12">
                Start Forging Free <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="lg" className="border-gold/30 text-gold hover:bg-gold/10 h-12">
                View Plans
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto mb-16">
            <div className="text-center">
              <div className="text-2xl font-bold text-gold"><AnimatedCounter value={520} suffix="+" /></div>
              <div className="text-xs text-muted-foreground">Tasks Delivered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400"><AnimatedCounter value={89} suffix="%" /></div>
              <div className="text-xs text-muted-foreground">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground"><AnimatedCounter value={2400} prefix="$" suffix="+" /></div>
              <div className="text-xs text-muted-foreground">Avg. First Month</div>
            </div>
          </div>
        </motion.div>

        {/* Live Trend Ticker */}
        {(trends?.length ?? 0) > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-live" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Live Trends</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {(trends ?? []).map((trend: any) => (
                <div key={trend?.id} className="flex-shrink-0 bg-card-bg border border-border-subtle rounded-lg px-4 py-3 min-w-[220px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground truncate">{trend?.name ?? 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendCategoryBadge category={trend?.category ?? 'OTHER'} />
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-green-400" />
                      {Math.round(trend?.mentionVelocity ?? 0)}/hr
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
