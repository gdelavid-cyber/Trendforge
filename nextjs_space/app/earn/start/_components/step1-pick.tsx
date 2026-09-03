'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, DollarSign, Flame, RotateCcw, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { VettedOpportunity } from '@/app/api/earn/opportunities/route';

interface Step1Props {
  opportunities: VettedOpportunity[];
  selectedOppId: string;
  onSelect: (id: string) => void;
  onShuffle: (newOpps: VettedOpportunity[]) => void;
  onContinue: () => void;
}

export function Step1Pick({
  opportunities,
  selectedOppId,
  onSelect,
  onShuffle,
  onContinue,
}: Step1Props) {
  const [isShuffling, setIsShuffling] = useState(false);
  const [offset, setOffset] = useState(0);

  const handleShuffle = async () => {
    setIsShuffling(true);
    const nextOffset = offset + 3;
    setOffset(nextOffset);
    try {
      const res = await fetch(`/api/earn/opportunities?offset=${nextOffset}`);
      const data = await res.json();
      if (data.ok && data.opportunities?.length > 0) {
        onShuffle(data.opportunities);
        onSelect(data.opportunities[0].id);
        toast.success('Loaded 3 fresh verified opportunities from Live Radar.');
      } else {
        setOffset(0);
        toast.info('Cycled back to top trending moves.');
      }
    } catch {
      toast.error('Failed to cycle opportunities.');
    } finally {
      setIsShuffling(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6 text-left"
    >
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-[#00F0FF] mb-3">
          <Flame className="w-3.5 h-3.5" /> 3 PRE-VETTED MONETIZABLE OPPORTUNITIES
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-3">
          Pick What To Sell
        </h1>
        <p className="text-sm md:text-base text-[#8E9BB4]">
          Choose one validated market move with verified commercial demand. AI handles deliverable generation and buyer hunting — you review and approve.
        </p>
      </div>

      {/* 3 Opportunity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {opportunities.map((opp) => {
          const isSelected = opp.id === selectedOppId;
          return (
            <div
              key={opp.id}
              onClick={() => onSelect(opp.id)}
              className={`cursor-pointer rounded-2xl p-6 transition-all duration-300 relative text-left flex flex-col justify-between border ${
                isSelected
                  ? 'bg-[#00F0FF]/[0.06] border-[#00F0FF] shadow-[0_0_30px_rgba(0,240,255,0.2)]'
                  : 'bg-white/[0.02] border-white/10 hover:border-white/20'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00F0FF] px-2.5 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/20">
                    {opp.category}
                  </span>
                  {isSelected && (
                    <span className="text-xs font-mono text-[#00FF66] flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-4 h-4" /> SELECTED
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-white text-lg mb-2">{opp.title}</h3>
                <p className="text-xs text-[#8E9BB4] mb-4 leading-relaxed line-clamp-2">
                  {opp.whyHotNow}
                </p>

                <div className="space-y-2 py-3 border-t border-white/[0.06] font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8E9BB4] flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-[#FFD700]" /> Buyer Price:
                    </span>
                    <span className="font-bold text-white">{opp.buyerPriceRange}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8E9BB4] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#00F0FF]" /> Turnkey Delivery:
                    </span>
                    <span className="font-bold text-white">{opp.timeToDeliver}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8E9BB4] flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#00FF66]" /> Verified Buyers:
                    </span>
                    <span className="font-bold text-[#00FF66]">
                      {opp.buyersFoundThisWeek} found this week
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-white/[0.06]">
                <div className="text-[10px] font-mono text-[#8E9BB4] uppercase mb-1.5">
                  Turnkey Deliverables:
                </div>
                <div className="flex flex-wrap gap-1">
                  {opp.deliverablePreview.map((d) => (
                    <span
                      key={d}
                      className="text-[9px] font-mono text-white/80 bg-white/[0.04] px-2 py-0.5 rounded"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
        <Button
          variant="outline"
          disabled={isShuffling}
          onClick={handleShuffle}
          className="border-white/10 text-xs font-mono uppercase h-11 px-5 hover:bg-white/[0.04]"
        >
          <RotateCcw className={`w-3.5 h-3.5 mr-2 ${isShuffling ? 'animate-spin' : ''}`} />
          Shuffle 3 Different Moves
        </Button>

        <Button
          size="lg"
          onClick={onContinue}
          className="cyan-gradient text-black font-extrabold uppercase px-8 h-12 font-mono shadow-[0_0_25px_rgba(0,240,255,0.4)]"
        >
          Continue to Step 2: AI Plan &rarr;
        </Button>
      </div>
    </motion.div>
  );
}