'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  Briefcase,
  Users,
  DollarSign,
  Send,
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
  Bot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface LeadItem {
  id: string;
  source: string;
  sourceUrl: string;
  buyerName: string;
  requestText?: string;
  statedBudgetCents?: number | null;
  buyerIntentScore: number;
  budgetMatchScore: number;
  relevanceScore: number;
  contactabilityScore: number;
  compositeScore: number;
  status: string;
}

interface Props {
  taskId: string;
  leads: LeadItem[];
  currentOption?: string | null;
  onSelectOption: (option: 'BOT_SELLS' | 'YOU_SELL' | 'HYBRID') => void;
  onOpenLogSale: () => void;
  loading: boolean;
}

export function SalesPipelineCard({
  taskId,
  leads,
  currentOption,
  onSelectOption,
  onOpenLogSale,
  loading,
}: Props) {
  const topScore = leads.length > 0 ? Math.max(...leads.map((l) => l.compositeScore)) : 0;
  const totalPipelineValue = leads.reduce((acc, l) => acc + (l.statedBudgetCents || 15000), 0);

  return (
    <div className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span className="text-[11px] font-mono font-bold tracking-widest text-purple-300 uppercase">
              AUTONOMOUS SALES PIPELINE // BUYER ACQUISITION
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight">
            Scraped Buyer Leads & Execution Modes
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href={`/tasks/${taskId}/sales`}>
            <Button
              size="sm"
              className="liquid-glass-strong text-xs font-mono text-white rounded-full px-4 h-9 flex items-center gap-1.5 hover:scale-105 transition-transform"
            >
              <Briefcase className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span>Full Sales Board</span>
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>

          <Link href={`/tasks/${taskId}/sales-kit`}>
            <Button
              size="sm"
              variant="outline"
              className="border-white/20 text-xs font-mono text-white/80 rounded-full px-4 h-9 hover:text-white"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-[#FFD700]" />
              <span>Sales Kit</span>
            </Button>
          </Link>

          <Button
            size="sm"
            onClick={onOpenLogSale}
            className="bg-green-500/20 border border-green-500/40 text-green-400 text-xs font-mono rounded-full px-4 h-9 font-bold hover:bg-green-500/30"
          >
            <DollarSign className="w-3.5 h-3.5 mr-1" />
            <span>Log a Sale</span>
          </Button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
          <div className="text-[10px] font-mono text-white/40 uppercase">Total Leads</div>
          <div className="text-xl font-bold text-white mt-0.5">{leads.length}</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
          <div className="text-[10px] font-mono text-white/40 uppercase">Top Intent Score</div>
          <div className="text-xl font-bold text-[#00F0FF] mt-0.5">{topScore}/100</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
          <div className="text-[10px] font-mono text-white/40 uppercase">Est. Pipeline Value</div>
          <div className="text-xl font-bold text-[#FFD700] mt-0.5">
            ${(totalPipelineValue / 100).toFixed(0)}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
          <div className="text-[10px] font-mono text-white/40 uppercase">Active Mode</div>
          <div className="text-xs font-bold text-purple-300 mt-1 uppercase truncate">
            {currentOption?.replace('_', ' ') || 'Awaiting Selection'}
          </div>
        </div>
      </div>

      {/* 3 Execution Options Cards */}
      <div className="space-y-2">
        <div className="text-xs font-mono text-white/60 font-bold uppercase">
          Choose How This Task Sells:
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Option A */}
          <div
            onClick={() => onSelectOption('BOT_SELLS')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 group ${
              currentOption === 'BOT_SELLS'
                ? 'bg-[#00F0FF]/15 border-[#00F0FF] shadow-[0_0_25px_rgba(0,240,255,0.2)]'
                : 'bg-white/[0.02] border-white/10 hover:border-white/30 hover:bg-white/[0.04]'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-full bg-[#00F0FF]/20 flex items-center justify-center text-[#00F0FF]">
                  <Bot className="w-4 h-4" />
                </div>
                {currentOption === 'BOT_SELLS' && (
                  <span className="px-2 py-0.5 rounded-full bg-[#00F0FF]/20 text-[#00F0FF] text-[9px] font-mono font-bold">
                    ACTIVE
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-[#00F0FF]">
                Option A: Bot Sells For You
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Companion automates outreach, handles objections, negotiates within price rules, and collects escrow payout.
              </p>
            </div>

            <Button
              size="sm"
              disabled={loading}
              className="w-full text-xs font-mono rounded-full h-8 bg-white/10 hover:bg-[#00F0FF]/20 text-white"
            >
              Select Bot Autopilot
            </Button>
          </div>

          {/* Option B */}
          <div
            onClick={() => onSelectOption('YOU_SELL')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 group ${
              currentOption === 'YOU_SELL'
                ? 'bg-[#FFD700]/15 border-[#FFD700] shadow-[0_0_25px_rgba(255,215,0,0.2)]'
                : 'bg-white/[0.02] border-white/10 hover:border-white/30 hover:bg-white/[0.04]'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-full bg-[#FFD700]/20 flex items-center justify-center text-[#FFD700]">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                {currentOption === 'YOU_SELL' && (
                  <span className="px-2 py-0.5 rounded-full bg-[#FFD700]/20 text-[#FFD700] text-[9px] font-mono font-bold">
                    ACTIVE
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-[#FFD700]">
                Option B: You Sell Yourself
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Bot equips you with a ready-made Sales Kit: 5 personalized email templates, objection battlecards, and copy.
              </p>
            </div>

            <Button
              size="sm"
              disabled={loading}
              className="w-full text-xs font-mono rounded-full h-8 bg-white/10 hover:bg-[#FFD700]/20 text-white"
            >
              Select Sales Kit Mode
            </Button>
          </div>

          {/* Option C */}
          <div
            onClick={() => onSelectOption('HYBRID')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 group ${
              currentOption === 'HYBRID'
                ? 'bg-purple-500/15 border-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.2)]'
                : 'bg-white/[0.02] border-white/10 hover:border-white/30 hover:bg-white/[0.04]'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300">
                  <Users className="w-4 h-4" />
                </div>
                {currentOption === 'HYBRID' && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[9px] font-mono font-bold">
                    ACTIVE
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-purple-300">
                Option C: Hybrid Execution
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Bot initiates multi-channel outreach; notifies you the instant a hot prospect responds so you can close.
              </p>
            </div>

            <Button
              size="sm"
              disabled={loading}
              className="w-full text-xs font-mono rounded-full h-8 bg-white/10 hover:bg-purple-500/20 text-white"
            >
              Select Hybrid Mode
            </Button>
          </div>
        </div>
      </div>

      {/* Top 3 Leads Preview */}
      {leads.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-white/60 font-bold uppercase">Top Qualified Buyer Prospects</span>
            <Link href={`/tasks/${taskId}/sales`} className="text-[#00F0FF] hover:underline flex items-center gap-1">
              <span>View All ({leads.length})</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {leads.slice(0, 3).map((lead) => (
              <div
                key={lead.id}
                className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{lead.buyerName}</span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/70 uppercase">
                      {lead.source}
                    </span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#00F0FF]/15 text-[#00F0FF] font-bold">
                      Score: {lead.compositeScore}/100
                    </span>
                  </div>
                  <p className="text-xs text-white/60 line-clamp-1 max-w-xl">{lead.requestText}</p>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  {lead.statedBudgetCents && (
                    <div className="text-right">
                      <div className="text-[9px] font-mono text-white/40">BUDGET</div>
                      <div className="text-xs font-mono font-bold text-green-400">
                        ${(lead.statedBudgetCents / 100).toFixed(0)}
                      </div>
                    </div>
                  )}

                  <Link href={`/tasks/${taskId}/sales`}>
                    <Button size="sm" variant="outline" className="h-7 text-[10px] font-mono rounded-full border-white/15">
                      Engage
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
