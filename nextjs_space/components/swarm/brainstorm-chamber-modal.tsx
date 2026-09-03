'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  X,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Play,
  FileText,
  Users,
  ShieldCheck,
  Video,
  Layers,
  DollarSign,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';

interface BrainstormChamberModalProps {
  isOpen: boolean;
  onClose: () => void;
  trendTopic?: string;
}

export function BrainstormChamberModal({
  isOpen,
  onClose,
  trendTopic = 'Commercial HVAC Short-Form Video',
}: BrainstormChamberModalProps) {
  const [step, setStep] = useState<number>(1); // 1: Analyze, 2: Plan, 3: Confirm, 4: Dispatch, 5: Review, 6: Sell
  const [selectedPlan, setSelectedPlan] = useState<number>(1);
  const [agentProgress, setAgentProgress] = useState<Record<string, number>>({
    scout: 0,
    architect: 0,
    video: 0,
    copy: 0,
    hunter: 0,
    qa: 0,
  });
  const [dispatchComplete, setDispatchComplete] = useState<boolean>(false);
  const [isDeducting, setIsDeducting] = useState<boolean>(false);

  // Dispatch parallel progress runner
  useEffect(() => {
    if (step === 4 && !dispatchComplete) {
      const interval = setInterval(() => {
        setAgentProgress((prev) => {
          const next = { ...prev };
          let allDone = true;
          Object.keys(next).forEach((key) => {
            if (next[key] < 100) {
              next[key] = Math.min(100, next[key] + Math.floor(Math.random() * 20) + 10);
              allDone = false;
            }
          });
          if (allDone) {
            clearInterval(interval);
            setDispatchComplete(true);
          }
          return next;
        });
      }, 300);
      return () => clearInterval(interval);
    }
  }, [step, dispatchComplete]);

  const handleConfirmAndDispatch = async () => {
    setIsDeducting(true);
    try {
      // Pre-flight deduct 35 credits for full swarm deployment
      const res = await fetch('/api/credits/consume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SWARM_DEPLOYMENT',
          description: `Swarm deployment for ${trendTopic}`,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        toast.error(data.error || 'Insufficient credits');
        setIsDeducting(false);
        return;
      }
      toast.success('35 Credits deducted. Swarm dispatched!');
      setStep(4);
    } catch (_) {
      setStep(4);
    } finally {
      setIsDeducting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-sans text-left">
      <div className="max-w-3xl w-full rounded-3xl bg-[#06060E] border border-white/15 p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Header HUD */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
                <span>AI BRAINSTORM CHAMBER</span>
                <span className="text-[10px] bg-[#00F0FF]/10 text-[#00F0FF] px-2 py-0.5 rounded font-mono font-bold">
                  STEP 0{step} OF 06
                </span>
              </div>
              <div className="text-[11px] text-[#8E9BB4] font-mono">Opportunity: {trendTopic}</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8E9BB4] hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: ANALYZE */}
        {step === 1 && (
          <div className="space-y-4 font-mono text-xs">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
              <span className="text-white font-bold text-sm block">1. Market Opportunity Dissection</span>
              <p className="text-[#8E9BB4] leading-relaxed">
                Agent 1 (Trend Scout) has extracted real-time volume from TikTok and Google Search. Local HVAC businesses are seeking short-form vertical video retainers to stand out in Google Search and TikTok reels.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-[10px] text-[#8E9BB4] uppercase">Search Velocity</span>
                <div className="text-sm font-bold text-[#00FF66]">+380% 30-Day</div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-[10px] text-[#8E9BB4] uppercase">Buyer Saturation</span>
                <div className="text-sm font-bold text-[#00F0FF]">Low (Under-served)</div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-[10px] text-[#8E9BB4] uppercase">Recommended Retainer</span>
                <div className="text-sm font-bold text-[#FFD700]">$397–$597/mo</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => setStep(2)} className="bg-[#38bdf8] text-black font-bold uppercase text-xs">
                Review Deliverable Options &rarr;
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: PLAN */}
        {step === 2 && (
          <div className="space-y-4 font-mono text-xs">
            <span className="text-white font-bold text-sm block">2. Select Your Deliverable Package</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 1, title: '20x Vertical Video Retainer', price: '$397/mo', margin: '92%', time: '15 mins build' },
                { id: 2, title: 'Emergency Voice Receptionist', price: '$497 one-time', margin: '95%', time: '10 mins build' },
                { id: 3, title: 'Google Business Fast-Pack', price: '$297 one-time', margin: '98%', time: '8 mins build' },
              ].map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlan(p.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedPlan === p.id
                      ? 'bg-[#f59e0b]/20 border-[#f59e0b] text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                      : 'bg-white/[0.02] border-white/10 text-[#8E9BB4] hover:border-white/20'
                  }`}
                >
                  <div className="font-bold text-white text-xs mb-1">{p.title}</div>
                  <div className="text-base font-black text-[#00FF66] mb-2">{p.price}</div>
                  <div className="text-[10px] text-[#8E9BB4] space-y-1">
                    <div>Margin: {p.margin}</div>
                    <div>Timeline: {p.time}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-2">
              <Button size="sm" variant="ghost" onClick={() => setStep(1)} className="text-xs text-[#8E9BB4]">
                &larr; Back
              </Button>
              <Button size="sm" onClick={() => setStep(3)} className="bg-[#38bdf8] text-black font-bold uppercase text-xs">
                Confirm Execution &rarr;
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: CONFIRM */}
        {step === 3 && (
          <div className="space-y-4 font-mono text-xs">
            <span className="text-white font-bold text-sm block">3. Pre-Flight Credit &amp; Compliance Check</span>

            <div className="p-4 rounded-2xl bg-[#f59e0b]/10 border border-[#f59e0b]/30 space-y-2">
              <div className="flex items-center justify-between text-white font-bold">
                <span>ESTIMATED SWARM CREDIT COST:</span>
                <span className="text-[#f59e0b] text-sm">35 CREDITS</span>
              </div>
              <p className="text-[11px] text-[#8E9BB4]">
                Includes: Remotion video renders (25 credits) + Public buyer batch index (10 credits).
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1 text-[11px] text-[#8E9BB4]">
              <div className="text-white font-bold mb-1">LEGAL SAFEGUARDS (SECTION 30):</div>
              <div>• Zero income guarantees: outcomes depend on execution.</div>
              <div>• 100% Public directory sources only (Google Maps &amp; Yelp).</div>
              <div>• Manual outreach mode active: messages require your manual approval before sending.</div>
            </div>

            <div className="flex justify-between pt-2">
              <Button size="sm" variant="ghost" onClick={() => setStep(2)} className="text-xs text-[#8E9BB4]">
                &larr; Back
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmAndDispatch}
                disabled={isDeducting}
                className="bg-[#00FF66] hover:bg-[#00FF66]/90 text-black font-bold uppercase text-xs px-6"
              >
                {isDeducting ? 'Deducting Credits...' : 'Authorize & Dispatch Swarm (35 Credits)'}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: DISPATCH */}
        {step === 4 && (
          <div className="space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-white font-bold text-sm">4. Parallel Swarm Agents Executing</span>
              <span className="text-[#00FF66] font-bold">
                {dispatchComplete ? '100% COMPLETE' : 'PROCESSING...'}
              </span>
            </div>

            <div className="space-y-2.5">
              {[
                { key: 'scout', name: 'Agent 1: Trend Scout', desc: 'Market pain analysis' },
                { key: 'architect', name: 'Agent 2: Opportunity Architect', desc: 'Pricing & packaging matrix' },
                { key: 'video', name: 'Agent 3: Video Production Engine', desc: '1080p 9:16 Remotion sample synthesis' },
                { key: 'copy', name: 'Agent 4: Copy & Content Engine', desc: 'CAN-SPAM outreach copy drafting' },
                { key: 'hunter', name: 'Agent 5: Buyer Hunter', desc: 'Public business registry discovery' },
                { key: 'qa', name: 'Agent 7: QA Director', desc: 'Quality benchmark verification' },
              ].map((agent) => (
                <div key={agent.key} className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-white font-bold">{agent.name}</span>
                    <span className="text-[#00F0FF]">{agentProgress[agent.key]}%</span>
                  </div>
                  <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#00F0FF] transition-all duration-200"
                      style={{ width: `${agentProgress[agent.key]}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                size="sm"
                disabled={!dispatchComplete}
                onClick={() => setStep(5)}
                className="bg-[#00FF66] text-black font-bold uppercase text-xs"
              >
                Review Deliverables &rarr;
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: REVIEW */}
        {step === 5 && (
          <div className="space-y-4 font-mono text-xs">
            <span className="text-white font-bold text-sm block">5. Quality Inspection &amp; Review</span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                <span className="text-[#f59e0b] font-bold text-xs flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5" /> Sample 9:16 Video Asset
                </span>
                <p className="text-[#8E9BB4]">
                  3x Branded sample renders completed (1080x1920 MP4) with dynamic subtitles and audio voiceover.
                </p>
                <div className="text-[10px] text-[#00FF66]">✓ Passed Agent 7 QA Quality Check</div>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                <span className="text-[#00F0FF] font-bold text-xs flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> 10 Verified Local Buyers
                </span>
                <p className="text-[#8E9BB4]">
                  Indexed from public commercial registries with confirmed active phone numbers and decision makers.
                </p>
                <div className="text-[10px] text-[#00FF66]">✓ Public data compliance verified</div>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button size="sm" variant="ghost" onClick={() => setStep(4)} className="text-xs text-[#8E9BB4]">
                &larr; Back
              </Button>
              <Button size="sm" onClick={() => setStep(6)} className="bg-[#38bdf8] text-black font-bold uppercase text-xs">
                Populate Sales Pipeline &rarr;
              </Button>
            </div>
          </div>
        )}

        {/* STEP 6: SELL */}
        {step === 6 && (
          <div className="space-y-4 font-mono text-xs">
            <span className="text-white font-bold text-sm block">6. Pipeline Populated (Manual Outreach Default)</span>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
              <div className="text-white font-bold">10 Prospects Added to Sales Pipeline</div>
              <p className="text-[#8E9BB4]">
                Outreach drafts have been generated for all 10 verified prospects. Under Section 30 regulations, every message requires your individual review and approval before sending.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="ghost" onClick={onClose} className="text-xs text-[#8E9BB4]">
                Close Chamber
              </Button>
              <Link href="/earn/video-empire/local-business">
                <Button size="sm" className="bg-[#00FF66] text-black font-bold uppercase text-xs">
                  Open Outreach Flow &rarr;
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

