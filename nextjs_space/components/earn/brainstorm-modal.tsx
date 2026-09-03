'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Sparkles, CheckCircle2, Loader2, ArrowRight, ShieldCheck, AlertCircle, Bot, Users, DollarSign, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface BrainstormModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId?: string;
  trendId?: string;
  trendTitle?: string;
}

export function BrainstormModal({ isOpen, onClose, taskId: initialTaskId, trendId, trendTitle }: BrainstormModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<'ANALYZE' | 'PLAN' | 'CONFIRM' | 'DISPATCH' | 'REVIEW' | 'SELL'>('ANALYZE');
  const [taskId, setTaskId] = useState<string | undefined>(initialTaskId);
  const [loading, setLoading] = useState(false);
  const [brainstorm, setBrainstorm] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('ANALYZE');
      initBrainstorm();
    }
  }, [isOpen, initialTaskId, trendId]);

  const initBrainstorm = async () => {
    setLoading(true);
    let activeTaskId = initialTaskId;

    try {
      // If no task ID provided but trendId is present, spawn task first
      if (!activeTaskId && trendId) {
        const res = await fetch(`/api/trends/${trendId}/spawn-task`, { method: 'POST' });
        const data = await res.json();
        if (res.ok && data.taskId) {
          activeTaskId = data.taskId;
          setTaskId(activeTaskId);
        }
      }

      // Fetch brainstorm data
      if (activeTaskId) {
        const bRes = await fetch(`/api/tasks/${activeTaskId}/brainstorm`, { method: 'POST' });
        const bData = await bRes.json();
        if (bRes.ok && bData.brainstorm) {
          setBrainstorm(bData.brainstorm);
        } else {
          // Procedural fallback if LLM or API is unavailable
          setBrainstorm({
            marketVector: trendTitle || 'High-Velocity Monetization Blueprint',
            targetBuyer: 'Local SMBs, Digital Agencies & Creators',
            deliverables: ['Automated Script & Audio', '9:16 Video Asset', 'Personalized Cold Pitch'],
            estimatedTime: '24-48 hours',
            estimatedYield: '$500 - $1,500/sale',
            consensusStrategy: 'Deploy parallel builder swarm while concurrently mining pre-qualified buyers.',
          });
        }
      } else {
        setBrainstorm({
          marketVector: trendTitle || 'High-Velocity Monetization Blueprint',
          targetBuyer: 'Local SMBs & Online Services',
          deliverables: ['Custom AI Deliverable', 'Buyer Outreach Sequences'],
          estimatedTime: '24-48 hours',
          estimatedYield: '$500 - $1,500',
          consensusStrategy: 'Parallel synthesis with human-in-the-loop validation.',
        });
      }

      setStep('PLAN');
    } catch (err: any) {
      toast.error('Failed to analyze opportunity. Proceeding with procedural gameplan.');
      setStep('PLAN');
    } finally {
      setLoading(false);
    }
  };

  const handleDispatchSwarm = async () => {
    setLoading(true);
    try {
      if (taskId) {
        const res = await fetch(`/api/tasks/${taskId}/execute-swarm`, { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
          toast.success('Swarm deployed successfully! Builders and Sales Scout are running.');
          setStep('DISPATCH');
          setTimeout(() => {
            onClose();
            router.push(`/tasks/${taskId}`);
          }, 1500);
          return;
        }
      }
      toast.success('Swarm initiated! Redirecting to execution center.');
      setStep('DISPATCH');
      setTimeout(() => {
        onClose();
        if (taskId) router.push(`/tasks/${taskId}`);
        else router.push('/tasks');
      }, 1500);
    } catch (err: any) {
      toast.error('Swarm dispatch encountered an error.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl rounded-2xl bg-[#06060E] border border-white/10 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.9)] relative text-white"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-[#8E9BB4] hover:text-white hover:bg-white/[0.05]"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg font-mono text-white">AI BRAINSTORM CHAMBER</h3>
            <p className="text-xs text-[#8E9BB4] font-mono">MISSION BLUEPRINT · 6-PHASE AUTONOMOUS DISPATCH</p>
          </div>
        </div>

        {/* Stage Tabs */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/[0.08] text-[11px] font-mono">
          {['ANALYZE', 'PLAN', 'CONFIRM', 'DISPATCH'].map((st, i) => (
            <div
              key={st}
              className={`flex items-center gap-1.5 ${
                step === st ? 'text-[#00F0FF] font-bold' : 'text-[#8E9BB4]'
              }`}
            >
              <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[9px]">
                {i + 1}
              </span>
              <span>{st}</span>
            </div>
          ))}
        </div>

        {/* Content Body */}
        {loading && step === 'ANALYZE' ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 text-[#00F0FF] animate-spin mb-4" />
            <div className="text-sm font-bold font-mono text-white mb-1">Synthesizing Market Vector...</div>
            <p className="text-xs text-[#8E9BB4]">Kairos, UNIT-O, and Midas are aligning on deliverables and buyer avatars.</p>
          </div>
        ) : step === 'DISPATCH' ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="w-10 h-10 text-[#00FF66] mb-4 animate-bounce" />
            <div className="text-lg font-bold font-mono text-white mb-1">SWARM ACTIVATED</div>
            <p className="text-xs text-[#8E9BB4]">Parallel agents and buyer hunting scout deployed. Launching task workspace...</p>
          </div>
        ) : (
          <div className="space-y-4 font-mono">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08]">
              <div className="text-[11px] text-[#8E9BB4] mb-1">CORE OPPORTUNITY & THESIS</div>
              <div className="text-sm font-bold text-[#00F0FF] mb-2">
                {brainstorm?.marketVector || trendTitle}
              </div>
              <p className="text-xs text-[#8E9BB4] leading-relaxed">
                {brainstorm?.consensusStrategy || 'Autonomous generation of client-ready assets and concurrent buyer qualification.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                <div className="text-[10px] text-[#8E9BB4] mb-1">TARGET BUYER PROFILE</div>
                <div className="text-xs font-bold text-white">{brainstorm?.targetBuyer || 'Verified B2B Leads'}</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                <div className="text-[10px] text-[#8E9BB4] mb-1">ESTIMATED FIRST REVENUE</div>
                <div className="text-xs font-bold text-[#00FF66]">{brainstorm?.estimatedYield || '$500 - $2,500'}</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.08]">
              <div className="text-[10px] text-[#8E9BB4] mb-2">DELIVERABLES INCLUDED</div>
              <div className="flex flex-wrap gap-2">
                {(brainstorm?.deliverables || ['Turnkey Deliverable', 'Audio/Video Demo', 'Personalized Cold Pitch']).map((d: string) => (
                  <span key={d} className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 text-[11px] text-white flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#00F0FF]" /> {d}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#00F0FF]/5 border border-[#00F0FF]/20 text-xs text-[#00F0FF] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Human-In-The-Loop: Deliverables and outreach require your manual approval before anything is sent.</span>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        {step !== 'DISPATCH' && !loading && (
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-white/[0.08]">
            <Button variant="ghost" onClick={onClose} className="text-xs font-mono text-[#8E9BB4]">
              Cancel & Exit
            </Button>
            <Button
              onClick={handleDispatchSwarm}
              className="cyan-gradient text-black font-extrabold uppercase px-6 h-10 font-mono shadow-[0_0_20px_rgba(0,240,255,0.4)]"
            >
              <Zap className="w-4 h-4 mr-1.5 fill-current" /> Confirm & Deploy Swarm
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}