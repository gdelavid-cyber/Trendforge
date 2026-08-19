'use client';

import Link from 'next/link';
import { ArrowRight, Zap, Clock, Shield, Bookmark, DollarSign } from 'lucide-react';
import { useState } from 'react';
import { DIFFICULTY_CONFIG, RISK_CONFIG } from '@/lib/constants';
import { toast } from 'sonner';

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description: string;
    difficulty: keyof typeof DIFFICULTY_CONFIG;
    riskLevel: keyof typeof RISK_CONFIG;
    startupCost: number;
    estimatedEarningsLow: number;
    estimatedEarningsHigh: number;
    timeToFirstDollar: string | null;
    category: string;
  };
}

export function TaskCard({ task }: TaskCardProps) {
  const [skipped, setSkipped] = useState(false);
  const [saved, setSaved] = useState(false);

  const risk = RISK_CONFIG[task?.riskLevel ?? 'LOW'] ?? RISK_CONFIG.LOW;

  const getDifficultyStars = (difficulty: string) => {
    switch (difficulty) {
      case 'ZERO': return '⭐';
      case 'LOW': return '⭐⭐';
      case 'MEDIUM': return '⭐⭐⭐';
      case 'HIGH': return '⭐⭐⭐⭐';
      default: return '⭐⭐';
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSaved(!saved);
    toast.success(saved ? 'Power Move removed from bookmarks!' : 'Power Move saved to bookmarks!');
  };

  const handleSkip = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSkipped(true);
    toast.info('Power Move skipped.');
  };

  if (skipped) return null;

  return (
    <Link href={`/tasks/${task?.id}`}>
      <div className="group relative glass-card p-6 flex flex-col justify-between h-full">
        <div>
          {/* Difficulty Stars & Actions */}
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] text-[#FFD700] font-bold font-mono bg-[#FFD700]/10 border border-[#FFD700]/20 px-2.5 py-0.5 rounded-full tracking-wide">
              {getDifficultyStars(task?.difficulty)}
            </span>
            
            <div className="flex items-center gap-1.5">
              <button 
                onClick={handleSave} 
                className={`p-1.5 rounded-full border border-white/[0.06] hover:border-[#FFD700]/30 hover:bg-[#FFD700]/10 transition-colors ${saved ? 'text-[#FFD700]' : 'text-[#8892B0]'}`}
                title="Bookmark Move"
              >
                <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-[#FFD700]' : ''}`} />
              </button>
              <button 
                onClick={handleSkip} 
                className="px-2 py-0.5 rounded-full border border-white/[0.06] hover:border-[#FF6B9D]/30 hover:bg-[#FF6B9D]/10 text-[#8892B0] hover:text-[#FF6B9D] transition-colors text-[9px] font-mono uppercase"
                title="Skip Move"
              >
                Skip
              </button>
            </div>
          </div>

          <h3 className="text-base text-white group-hover:text-[#00F0FF] transition-colors line-clamp-1 mb-2">
            {task?.title ?? 'Untitled Power Move'}
          </h3>
          
          <p className="text-xs text-[#8892B0] line-clamp-2 mb-4 font-sans">
            {task?.description ?? ''}
          </p>

          <div className="flex flex-wrap gap-2 mb-4 text-[10px]">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full font-mono font-bold bg-white/[0.03] border border-white/[0.06] text-[#8892B0]">
              {task?.category}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-mono font-bold ${risk?.bg} ${risk?.text}`}>
              <Shield className="w-3 h-3 mr-1" />{risk?.label}
            </span>
          </div>
        </div>

        <div>
          <div className="grid grid-cols-3 gap-2 text-xs font-mono text-[#8892B0] border-t border-white/[0.06] pt-3 mb-2">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              {task?.timeToFirstDollar ?? '1d'}
            </div>
            <div className="flex items-center gap-1 text-green-400 font-bold">
              <DollarSign className="w-3.5 h-3.5 fill-current text-green-400" />
              +${task?.estimatedEarningsLow}-${task?.estimatedEarningsHigh}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[#FFD700] font-bold">$</span>
              {task?.startupCost ?? 0} setup
            </div>
          </div>

          <div className="flex items-center justify-end mt-2 pt-2 border-t border-white/[0.06]">
            <span className="text-[#00F0FF] text-xs font-bold font-display uppercase tracking-wider flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Start Move <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
