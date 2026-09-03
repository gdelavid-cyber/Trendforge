'use client';

import React from 'react';
import { Bot, ShieldCheck, UserCheck } from 'lucide-react';

export type SalesMode = 'BOT_SELLS' | 'YOU_SELL' | 'HYBRID';

interface SalesModeSelectorProps {
  mode: SalesMode;
  onChange: (mode: SalesMode) => void;
}

export function SalesModeSelector({ mode, onChange }: SalesModeSelectorProps) {
  return (
    <div className="flex flex-col gap-2 font-mono">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => onChange('HYBRID')}
          className={`p-3 rounded-xl border text-left transition-all ${
            mode === 'HYBRID'
              ? 'bg-[#00F0FF]/10 border-[#00F0FF] text-white shadow-[0_0_15px_rgba(0,240,255,0.2)]'
              : 'bg-white/[0.02] border-white/10 text-[#8E9BB4] hover:border-white/20'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className={`w-4 h-4 ${mode === 'HYBRID' ? 'text-[#00F0FF]' : ''}`} />
            <span className="text-xs font-bold text-white">Hybrid Mode</span>
          </div>
          <p className="text-[10px] text-[#8E9BB4]">
            AI drafts every tailored pitch. You manually review & approve before sending.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onChange('BOT_SELLS')}
          className={`p-3 rounded-xl border text-left transition-all ${
            mode === 'BOT_SELLS'
              ? 'bg-[#00F0FF]/10 border-[#00F0FF] text-white shadow-[0_0_15px_rgba(0,240,255,0.2)]'
              : 'bg-white/[0.02] border-white/10 text-[#8E9BB4] hover:border-white/20'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Bot className={`w-4 h-4 ${mode === 'BOT_SELLS' ? 'text-[#00F0FF]' : ''}`} />
            <span className="text-xs font-bold text-white">Bot Sells</span>
          </div>
          <p className="text-[10px] text-[#8E9BB4]">
            Automated outreach sent only via compliant connected APIs within rate limits.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onChange('YOU_SELL')}
          className={`p-3 rounded-xl border text-left transition-all ${
            mode === 'YOU_SELL'
              ? 'bg-[#00F0FF]/10 border-[#00F0FF] text-white shadow-[0_0_15px_rgba(0,240,255,0.2)]'
              : 'bg-white/[0.02] border-white/10 text-[#8E9BB4] hover:border-white/20'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className={`w-4 h-4 ${mode === 'YOU_SELL' ? 'text-[#00F0FF]' : ''}`} />
            <span className="text-xs font-bold text-white">You Sell</span>
          </div>
          <p className="text-[10px] text-[#8E9BB4]">
            Copy pitch directly to your clipboard. Send manually from your personal channels.
          </p>
        </button>
      </div>
    </div>
  );
}