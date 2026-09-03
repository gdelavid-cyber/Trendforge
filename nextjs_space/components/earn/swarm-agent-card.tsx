'use client';

import React from 'react';
import { Bot, CheckCircle2, Loader2, AlertCircle, RotateCcw, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface AgentCardProps {
  name: string;
  role: string;
  status: 'queued' | 'running' | 'waiting_for_approval' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  inputSummary?: string;
  outputSummary?: string;
  errorMessage?: string;
  onRetry?: () => void;
  onPause?: () => void;
}

export function SwarmAgentCard({
  name,
  role,
  status,
  progress = 0,
  inputSummary,
  outputSummary,
  errorMessage,
  onRetry,
  onPause,
}: AgentCardProps) {
  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.08] p-4 text-left font-mono">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#00F0FF]/10 border border-[#00F0FF]/20 flex items-center justify-center text-[#00F0FF]">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-white">{name}</span>
        </div>

        {status === 'completed' && (
          <span className="text-[10px] text-[#00FF66] bg-[#00FF66]/10 px-2 py-0.5 rounded border border-[#00FF66]/20 flex items-center gap-1 font-bold">
            <CheckCircle2 className="w-3 h-3" /> DONE
          </span>
        )}
        {status === 'running' && (
          <span className="text-[10px] text-[#00F0FF] bg-[#00F0FF]/10 px-2 py-0.5 rounded border border-[#00F0FF]/20 flex items-center gap-1 font-bold">
            <Loader2 className="w-3 h-3 animate-spin" /> RUNNING ({progress}%)
          </span>
        )}
        {status === 'waiting_for_approval' && (
          <span className="text-[10px] text-[#FFD700] bg-[#FFD700]/10 px-2 py-0.5 rounded border border-[#FFD700]/20 font-bold">
            NEEDS APPROVAL
          </span>
        )}
        {status === 'queued' && (
          <span className="text-[10px] text-[#8E9BB4] bg-white/[0.04] px-2 py-0.5 rounded border border-white/10 font-bold">
            QUEUED
          </span>
        )}
        {status === 'failed' && (
          <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 flex items-center gap-1 font-bold">
            <AlertCircle className="w-3 h-3" /> FAILED
          </span>
        )}
      </div>

      <div className="text-[11px] text-[#8E9BB4] mb-3">{role}</div>

      {status === 'running' && (
        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mb-3">
          <div className="bg-[#00F0FF] h-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      )}

      {outputSummary && (
        <div className="text-[10px] text-white/90 bg-white/[0.02] p-2 rounded border border-white/[0.04] mb-2 truncate">
          <span className="text-[#00FF66] font-bold">Output: </span>{outputSummary}
        </div>
      )}

      {errorMessage && (
        <div className="text-[10px] text-red-300 bg-red-500/10 p-2 rounded border border-red-500/20 mb-2">
          {errorMessage}
        </div>
      )}

      {(onRetry || onPause) && (
        <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
          {onRetry && (
            <Button size="sm" variant="ghost" onClick={onRetry} className="h-7 text-[10px] px-2 text-[#8E9BB4] hover:text-white">
              <RotateCcw className="w-3 h-3 mr-1" /> Retry
            </Button>
          )}
          {onPause && (
            <Button size="sm" variant="ghost" onClick={onPause} className="h-7 text-[10px] px-2 text-[#8E9BB4] hover:text-white">
              <Pause className="w-3 h-3 mr-1" /> Pause
            </Button>
          )}
        </div>
      )}
    </div>
  );
}