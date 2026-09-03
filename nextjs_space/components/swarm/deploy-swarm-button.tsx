'use client';

import React, { useState } from 'react';
import { Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrainstormChamberModal } from './brainstorm-chamber-modal';

interface DeploySwarmButtonProps {
  trendTopic?: string;
  className?: string;
}

export function DeploySwarmButton({
  trendTopic = 'Local Business Short-Form Video',
  className = '',
}: DeploySwarmButtonProps) {
  const [chamberOpen, setChamberOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setChamberOpen(true)}
        className={`relative group overflow-hidden bg-gradient-to-r from-[#00F0FF] via-[#38bdf8] to-[#00FF66] text-black font-extrabold uppercase font-mono h-11 px-5 rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-[0_0_30px_rgba(0,240,255,0.7)] transition-all duration-300 ${className}`}
      >
        <span className="relative z-10 flex items-center gap-2">
          <Sparkles className="w-4 h-4 animate-spin group-hover:scale-110 transition-transform" />
          <span>Deploy AI Swarm</span>
          <span className="text-[10px] bg-black/80 text-[#00FF66] px-2 py-0.5 rounded-full border border-[#00FF66]/30 font-bold ml-1">
            ⚡ 35 Credits
          </span>
        </span>
      </Button>

      <BrainstormChamberModal
        isOpen={chamberOpen}
        onClose={() => setChamberOpen(false)}
        trendTopic={trendTopic}
      />
    </>
  );
}
