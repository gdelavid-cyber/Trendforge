'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, CheckCircle2, DollarSign, Layers, ShieldCheck, Sparkles, Trophy, Wallet, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { EarnMethod, EarnScene } from '@/lib/earn/methods';

interface SceneProps {
  method: EarnMethod;
  scene: EarnScene;
  onTriggerSwarm?: () => void;
}

export function SceneLaunchEconomics({ method, scene, onTriggerSwarm }: SceneProps) {
  return (
    <div className="relative w-full h-full min-h-screen flex items-center justify-center px-4 md:px-8 py-16 overflow-hidden bg-[#06060E]">
      <div className="max-w-4xl w-full mx-auto relative z-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-xs font-mono mb-4"
        >
          <span className="w-2 h-2 rounded-full bg-[#9D00FF] animate-pulse" />
          <span className="text-[#9D00FF] font-bold">METHOD {String(method.number).padStart(2, '0')}</span>
          <span className="text-white/40">/</span>
          <span className="text-[#8E9BB4]">SCENE 5: LAUNCH & ECONOMICS</span>
        </motion.div>

        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-3">
          {scene.headline}
        </h2>

        <p className="text-base md:text-lg text-[#00F0FF] mb-2 max-w-2xl font-mono">
          {scene.subheadline}
        </p>

        <p className="text-xs md:text-sm text-[#8E9BB4] max-w-2xl mb-8">
          {scene.body}
        </p>

        {/* Ledger & Settlement Box */}
        <div className="w-full max-w-2xl p-5 rounded-2xl bg-white/[0.02] border border-white/10 mb-6 text-left backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08]">
            <span className="text-xs font-mono text-[#8E9BB4] uppercase">Escrow Settlement & Ledger</span>
            <span className="text-xs font-mono text-[#00FF66] flex items-center gap-1 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED ESCROW
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 font-mono text-center">
            <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06]">
              <div className="text-[10px] text-[#8E9BB4] mb-1">SETTLEMENT TIMELINE</div>
              <div className="text-xs font-bold text-white">{method.timeToFirstDollar}</div>
            </div>
            <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06]">
              <div className="text-[10px] text-[#8E9BB4] mb-1">PLATFORM LEDGER</div>
              <div className="text-xs font-bold text-[#FFD700]">Direct Stripe/USDC</div>
            </div>
            <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06]">
              <div className="text-[10px] text-[#8E9BB4] mb-1">ESTIMATED YIELD</div>
              <div className="text-xs font-bold text-[#00FF66]">Performance-Backed</div>
            </div>
          </div>
        </div>

        {/* Risk / Disclaimers if any */}
        {(scene.riskNote || method.riskWarning) && (
          <div className="max-w-2xl w-full p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs text-left mb-8 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold font-mono uppercase text-[11px] text-red-400">Risk Disclosure & Compliance</div>
              <div className="leading-relaxed opacity-90">{scene.riskNote || method.riskWarning}</div>
            </div>
          </div>
        )}

        {/* Launch actions */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button
            size="lg"
            onClick={onTriggerSwarm}
            className="cyan-gradient text-black font-extrabold uppercase px-8 h-12 font-mono shadow-[0_0_25px_rgba(0,240,255,0.4)]"
          >
            <Zap className="w-4 h-4 mr-2 fill-current" /> Deploy AI Swarm Now
          </Button>
          <Link href="/earn">
            <Button
              size="lg"
              variant="outline"
              className="border-white/10 text-white font-mono h-12 px-6 hover:bg-white/[0.04]"
            >
              Back to 9 Methods Hub
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}