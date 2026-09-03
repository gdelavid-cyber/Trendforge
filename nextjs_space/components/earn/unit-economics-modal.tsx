'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  DollarSign,
  HelpCircle,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UnitEconomicsModel } from '@/lib/earn/agents';

interface UnitEconomicsModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: UnitEconomicsModel;
}

export function UnitEconomicsModal({ isOpen, onClose, model }: UnitEconomicsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-mono text-left">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="max-w-2xl w-full rounded-3xl bg-[#06060E] border border-white/20 p-6 md:p-8 space-y-6 shadow-[0_20px_60px_rgba(0,0,0,0.9)] max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#00FF66]" />
            <div>
              <h3 className="text-base font-bold text-white uppercase">
                MOLECULAR UNIT ECONOMICS
              </h3>
              <p className="text-[10px] text-[#8E9BB4]">{model.playName}</p>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-8 w-8 p-0 text-[#8E9BB4]">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Highlight Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="text-[#8E9BB4] text-[10px] uppercase">Target Price</div>
            <div className="text-xl font-black text-white mt-1">${model.targetPrice}</div>
            <div className="text-[9px] text-[#8E9BB4]">per client deal</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="text-[#8E9BB4] text-[10px] uppercase">Leads Per Close</div>
            <div className="text-xl font-black text-[#00F0FF] mt-1">{model.leadsNeededPerClose}</div>
            <div className="text-[9px] text-[#8E9BB4]">at {(model.closeRateCold * 100).toFixed(0)}% close rate</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="text-[#8E9BB4] text-[10px] uppercase">Net Profit / Deal</div>
            <div className="text-xl font-black text-[#00FF66] mt-1">${model.netProfitPerDeal.toFixed(0)}</div>
            <div className="text-[9px] text-[#00FF66]">95%+ margin</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#00F0FF]/10 to-[#00FF66]/10 border border-[#00F0FF]/30">
            <div className="text-[#00F0FF] text-[10px] uppercase font-bold">Effective Rate</div>
            <div className="text-xl font-black text-white mt-1">${model.effectiveHourlyRate}/hr</div>
            <div className="text-[9px] text-[#00F0FF]">human time ROI</div>
          </div>
        </div>

        {/* Time allocation math */}
        <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3 text-xs">
          <div className="flex items-center justify-between text-[#8E9BB4] pb-2 border-b border-white/5 text-[11px]">
            <span>EFFICIENCY ANALYSIS: HUMAN VS. AI TIME</span>
            <span className="text-[#00FF66]">90% AI AUTOMATED</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] text-[#8E9BB4] uppercase block">Your Required Time (Human):</span>
              <span className="text-sm font-bold text-white">{model.humanTimeMinutes} minutes total</span>
              <p className="text-[10px] text-[#8E9BB4] mt-0.5">
                Review pitch, approve outreach, send payment link.
              </p>
            </div>
            <div>
              <span className="text-[10px] text-[#8E9BB4] uppercase block">AI Autonomous Time:</span>
              <span className="text-sm font-bold text-[#00F0FF]">{model.aiProcessingTimeMinutes} minutes</span>
              <p className="text-[10px] text-[#8E9BB4] mt-0.5">
                Scraping, rendering deliverables, and writing custom pitches.
              </p>
            </div>
          </div>
        </div>

        {/* 12-Month Projections */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-white uppercase block">
            SCALING TIMELINE (REALISTIC CHURN ADJUSTED)
          </span>
          <div className="grid grid-cols-3 gap-3 text-xs text-center">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="text-[10px] text-[#8E9BB4] uppercase">Month 1</div>
              <div className="text-base font-bold text-white mt-1">${model.month1Revenue.toLocaleString()}</div>
              <div className="text-[9px] text-[#8E9BB4]">First wins proven</div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="text-[10px] text-[#8E9BB4] uppercase">Month 3</div>
              <div className="text-base font-bold text-[#00F0FF] mt-1">${model.month3Revenue.toLocaleString()}</div>
              <div className="text-[9px] text-[#8E9BB4]">Compounding base</div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-[#00FF66]/20 bg-[#00FF66]/5">
              <div className="text-[10px] text-[#00FF66] uppercase font-bold">Month 12</div>
              <div className="text-base font-bold text-[#00FF66] mt-1">${model.month12Revenue.toLocaleString()}/mo</div>
              <div className="text-[9px] text-[#00FF66]">Active machine</div>
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <span className="text-[10px] text-[#8E9BB4] italic">
            *Based on historical Trendly conversion benchmarks. No guarantees.
          </span>
          <Button size="sm" onClick={onClose} className="text-xs h-8 px-5">
            Close Calculation
          </Button>
        </div>
      </motion.div>
    </div>
  );
}