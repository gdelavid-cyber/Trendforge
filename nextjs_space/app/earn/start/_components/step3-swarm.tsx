'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Cpu, Layers, Sparkles, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { VettedOpportunity } from '@/app/api/earn/opportunities/route';
import type { GuidedLead } from '@/app/api/earn/leads/route';

interface Step3Props {
  selectedOpp: VettedOpportunity;
  leads: GuidedLead[];
  onProceed: () => void;
}

export function Step3Swarm({ selectedOpp, leads, onProceed }: Step3Props) {
  const [progress, setProgress] = useState(0);
  const [builderStep, setBuilderStep] = useState(0);
  const [scoutStep, setScoutStep] = useState(0);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setComplete(true);
          return 100;
        }
        const next = prev + 5;
        if (next >= 30 && next < 65) setBuilderStep(1);
        if (next >= 65) setBuilderStep(2);
        if (next >= 40 && next < 80) setScoutStep(1);
        if (next >= 80) setScoutStep(2);
        return next;
      });
    }, 250);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6 text-left"
    >
      <div className="text-center max-w-2xl mx-auto mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-xs font-mono text-[#00F0FF] mb-2">
          <Cpu className="w-3.5 h-3.5 animate-spin" /> CONCURRENT SWARM EXECUTION
        </div>
        <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-2">
          Builders Build. Scout Hunts.
        </h2>
        <p className="text-xs md:text-sm text-[#8E9BB4] font-mono">
          While your turnkey deliverable is being created, the Buyer Scout discovers qualified clients in real time.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="max-w-3xl mx-auto p-4 rounded-xl bg-black/60 border border-white/10 font-mono">
        <div className="flex items-center justify-between mb-2 text-xs">
          <span className="text-[#8E9BB4]">SWARM ORCHESTRATION PIPELINE:</span>
          <span className="text-[#00F0FF] font-bold">{progress}% COMPLETE</span>
        </div>
        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#00F0FF] via-[#00FF66] to-[#FFD700] h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Split Screen Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {/* LEFT PANEL: Deliverable Builder */}
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#00F0FF]" />
                <span className="text-xs font-mono font-bold uppercase text-white">
                  PANEL A: DELIVERABLE BUILDER
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#00F0FF] bg-[#00F0FF]/10 px-2 py-0.5 rounded border border-[#00F0FF]/20">
                PARALLEL CORE 1
              </span>
            </div>

            <div className="space-y-3 font-mono">
              <div
                className={`p-3 rounded-xl border transition-all ${
                  builderStep >= 0
                    ? 'bg-[#00F0FF]/10 border-[#00F0FF]/40 text-white'
                    : 'bg-white/[0.02] border-white/5 text-[#8E9BB4]'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span>1. Research &amp; Pain-Point Telemetry</span>
                  {builderStep > 0 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF66]" />
                  ) : (
                    <span className="text-[10px] text-[#00F0FF]">SYNTHESIZING</span>
                  )}
                </div>
                <p className="text-[11px] text-[#8E9BB4]">
                  Extracting technical specs and commercial demand signals from {selectedOpp.category}.
                </p>
              </div>

              <div
                className={`p-3 rounded-xl border transition-all ${
                  builderStep >= 1
                    ? 'bg-[#00F0FF]/10 border-[#00F0FF]/40 text-white'
                    : 'bg-white/[0.02] border-white/5 text-[#8E9BB4]'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span>2. Turnkey Master Deliverable Asset</span>
                  {builderStep > 1 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF66]" />
                  ) : builderStep === 1 ? (
                    <span className="text-[10px] text-[#00F0FF]">COMPILING</span>
                  ) : (
                    <span className="text-[10px] text-white/30">QUEUED</span>
                  )}
                </div>
                <p className="text-[11px] text-[#8E9BB4]">
                  Rendering production files, prompt manifests, and client setup instructions.
                </p>
              </div>

              <div
                className={`p-3 rounded-xl border transition-all ${
                  builderStep >= 2
                    ? 'bg-[#00F0FF]/10 border-[#00F0FF]/40 text-white'
                    : 'bg-white/[0.02] border-white/5 text-[#8E9BB4]'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span>3. Proposal Script &amp; Audio/Video Demo</span>
                  {complete ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF66]" />
                  ) : builderStep === 2 ? (
                    <span className="text-[10px] text-[#00F0FF]">FINALIZING</span>
                  ) : (
                    <span className="text-[10px] text-white/30">QUEUED</span>
                  )}
                </div>
                <p className="text-[11px] text-[#8E9BB4]">
                  Synthesizing audio voiceover hook and 1-page presentation deck.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] text-[10px] font-mono text-[#8E9BB4]">
            STATUS: {complete ? 'All 3 deliverables compiled.' : 'Generating production assets...'}
          </div>
        </div>

        {/* RIGHT PANEL: Concurrent Buyer Scout */}
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#00FF66]" />
                <span className="text-xs font-mono font-bold uppercase text-white">
                  PANEL B: CONCURRENT BUYER SCOUT
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#00FF66] bg-[#00FF66]/10 px-2 py-0.5 rounded border border-[#00FF66]/20">
                PARALLEL CORE 2
              </span>
            </div>

            <div className="space-y-3 font-mono">
              {leads.slice(0, 3).map((lead, idx) => (
                <div
                  key={lead.id}
                  className={`p-3 rounded-xl border transition-all ${
                    scoutStep >= idx
                      ? 'bg-[#00FF66]/10 border-[#00FF66]/30 text-white'
                      : 'bg-white/[0.02] border-white/5 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold">{lead.organization}</span>
                    <span className="text-[10px] text-[#00FF66] font-bold">
                      {lead.matchScore}% MATCH
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8E9BB4] line-clamp-1">{lead.detectedPainPoint}</p>
                  <div className="text-[10px] text-[#FFD700] mt-1">Budget: {lead.estimatedBudget}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] text-[10px] font-mono text-[#00FF66]">
            FOUND: {leads.length} qualified prospects with verified intent.
          </div>
        </div>
      </div>

      {/* Educational Reassurance Card */}
      <div className="max-w-3xl mx-auto p-4 rounded-xl bg-white/[0.02] border border-white/10 text-xs font-mono text-[#8E9BB4] flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-[#FFD700] shrink-0" />
        <span>
          <strong className="text-white">Why parallel execution?</strong> Traditional agencies spend weeks building before finding buyers. Trendly\'s dual-core swarm discovers buyers while the deliverable compiles, eliminating sales lag.
        </span>
      </div>

      {/* Action Button */}
      <div className="text-center pt-4">
        <Button
          size="lg"
          disabled={!complete}
          onClick={onProceed}
          className="cyan-gradient text-black font-extrabold uppercase px-8 h-12 font-mono shadow-[0_0_25px_rgba(0,240,255,0.4)] disabled:opacity-40"
        >
          {complete ? (
            <>Proceed to Step 4: Pick Buyers &amp; Send &rarr;</>
          ) : (
            <>Compiling Swarm Assets ({progress}%)...</>
          )}
        </Button>
      </div>
    </motion.div>
  );
}