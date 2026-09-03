'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Play,
  CheckCircle,
  Sparkles,
  Zap,
  ArrowRight,
  Shield,
  Coins,
  X,
  Layers,
  Terminal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CompanionPortrait } from '@/components/avatar/CompanionPortrait';
import Link from 'next/link';

export function OnboardingTour({ user }: { user: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState('reddit_scraper');
  const [sandboxRunning, setSandboxRunning] = useState(false);
  const [sandboxOutput, setSandboxOutput] = useState<string[] | null>(null);

  useEffect(() => {
    fetch('/api/onboarding/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.shouldShowTour) {
          setIsOpen(true);
          if (data.progress?.step) setStep(Math.max(1, data.progress.step));
        }
      })
      .catch(() => {});
  }, []);

  const speakStepGuide = (stepIdx: number) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const guides: Record<number, string> = {
        1: 'Welcome Operative. You are entering the autonomous agentic economy with sovereign crypto wallets and Darwinian survival.',
        2: 'Step two: Select your worker monetization template to initialize your autonomous agent.',
        3: 'Step three: Customize your visual three D avatar and parameters in the studio.',
        4: 'Step four: Test your worker in the sandbox simulation before live liquidity deployment.',
        5: 'Step five: Claim your twenty-five dollar micro-grant and deploy into the live Web4 agent layer!',
      };
      const text = guides[stepIdx];
      if (text) {
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 1.05;
        window.speechSynthesis.speak(u);
      }
    }
  };

  const handleNextStep = async (nextStepIndex: number) => {
    setStep(nextStepIndex);
    speakStepGuide(nextStepIndex);
    await fetch('/api/onboarding/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: nextStepIndex, isCompleted: nextStepIndex > 5 }),
    });
  };

  const handleRunSandbox = async () => {
    setSandboxRunning(true);
    setSandboxOutput(null);
    setTimeout(() => {
      setSandboxOutput([
        'Connecting to live market orderbooks...',
        'Synthesizing recurring customer pain points...',
        'Mapped 3 candidate monetization vectors (paper simulation — nothing ran, no money moved).',
        'Conway sovereign wallet created at $0.00 — real USDC deposits activate it.',
        'Sandbox complete. Deploy from Sovereign Agents whenever you are ready.',
      ]);
      setSandboxRunning(false);
    }, 1200);
  };

  const handleFinishTour = async () => {
    await fetch('/api/onboarding/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: 5, isCompleted: true }),
    });
    setIsOpen(false);
    toast.success('Onboarding complete! Welcome to Trendly.');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-[#0A0A12] border border-[#00F0FF]/40 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-[0_0_50px_rgba(0,240,255,0.2)] relative"
        >
          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-[#8E9BB4] hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Progress Indicator */}
          <div className="flex items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step
                      ? 'w-8 bg-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.5)]'
                      : i < step
                      ? 'w-4 bg-green-400'
                      : 'w-4 bg-white/10'
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] font-mono text-[#00F0FF] font-bold">
              STEP {step} OF 5 // ONBOARDING
            </span>
          </div>

          {/* STEP 1: Welcome to Web4 Wealth OS */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-center text-2xl">
                ⚡
              </div>
              <h2 className="font-orbitron text-2xl font-black uppercase text-white">
                Welcome to <span className="cyan-gold-gradient-text">Trendly Web4</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#8E9BB4] font-sans leading-relaxed">
                You are entering the autonomous agentic economy. Here, AI Agents operate as sovereign economic citizens with their own crypto wallets, visual avatars, and Darwinian survival instincts.
              </p>
              <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1 text-xs font-mono text-green-400">
                <div>✓ Conway Sovereign Crypto Wallets (USDC)</div>
                <div>✓ EIP-8004 Verifiable On-Chain Identities</div>
                <div>✓ Autonomous Multi-Agent Swarm & Power Moves</div>
              </div>
              <Button
                onClick={() => handleNextStep(2)}
                className="w-full cyan-gradient text-black font-extrabold uppercase text-xs h-10 holographic-btn font-mono"
              >
                Deploy First Agent &rarr;
              </Button>
            </div>
          )}

          {/* STEP 2: Choose Template */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-orbitron text-xl font-bold uppercase text-white">
                Step 2: Choose Your <span className="text-[#00F0FF]">Worker Template</span>
              </h2>
              <p className="text-xs text-[#8E9BB4] font-sans">
                Select a high-velocity monetization blueprint to initialize your worker:
              </p>
              <div className="space-y-2">
                {[
                  { id: 'reddit_scraper', name: 'Reddit Problem Miner', yieldText: '$150-$1,500/client', avatar: 'cyber_humanoid', desc: 'Mines recurring SaaS complaints and drafts conversion guides.' },
                  { id: 'prediction_arbitrage', name: 'Polymarket Arbitrageur', yieldText: '+4.5%-18% ROI', avatar: 'quantum_android', desc: 'Scans live orderbooks for delta-neutral spread profits.' },
                  { id: 'micro_saas_builder', name: 'Next.js Micro-SaaS Architect', yieldText: '$2k-$10k MRR', avatar: 'wall_street_titan', desc: 'Synthesizes complete web applications with Stripe billing.' },
                ].map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                      selectedTemplate === t.id
                        ? 'border-[#00F0FF] bg-[#00F0FF]/10 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                        : 'border-white/10 bg-black/40 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 bg-black/60 shadow-[0_0_10px_rgba(0,240,255,0.1)]">
                        <CompanionPortrait archetype={t.avatar} className="w-full h-full" seed={t.id.length} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white font-mono">{t.name}</div>
                        <div className="text-[10px] text-[#8E9BB4] font-sans">{t.desc}</div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-green-400">{t.yieldText} (est.)</span>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => handleNextStep(3)}
                className="w-full cyan-gradient text-black font-extrabold uppercase text-xs h-10 holographic-btn font-mono"
              >
                Configure Skill Parameters &rarr;
              </Button>
            </div>
          )}

          {/* STEP 3: Customize Avatar & Parameters */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-orbitron text-xl font-bold uppercase text-white">
                Step 3: Visual Identity & <span className="text-[#FFD700]">Conway Wallet</span>
              </h2>
              <p className="text-xs text-[#8E9BB4] font-sans">
                Every agent gets a GTA-style visual avatar and a Conway wallet. New wallets start at $0.00 — fund yours with a real USDC deposit to activate it.
              </p>
              <div className="p-4 bg-black/60 rounded-xl border border-white/10 text-center space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-center text-4xl mx-auto">
                  🥷
                </div>
                <div className="text-xs font-bold text-white font-mono">Agent: Apex-01 (Cyber Humanoid)</div>
                <div className="text-[10px] font-mono text-[#8E9BB4]">Conway Address: Sol8f2a...91d (EIP-8004 Verified)</div>
              </div>
              <Button
                onClick={() => handleNextStep(4)}
                className="w-full cyan-gradient text-black font-extrabold uppercase text-xs h-10 holographic-btn font-mono"
              >
                Run Sandbox Test Execution &rarr;
              </Button>
            </div>
          )}

          {/* STEP 4: Sandbox Simulation */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-orbitron text-xl font-bold uppercase text-white">
                Step 4: Watch Live <span className="text-[#00F0FF]">Sandbox Simulation</span>
              </h2>
              <p className="text-xs text-[#8E9BB4] font-sans">
                Run a paper simulation (no funds involved) to see what the agent's discovery pipeline looks like:
              </p>
              {!sandboxOutput ? (
                <Button
                  onClick={handleRunSandbox}
                  disabled={sandboxRunning}
                  className="w-full py-6 bg-white/5 border border-white/10 hover:border-[#00F0FF] text-white font-mono text-xs flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-[#00F0FF] text-[#00F0FF]" />
                  {sandboxRunning ? 'Running Telemetry Cycle...' : 'Click to Trigger Sandbox Test Run'}
                </Button>
              ) : (
                <div className="p-3 bg-black/80 rounded-xl border border-green-500/30 text-[11px] font-mono text-[#CCD6F6] space-y-1">
                  {sandboxOutput.map((line, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              )}
              <Button
                onClick={() => handleNextStep(5)}
                disabled={!sandboxOutput}
                className="w-full cyan-gradient text-black font-extrabold uppercase text-xs h-10 holographic-btn font-mono"
              >
                Proceed to Command Center &rarr;
              </Button>
            </div>
          )}

          {/* STEP 5: Mission Active */}
          {step === 5 && (
            <div className="space-y-4 text-center">
              <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400 text-3xl mx-auto animate-bounce">
                ✓
              </div>
              <h2 className="font-orbitron text-2xl font-black uppercase text-white">
                You Are <span className="text-green-400">Mission Ready</span>
              </h2>
              <p className="text-xs text-[#8E9BB4] font-sans max-w-md mx-auto">
                Your sovereign companion is initialized. You can now explore live <strong>Weekly Tasks & Trends Radar</strong>, run autonomous multi-modal moves, and track verified proof receipts.
              </p>
              <Button
                onClick={handleFinishTour}
                className="w-full cyan-gradient text-black font-extrabold uppercase text-xs h-10 holographic-btn font-mono"
              >
                Enter Wealth Command Center &rarr;
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
