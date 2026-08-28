'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Loader2,
  Clock,
  AlertCircle,
  ArrowRight,
  Sparkles,
  FileText,
  DollarSign,
  Search,
  Wand2,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface MilestoneItem {
  id: string;
  order: number;
  name: string;
  description: string;
  type: string;
  status: 'PENDING' | 'RUNNING' | 'WAITING_USER_CHOICE' | 'WAITING_APPROVAL' | 'COMPLETED' | 'FAILED';
  resultSummary?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  artifacts?: any[];
}

interface Props {
  milestones: MilestoneItem[];
  currentMilestone: number;
  progress: number;
  planStatus: string;
  onExecute: () => void;
  onPause: () => void;
  onResume: () => void;
  onSelectOption: (option: 'BOT_SELLS' | 'YOU_SELL' | 'HYBRID') => void;
  loading: boolean;
}

const TYPE_ICONS: Record<string, typeof FileText> = {
  RESEARCH: Search,
  PRODUCTION: Wand2,
  VALIDATION: ShieldCheck,
  SALES_SETUP: Sparkles,
  SALES_EXECUTION: Send,
  PAYMENT: DollarSign,
  COMPLETED: CheckCircle2,
};

export function AutonomousMilestonesTimeline({
  milestones,
  currentMilestone,
  progress,
  planStatus,
  onExecute,
  onPause,
  onResume,
  onSelectOption,
  loading,
}: Props) {
  return (
    <div className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-ping" />
            <span className="text-[11px] font-mono font-bold tracking-widest text-[#00F0FF] uppercase">
              AUTONOMOUS MILESTONE ENGINE // END-TO-END
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight">
            Execution Plan & Deliverables
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          {planStatus === 'PAUSED' ? (
            <Button
              onClick={onResume}
              disabled={loading}
              className="bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] hover:bg-[#00F0FF]/25 font-mono text-xs rounded-full px-5 h-9 font-semibold"
            >
              Resume Swarm
            </Button>
          ) : planStatus === 'IN_PROGRESS' || planStatus === 'RUNNING' ? (
            <Button
              onClick={onPause}
              disabled={loading}
              variant="outline"
              className="border-white/20 text-white/80 hover:text-white font-mono text-xs rounded-full px-4 h-9"
            >
              Pause
            </Button>
          ) : (
            <Button
              onClick={onExecute}
              disabled={loading}
              className="liquid-glass-strong text-white hover:scale-105 active:scale-95 transition-transform font-mono text-xs rounded-full px-6 h-10 font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.2)]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00F0FF]" />
                  <span>Executing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#00F0FF]" />
                  <span>Run Autonomous Swarm</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-white/60">Execution Progress</span>
          <span className="text-[#00F0FF] font-bold">{progress}%</span>
        </div>
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-[#00F0FF] via-blue-500 to-[#00F0FF] rounded-full"
          />
        </div>
      </div>

      {/* Milestones Flow */}
      <div className="space-y-3.5">
        {milestones.map((m) => {
          const Icon = TYPE_ICONS[m.type] || Circle;
          const isDone = m.status === 'COMPLETED';
          const isRunning = m.status === 'RUNNING';
          const isWaitingChoice = m.status === 'WAITING_USER_CHOICE';

          return (
            <div
              key={m.id || m.order}
              className={`p-4 sm:p-5 rounded-2xl transition-all border ${
                isRunning
                  ? 'bg-blue-500/10 border-[#00F0FF]/40 shadow-[0_0_25px_rgba(0,240,255,0.15)]'
                  : isDone
                  ? 'bg-white/[0.02] border-white/10'
                  : isWaitingChoice
                  ? 'bg-amber-500/10 border-amber-400/40'
                  : 'bg-white/[0.01] border-white/[0.04] opacity-70'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isDone
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : isRunning
                        ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40 animate-pulse'
                        : isWaitingChoice
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-400/40'
                        : 'bg-white/5 text-white/40 border border-white/10'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isRunning ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-white/40 uppercase">
                        Milestone 0{m.order}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                          isDone
                            ? 'bg-green-500/10 text-green-400'
                            : isRunning
                            ? 'bg-[#00F0FF]/10 text-[#00F0FF]'
                            : isWaitingChoice
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-white/5 text-white/40'
                        }`}
                      >
                        {m.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-medium text-white">
                      {m.name}
                    </h3>
                    <p className="text-xs text-white/60 leading-relaxed max-w-xl">
                      {m.description}
                    </p>

                    {m.resultSummary && (
                      <div className="mt-2 text-xs text-[#00F0FF]/90 bg-[#00F0FF]/5 border border-[#00F0FF]/15 p-2.5 rounded-xl font-mono">
                        💡 {m.resultSummary}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Waiting for User Choice Decision Gate */}
              {isWaitingChoice && (
                <div className="mt-4 pt-4 border-t border-amber-500/20 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-bold">
                    <AlertCircle className="w-4 h-4" />
                    <span>DECISION POINT: SELECT SALES EXECUTION MODE</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => onSelectOption('BOT_SELLS')}
                      className="p-3 rounded-xl bg-white/5 hover:bg-[#00F0FF]/15 border border-white/10 hover:border-[#00F0FF]/40 text-left transition-all group"
                    >
                      <div className="text-xs font-bold text-white group-hover:text-[#00F0FF]">
                        Option A: Bot Sells For You
                      </div>
                      <div className="text-[11px] text-white/60 mt-1">
                        Companion handles outreach, pricing, and buyer negotiation autonomously.
                      </div>
                    </button>

                    <button
                      onClick={() => onSelectOption('YOU_SELL')}
                      className="p-3 rounded-xl bg-white/5 hover:bg-[#00F0FF]/15 border border-white/10 hover:border-[#00F0FF]/40 text-left transition-all group"
                    >
                      <div className="text-xs font-bold text-white group-hover:text-[#00F0FF]">
                        Option B: You Sell Yourself
                      </div>
                      <div className="text-[11px] text-white/60 mt-1">
                        Bot generates Sales Kit with personalized copy, pricing, & objection scripts.
                      </div>
                    </button>

                    <button
                      onClick={() => onSelectOption('HYBRID')}
                      className="p-3 rounded-xl bg-white/5 hover:bg-[#00F0FF]/15 border border-white/10 hover:border-[#00F0FF]/40 text-left transition-all group"
                    >
                      <div className="text-xs font-bold text-white group-hover:text-[#00F0FF]">
                        Option C: Hybrid Mode
                      </div>
                      <div className="text-[11px] text-white/60 mt-1">
                        Bot conducts outreach; hands over hot leads for you to close.
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
