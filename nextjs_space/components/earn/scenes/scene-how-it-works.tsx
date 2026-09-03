'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Bot, Cpu, Database, Flame, Layers, Network, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { EarnMethod, EarnScene } from '@/lib/earn/methods';

interface SceneProps {
  method: EarnMethod;
  scene: EarnScene;
  onTriggerSwarm?: () => void;
}

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Signal Ingestion',
    desc: 'Live trend or task is selected from Live Pulse or Reddit radar.',
    icon: Flame,
    color: 'text-[#00F0FF] border-[#00F0FF]/30 bg-[#00F0FF]/10',
  },
  {
    step: '02',
    title: 'AI Brainstorm Chamber',
    desc: 'Deep multi-agent thesis: deliverables, target buyer profile, and risks.',
    icon: Sparkles,
    color: 'text-[#FFD700] border-[#FFD700]/30 bg-[#FFD700]/10',
  },
  {
    step: '03',
    title: 'Parallel Swarm Dispatch',
    desc: 'Builders synthesize code, copy, audio, while Sales Scout hunts buyers.',
    icon: Cpu,
    color: 'text-[#FF007A] border-[#FF007A]/30 bg-[#FF007A]/10',
  },
  {
    step: '04',
    title: 'Human Review & Gate',
    desc: 'You verify output, inspect buyer matches, and approve before sending.',
    icon: ShieldCheck,
    color: 'text-[#9D00FF] border-[#9D00FF]/30 bg-[#9D00FF]/10',
  },
  {
    step: '05',
    title: 'Execution & Escrow',
    desc: 'Deliverable shipped, outreach triggered, payments tracked in ledger.',
    icon: Zap,
    color: 'text-[#00FF66] border-[#00FF66]/30 bg-[#00FF66]/10',
  },
];

export function SceneHowItWorks({ method, scene, onTriggerSwarm }: SceneProps) {
  return (
    <div className="relative w-full h-full min-h-screen flex items-center justify-center px-4 md:px-8 py-16 overflow-hidden bg-[#06060E]/95">
      <div className="max-w-5xl w-full mx-auto relative z-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-xs font-mono mb-4"
        >
          <span className="w-2 h-2 rounded-full bg-[#FFD700] animate-pulse" />
          <span className="text-[#FFD700] font-bold">METHOD {String(method.number).padStart(2, '0')}</span>
          <span className="text-white/40">/</span>
          <span className="text-[#8E9BB4]">SCENE 2: ARCHITECTURE & WORKFLOW</span>
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

        {/* Workflow Chain */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 w-full mb-10 text-left">
          {WORKFLOW_STEPS.map((st, i) => {
            const Icon = st.icon;
            return (
              <motion.div
                key={st.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="relative rounded-xl bg-white/[0.02] border border-white/[0.08] p-4 flex flex-col justify-between hover:border-white/20 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono text-[#8E9BB4] font-bold">{st.step}</span>
                    <div className={`p-1.5 rounded-lg border ${st.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-white mb-1.5">{st.title}</h4>
                  <p className="text-[11px] text-[#8E9BB4] leading-relaxed">{st.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Action button */}
        <div>
          {scene.ctaHref ? (
            <Link href={scene.ctaHref}>
              <Button size="lg" className="cyan-gradient text-black font-extrabold uppercase px-8 h-12 font-mono">
                {scene.cta} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          ) : (
            <Button
              size="lg"
              onClick={onTriggerSwarm}
              className="cyan-gradient text-black font-extrabold uppercase px-8 h-12 font-mono"
            >
              <Zap className="w-4 h-4 mr-2 fill-current" /> {scene.cta}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}