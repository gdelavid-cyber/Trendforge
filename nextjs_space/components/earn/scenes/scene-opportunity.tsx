'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, DollarSign, Shield, Zap, ArrowRight, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { EarnMethod, EarnScene } from '@/lib/earn/methods';

interface SceneProps {
  method: EarnMethod;
  scene: EarnScene;
  onTriggerSwarm?: () => void;
}

export function SceneOpportunity({ method, scene, onTriggerSwarm }: SceneProps) {
  return (
    <div className="relative w-full h-full min-h-screen flex items-center justify-center px-4 md:px-8 py-16 overflow-hidden bg-[#06060E]/90">
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-40" />
      
      <div className="max-w-4xl w-full mx-auto relative z-10 text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-xs font-mono mb-6 backdrop-blur-md"
        >
          <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse" />
          <span className="text-[#00F0FF] font-bold">METHOD {String(method.number).padStart(2, '0')}</span>
          <span className="text-white/40">/</span>
          <span className="text-[#8E9BB4]">SCENE 1: THE OPPORTUNITY</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-4 leading-tight"
        >
          {scene.headline}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-[#00F0FF] font-medium mb-6 max-w-2xl"
        >
          {scene.subheadline}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-sm md:text-base text-[#8E9BB4] max-w-2xl mb-8 leading-relaxed"
        >
          {scene.body}
        </motion.p>

        {/* Metrics Grid */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-2xl mb-8"
        >
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm text-left">
            <div className="text-[11px] font-mono text-[#8E9BB4] mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span>TIME TO FIRST $</span>
            </div>
            <div className="text-sm font-bold text-white font-mono">{method.timeToFirstDollar}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm text-left">
            <div className="text-[11px] font-mono text-[#8E9BB4] mb-1 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[#FFD700]" />
              <span>UPFRONT CAPITAL</span>
            </div>
            <div className="text-sm font-bold text-white font-mono">{method.capital === 'zero' ? '$0' : method.capital}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm text-left">
            <div className="text-[11px] font-mono text-[#8E9BB4] mb-1 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#00FF66]" />
              <span>DIFFICULTY</span>
            </div>
            <div className="text-sm font-bold text-white font-mono">{method.difficulty}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm text-left">
            <div className="text-[11px] font-mono text-[#8E9BB4] mb-1 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#FF007A]" />
              <span>RISK LEVEL</span>
            </div>
            <div className="text-sm font-bold text-white font-mono">{method.riskLevel}</div>
          </div>
        </motion.div>

        {/* Risk Warning if present */}
        {method.riskWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="mb-8 max-w-2xl p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs text-left flex items-start gap-2.5"
          >
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{method.riskWarning}</span>
          </motion.div>
        )}

        {/* Action button */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex items-center gap-4"
        >
          {scene.ctaHref ? (
            <Link href={scene.ctaHref}>
              <Button size="lg" className="cyan-gradient text-black font-extrabold uppercase px-8 h-12 shadow-[0_0_25px_rgba(0,240,255,0.4)] hover:shadow-[0_0_35px_rgba(0,240,255,0.6)] transition-all font-mono">
                {scene.cta} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          ) : (
            <Button
              size="lg"
              onClick={onTriggerSwarm}
              className="cyan-gradient text-black font-extrabold uppercase px-8 h-12 shadow-[0_0_25px_rgba(0,240,255,0.4)] hover:shadow-[0_0_35px_rgba(0,240,255,0.6)] transition-all font-mono"
            >
              <Zap className="w-4 h-4 mr-2 fill-current" /> {scene.cta}
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
}