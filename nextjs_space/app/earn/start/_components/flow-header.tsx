'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface FlowHeaderProps {
  currentStep: number;
  onBack: () => void;
}

const STEP_TITLES: Record<number, string> = {
  1: 'Pick What To Sell',
  2: 'AI Brainstorm & Plan',
  3: 'Swarm Executes (Split-Screen)',
  4: 'Pick Buyers & Authorize Outreach',
  5: 'Track Pipeline & Collect Revenue',
};

export function FlowHeader({ currentStep, onBack }: FlowHeaderProps) {
  return (
    <div className="mb-8 p-4 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {currentStep > 1 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onBack}
            className="h-8 text-xs font-mono text-[#8E9BB4] hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
          </Button>
        )}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
            STEP {currentStep} OF 5:
          </span>
          <span className="font-mono text-xs text-[#00F0FF]">{STEP_TITLES[currentStep]}</span>
        </div>
      </div>

      {/* Stepper Dots */}
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <div
            key={s}
            className={`h-2 rounded-full transition-all duration-300 ${
              s === currentStep
                ? 'w-8 bg-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.6)]'
                : s < currentStep
                ? 'w-3 bg-[#00FF66]'
                : 'w-3 bg-white/10'
            }`}
          />
        ))}
      </div>

      <Link href="/earn" className="text-xs font-mono text-[#8E9BB4] hover:text-white">
        Exit to Earn Hub &rarr;
      </Link>
    </div>
  );
}