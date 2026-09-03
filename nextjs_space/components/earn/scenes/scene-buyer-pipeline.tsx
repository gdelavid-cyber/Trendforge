'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Bot, Check, CheckCircle2, ChevronRight, DollarSign, Mail, MessageSquare, Send, ShieldCheck, UserCheck, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { EarnMethod, EarnScene } from '@/lib/earn/methods';

interface SceneProps {
  method: EarnMethod;
  scene: EarnScene;
  onTriggerSwarm?: () => void;
}

const SAMPLE_BUYERS = [
  {
    name: 'Apex Heating & Mechanical',
    source: 'Google Local Radar',
    problem: 'Missed emergency HVAC night calls losing ~$1,200/wk',
    budget: '$1,500 - $3,000/mo',
    score: 96,
    offer: 'AI Voice Receptionist Turnkey System',
    status: 'Ready to Pitch',
  },
  {
    name: 'Vanguard Realty Group',
    source: 'Reddit /r/smallbusiness',
    problem: 'Seeking automated listing video generator for agents',
    budget: '$2,000/package',
    score: 92,
    offer: '9:16 Faceless Listing Shorts Engine',
    status: 'Verified Intent',
  },
];

export function SceneBuyerPipeline({ method, scene, onTriggerSwarm }: SceneProps) {
  const [salesMode, setSalesMode] = useState<'HYBRID' | 'BOT_SELLS' | 'YOU_SELL'>('HYBRID');

  return (
    <div className="relative w-full h-full min-h-screen flex items-center justify-center px-4 md:px-8 py-16 overflow-hidden bg-[#06060E]/95">
      <div className="max-w-5xl w-full mx-auto relative z-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-xs font-mono mb-4"
        >
          <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
          <span className="text-[#00FF66] font-bold">METHOD {String(method.number).padStart(2, '0')}</span>
          <span className="text-white/40">/</span>
          <span className="text-[#8E9BB4]">SCENE 4: CONCURRENT BUYER SCOUT</span>
        </motion.div>

        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-3">
          {scene.headline}
        </h2>

        <p className="text-base md:text-lg text-[#00F0FF] mb-2 max-w-2xl font-mono">
          {scene.subheadline}
        </p>

        <p className="text-xs md:text-sm text-[#8E9BB4] max-w-2xl mb-6">
          {scene.body}
        </p>

        {/* Mode Selector */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white/[0.04] border border-white/10 mb-8 font-mono text-xs">
          <button
            onClick={() => setSalesMode('HYBRID')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              salesMode === 'HYBRID'
                ? 'bg-[#00F0FF] text-black font-extrabold shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                : 'text-[#8E9BB4] hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Hybrid Mode (AI Drafts, You Send)
          </button>
          <button
            onClick={() => setSalesMode('BOT_SELLS')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              salesMode === 'BOT_SELLS'
                ? 'bg-[#00F0FF] text-black font-extrabold shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                : 'text-[#8E9BB4] hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" /> Bot Sells (Compliant Auto)
          </button>
          <button
            onClick={() => setSalesMode('YOU_SELL')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              salesMode === 'YOU_SELL'
                ? 'bg-[#00F0FF] text-black font-extrabold shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                : 'text-[#8E9BB4] hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" /> You Sell (Manual Only)
          </button>
        </div>

        {/* Buyer Cards Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl mb-8 text-left">
          {SAMPLE_BUYERS.map((buyer) => (
            <div
              key={buyer.name}
              className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] relative group hover:border-[#00F0FF]/30 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white font-mono">{buyer.name}</span>
                <span className="text-[10px] font-mono text-[#00FF66] bg-[#00FF66]/10 px-2 py-0.5 rounded border border-[#00FF66]/20 font-bold">
                  {buyer.score}% MATCH
                </span>
              </div>
              <div className="text-[10px] font-mono text-[#8E9BB4] mb-2">{buyer.source}</div>
              <p className="text-xs text-[#8E9BB4] mb-3 leading-relaxed">
                <span className="text-white/60 font-semibold">Need:</span> {buyer.problem}
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs font-mono">
                <span className="text-[#FFD700] font-bold">{buyer.budget}</span>
                <span className="text-[#00F0FF] flex items-center gap-1 text-[11px]">
                  {buyer.status} <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Action Link */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/sales">
            <Button size="lg" className="cyan-gradient text-black font-extrabold uppercase px-8 h-12 font-mono">
              Open Sales Pipeline <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            onClick={onTriggerSwarm}
            className="border-white/10 text-white font-mono h-12 px-6 hover:bg-white/[0.04]"
          >
            Deploy New Buyer Hunt
          </Button>
        </div>
      </div>
    </div>
  );
}