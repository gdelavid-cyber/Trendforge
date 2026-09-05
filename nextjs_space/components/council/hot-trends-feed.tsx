'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Lock, Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function HotTrendsFeed() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [userModeEnabled, setUserModeEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('/api/hot-trends')
      .then((r) => r.json())
      .then((data) => {
        setUserModeEnabled(Boolean(data.userModeEnabled));
        setProposals(data.proposals || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-xs text-[#8E9BB4] text-center font-mono">
        Scanning Council discoveries...
      </div>
    );
  }

  if (!userModeEnabled || proposals.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-[#8E9BB4] space-y-2">
        <div className="flex items-center gap-2 text-white font-bold">
          <Lock className="w-3.5 h-3.5 text-[#00F0FF]" />
          <span>Council Discovery Mode: Internal Only</span>
        </div>
        <p className="text-[11px] leading-relaxed text-[#8E9BB4]">
          The 5-agent AI Money Council operates internally under administrator review. High-velocity market arbitrage
          signals will surface here when user-mode exposure is enabled.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 font-mono">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs font-bold text-white uppercase">
          <Flame className="w-4 h-4 text-[#FFD700]" /> Council-Approved Hot Trends
        </div>
        <span className="text-[10px] text-[#00FF66] font-bold px-2 py-0.5 rounded bg-[#00FF66]/10 border border-[#00FF66]/20">
          Live User Feed
        </span>
      </div>

      <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
        {proposals.map((idea) => (
          <motion.div
            key={idea.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-[#0B0B14] border border-white/10 hover:border-[#00F0FF]/40 transition-all text-left space-y-2"
          >
            <div className="flex items-start justify-between gap-3">
              <h4 className="text-sm font-bold text-white font-sans line-clamp-1">{idea.title}</h4>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/20 shrink-0">
                {idea.mapsToMethod || 'Custom Vector'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-[#8E9BB4]">
              <div>
                <span className="text-white/40">Target:</span> {idea.targetBuyer}
              </div>
              <div>
                <span className="text-white/40">Model:</span> {idea.revenueModel}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-white/5">
              <span className="text-[10px] text-white/40">{idea.marketVector}</span>
              <Link href="/earn/start">
                <Button size="sm" className="cyan-gradient text-black font-extrabold uppercase text-[10px] h-7 px-3">
                  Deploy &rarr;
                </Button>
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
