'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Bot, Clock, DollarSign, Flame, Layers, ShieldCheck, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MethodCard } from '@/components/earn/method-card';
import { BrainstormModal } from '@/components/earn/brainstorm-modal';
import type { EarnMethod } from '@/lib/earn/methods';
import Link from 'next/link';

interface EarnLandingClientProps {
  methods: EarnMethod[];
  isAuthenticated: boolean;
}

export function EarnLandingClient({ methods, isAuthenticated }: EarnLandingClientProps) {
  const [isBrainstormOpen, setIsBrainstormOpen] = useState(false);

  const scrollToMethods = () => {
    const el = document.getElementById('methods-grid');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="relative py-16 text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-xs font-mono text-[#00F0FF] mb-6 shadow-[0_0_20px_rgba(0,240,255,0.15)]"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="font-bold">THE CINEMATIC EARN HUB · 9 AUTONOMOUS METHODS</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight max-w-4xl"
        >
          Turn Trends Into <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-white to-[#FFD700]">
            Automated Income Systems
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-base sm:text-lg text-[#8E9BB4] max-w-2xl mb-8 leading-relaxed font-sans"
        >
          Select any real-time trend or power move task, inspect the AI execution thesis, and deploy a specialized swarm of parallel builders and concurrent buyer scouts. Every method is self-contained, auditable, and verified.
        </motion.p>

        {/* Primary CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4 mb-16"
        >
          <Button
            size="lg"
            onClick={scrollToMethods}
            className="cyan-gradient text-black font-extrabold uppercase px-8 h-12 font-mono shadow-[0_0_25px_rgba(0,240,255,0.4)]"
          >
            Browse 9 Earning Methods <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={() => setIsBrainstormOpen(true)}
            className="border-[#FFD700]/40 text-[#FFD700] hover:bg-[#FFD700]/10 bg-[#FFD700]/5 font-mono h-12 px-6 font-bold shadow-[0_0_15px_rgba(255,215,0,0.15)]"
          >
            <Zap className="w-4 h-4 mr-2 fill-current" /> Deploy AI Swarm
          </Button>
        </motion.div>
      </div>

      {/* 9 Methods Grid */}
      <div id="methods-grid" className="scroll-mt-24 mb-20">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/[0.08]">
          <div>
            <h2 className="text-2xl font-bold font-mono text-white">THE 9 EARNING METHODS</h2>
            <p className="text-xs text-[#8E9BB4] font-mono mt-1">
              Select any method below to enter its dedicated 5-scene cinematic scroll experience.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[#00F0FF]">
            <Bot className="w-4 h-4" /> 100% ROUTE-ISOLATED
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {methods.map((method, index) => (
            <MethodCard key={method.slug} method={method} index={index} />
          ))}
        </div>
      </div>

      {/* Suggested Product Workflow / Journey */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-6 md:p-8 mb-16 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-[#00FF66]/10 border border-[#00FF66]/30 flex items-center justify-center text-[#00FF66]">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-mono text-white">RECOMMENDED PRODUCT PROGRESSION</h3>
            <p className="text-xs text-[#8E9BB4] font-mono">Suggested adoption workflow based on capital and skill overhead.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] text-left">
            <span className="text-[10px] font-mono text-[#00F0FF] font-bold uppercase tracking-wider block mb-1">
              PHASE 1 · DAY 1 TO 3
            </span>
            <h4 className="text-sm font-bold text-white mb-2">Execute Client Deliverables</h4>
            <p className="text-xs text-[#8E9BB4] leading-relaxed">
              Launch 1-Click Power Moves and activate the Autonomous Sales Pipeline. Zero upfront capital, validate demand with early wins.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] text-left">
            <span className="text-[10px] font-mono text-[#FFD700] font-bold uppercase tracking-wider block mb-1">
              PHASE 2 · WEEK 2+
            </span>
            <h4 className="text-sm font-bold text-white mb-2">Package Assets & Viral Referrals</h4>
            <p className="text-xs text-[#8E9BB4] leading-relaxed">
              List successful agents and templates on the Marketplace (70-80% split) and share your referral link for 10% recurring commissions.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] text-left">
            <span className="text-[10px] font-mono text-[#9D00FF] font-bold uppercase tracking-wider block mb-1">
              PHASE 3 · MONTH 1+
            </span>
            <h4 className="text-sm font-bold text-white mb-2">Micro-SaaS & Sovereign Agents</h4>
            <p className="text-xs text-[#8E9BB4] leading-relaxed">
              Reinvest earned revenue into Turnkey Micro-SaaS software deployments and deploy testnet/verified Web4 sovereign agent workers.
            </p>
          </div>
        </div>

        <p className="text-[11px] text-[#8E9BB4] italic text-center font-mono">
          Note: This timeline represents a suggested product workflow, not a guaranteed financial outcome. Individual results depend on execution, market demand, and customer acquisition.
        </p>
      </div>

      {/* Brainstorm Modal */}
      <BrainstormModal
        isOpen={isBrainstormOpen}
        onClose={() => setIsBrainstormOpen(false)}
        trendTitle="Live Opportunity Radar"
      />
    </div>
  );
}