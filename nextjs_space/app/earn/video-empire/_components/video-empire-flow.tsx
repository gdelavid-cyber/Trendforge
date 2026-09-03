'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  DollarSign,
  Film,
  Layers,
  Lock,
  Play,
  Send,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Video,
  Zap,
  Calculator,
  Store,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';
import { AgentSwarmDrawer } from '@/components/earn/agent-swarm-drawer';
import { UnitEconomicsModal } from '@/components/earn/unit-economics-modal';
import { FULL_FINANCIAL_MODELS, getPlatformArbitrageMatrix } from '@/lib/earn/agents';

interface VideoPlay {
  id: string;
  number: number;
  title: string;
  tagline: string;
  target: string;
  price: string;
  timeToFirstDollar: string;
  recurringPotential: string;
  difficulty: string;
  bestFor: string;
  nicheFocus: string;
  sampleVideoTitle: string;
  deliverablesCount: number;
}

const FIVE_PLAYS: VideoPlay[] = [
  {
    id: 'local-business',
    number: 1,
    title: 'Local Business Video Packages',
    tagline: 'Fastest path to first dollar',
    target: 'Restaurants, real estate agents, gyms, dentists, home contractors',
    price: '$297 – $497/month',
    timeToFirstDollar: '24–72 hours',
    recurringPotential: '$2K–$5K/mo',
    difficulty: 'Easy',
    bestFor: 'Beginners who want instant local traction',
    nicheFocus: 'Emergency HVAC & Dental Smile Makeovers',
    sampleVideoTitle: '3 After-Hours Mistakes Local Contractors Make (9:16 Video)',
    deliverablesCount: 4,
  },
  {
    id: 'creator-clipping',
    number: 2,
    title: 'Creator Clipping Service',
    tagline: 'Easiest to sell',
    target: 'Podcasters, high-volume YouTubers, business coaches with long-form audio/video',
    price: '$797/month',
    timeToFirstDollar: '3–7 days',
    recurringPotential: '$3K–$8K/mo',
    difficulty: 'Easy',
    bestFor: 'Users with existing creator connections',
    nicheFocus: 'Tech & High-Performance Business Podcasts',
    sampleVideoTitle: 'The $10M Solopreneur Playbook (Hook & Kinetic Subtitles)',
    deliverablesCount: 8,
  },
  {
    id: 'ecommerce-ugc',
    number: 3,
    title: 'E-Commerce UGC Ads',
    tagline: 'Scales fastest',
    target: 'DTC e-commerce brands actively scaling Meta, TikTok, and Reels paid ads',
    price: '$997/month',
    timeToFirstDollar: '7–14 days',
    recurringPotential: '$5K–$20K/mo',
    difficulty: 'Medium',
    bestFor: 'Marketing-savvy users who understand direct response',
    nicheFocus: 'Health, Wellness & Ergonomic Work-from-home Hardware',
    sampleVideoTitle: 'Stop Drinking Microplastics: 3 Tests You Need to Run (UGC Ad)',
    deliverablesCount: 6,
  },
  {
    id: 'coach-content',
    number: 4,
    title: 'Coach Content Multiplication',
    tagline: 'Highest ticket per client',
    target: 'Business coaches, sales consultants, and high-ticket course creators',
    price: '$1,497/month',
    timeToFirstDollar: '5–14 days',
    recurringPotential: '$5K–$15K/mo',
    difficulty: 'Medium',
    bestFor: 'B2B sellers and relationship builders',
    nicheFocus: 'Executive Leadership & B2B Sales Frameworks',
    sampleVideoTitle: 'How Top 1% Closers Handle Price Objections (Kinetic Breakdown)',
    deliverablesCount: 12,
  },
  {
    id: 'personal-channel',
    number: 5,
    title: 'Your Own Faceless Channel',
    tagline: 'Long-term wealth asset',
    target: 'Personal YouTube Shorts & TikTok channel in high-RPM niches',
    price: 'AdSense + Affiliates',
    timeToFirstDollar: '60–180 days',
    recurringPotential: '$1K–$50K/mo',
    difficulty: 'Requires patience',
    bestFor: 'Content creators building sovereign media assets',
    nicheFocus: 'AI Wealth Tools & Macro Economic Anomalies',
    sampleVideoTitle: 'Why Wall Street Is Quietly Buying Private Farmland (9:16)',
    deliverablesCount: 30,
  },
];

export function VideoEmpireFlow({ userEarnings = 0 }: { userEarnings?: number }) {
  const [selectedPlay, setSelectedPlay] = useState<VideoPlay | null>(null);
  const [step, setStep] = useState<number>(1);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoRenderReady, setVideoRenderReady] = useState(false);
  const [sendingMode, setSendingMode] = useState<'MANUAL' | 'DRAFT_APPROVE' | 'FULL_AUTO'>('MANUAL');
  const [selectedBuyerIds, setSelectedBuyerIds] = useState<string[]>(['b-1', 'b-2', 'b-3']);
  const [showEconomicsModal, setShowEconomicsModal] = useState(false);
  const [syndicated, setSyndicated] = useState(false);

  // Video generation simulation in Step 3
  useEffect(() => {
    if (step === 3) {
      setVideoProgress(0);
      setVideoRenderReady(false);
      const interval = setInterval(() => {
        setVideoProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setVideoRenderReady(true);
            return 100;
          }
          return prev + 10;
        });
      }, 350);
      return () => clearInterval(interval);
    }
  }, [step]);

  // SCREEN 1: MONEY PLAYS SELECTION GRID
  if (!selectedPlay) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-left font-sans">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-xs font-mono text-[#f59e0b] mb-4">
            <Film className="w-3.5 h-3.5" /> 5 PROVEN MONEY PLAYS
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white mb-3">
            Pick Your Video Money Play
          </h1>
          <p className="text-sm md:text-base text-[#8E9BB4] mb-4">
            Trendly’s faceless video maker builds high-retention 9:16 assets automatically. Select the business model that matches your target audience.
          </p>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowEconomicsModal(true)}
            className="h-8 text-xs font-mono border-[#f59e0b]/30 text-[#f59e0b] hover:bg-[#f59e0b]/10"
          >
            <Calculator className="w-3.5 h-3.5 mr-1.5" /> Inspect Retainer Math ($4,705/hr Effective Rate)
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FIVE_PLAYS.map((play) => (
            <div
              key={play.id}
              className="rounded-3xl p-6 bg-white/[0.02] border border-white/10 hover:border-[#f59e0b]/50 hover:bg-[#f59e0b]/[0.02] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-[#f59e0b] bg-[#f59e0b]/10 px-2.5 py-1 rounded-full border border-[#f59e0b]/20">
                    PLAY 0{play.number}
                  </span>
                  <span className="text-[10px] font-mono text-[#8E9BB4] uppercase">
                    {play.difficulty}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-1">{play.title}</h3>
                <div className="text-xs text-[#f59e0b] font-mono font-semibold mb-3">
                  "{play.tagline}"
                </div>

                <p className="text-xs text-[#8E9BB4] mb-4 leading-relaxed">
                  <strong className="text-white/80">Target: </strong>
                  {play.target}
                </p>

                <div className="space-y-2 py-3 border-y border-white/[0.06] font-mono text-xs mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8E9BB4]">Retainer Target:</span>
                    <span className="font-bold text-white">{play.price}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8E9BB4]">Time to first $:</span>
                    <span className="font-bold text-white">{play.timeToFirstDollar}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8E9BB4]">Potential:</span>
                    <span className="font-bold text-[#f59e0b]">{play.recurringPotential}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-mono text-[#8E9BB4] mb-3">
                  Best for: {play.bestFor}
                </div>
                {play.id === 'local-business' ? (
                  <Link href="/earn/video-empire/local-business" className="block">
                    <Button
                      className="w-full bg-[#f59e0b] text-black font-extrabold font-mono uppercase h-11 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:bg-[#f59e0b]/90"
                    >
                      Launch Play 1 (Cinematic) &rarr;
                    </Button>
                  </Link>
                ) : (
                  <Button
                    onClick={() => {
                      setSelectedPlay(play);
                      setStep(1);
                    }}
                    className="w-full bg-white/10 hover:bg-white/20 text-white font-mono uppercase h-11 rounded-xl text-xs"
                  >
                    Start Play {play.number} &rarr;
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // CINEMATIC 5-STEP FLOW FOR CHOSEN PLAY
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-left font-sans">
      {/* Top HUD */}
      <div className="mb-8 p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between gap-4 font-mono">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (step === 1) setSelectedPlay(null);
              else setStep((prev) => Math.max(1, prev - 1));
            }}
            className="h-8 text-xs text-[#8E9BB4] hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse" />
            <span className="text-xs text-white font-bold uppercase">
              STEP {step} OF 5:
            </span>
            <span className="text-xs text-[#f59e0b]">{selectedPlay.title}</span>
          </div>
        </div>

        <button
          onClick={() => setSelectedPlay(null)}
          className="text-xs text-[#8E9BB4] hover:text-white"
        >
          Change Money Play &times;
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1: CONFIRM YOUR PLAY */}
        {step === 1 && (
          <motion.div
            key="v-step1"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 space-y-6">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-[#f59e0b] bg-[#f59e0b]/10 px-3 py-1 rounded-full border border-[#f59e0b]/20">
                  PLAY 0{selectedPlay.number} SPECIFICATION
                </span>
                <span className="text-xs font-mono text-[#8E9BB4]">Ready for AI Formulation</span>
              </div>

              <h2 className="text-3xl font-extrabold text-white">{selectedPlay.title}</h2>
              <p className="text-sm text-[#8E9BB4] leading-relaxed max-w-3xl">
                You are setting up a recurring video agency engine focused on{' '}
                <strong className="text-white">{selectedPlay.target}</strong>. Trendly’s faceless video maker will render sample 9:16 assets, while the sales scout locates verified buyers ready for content retainers.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                  <div className="text-[#8E9BB4] mb-1">Target Retainer:</div>
                  <div className="text-lg font-bold text-white">{selectedPlay.price}</div>
                </div>
                <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                  <div className="text-[#8E9BB4] mb-1">First Deal Window:</div>
                  <div className="text-lg font-bold text-white">{selectedPlay.timeToFirstDollar}</div>
                </div>
                <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                  <div className="text-[#8E9BB4] mb-1">Scale Ceiling:</div>
                  <div className="text-lg font-bold text-[#f59e0b]">{selectedPlay.recurringPotential}</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-xs font-mono text-[#f59e0b] flex items-center gap-3">
                <Sparkles className="w-5 h-5 shrink-0" />
                <span>Honest Expectation: This play requires zero on-camera appearances. AI generates the script, voiceover, kinetic captions, and video B-roll automatically.</span>
              </div>
            </div>

            <div className="text-center pt-4">
              <Button
                size="lg"
                onClick={() => setStep(2)}
                className="bg-[#f59e0b] text-black font-extrabold uppercase font-mono px-8 h-12 shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:bg-[#f59e0b]/90"
              >
                Confirm &amp; Generate Strategy Blueprint &rarr;
              </Button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: AI BRAINSTORM & PLAN */}
        {step === 2 && (
          <motion.div
            key="v-step2"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="p-8 rounded-3xl bg-black/60 border border-white/10 space-y-6 font-mono">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-[#f59e0b]" />
                  <span className="text-xs font-bold text-white uppercase">
                    AI VIDEO ENGINE BLUEPRINT
                  </span>
                </div>
                <span className="text-[10px] text-[#00FF66] bg-[#00FF66]/10 px-2.5 py-0.5 rounded border border-[#00FF66]/20">
                  OPTIMIZED FOR ALGORITHM HOOKS
                </span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-[10px] text-[#f59e0b] uppercase font-bold block mb-1">
                    1. HIGH-CONVERTING NICHE SELECTION
                  </span>
                  <p className="text-white font-sans text-sm">{selectedPlay.nicheFocus}</p>
                </div>

                <div className="pt-3 border-t border-white/[0.06]">
                  <span className="text-[10px] text-[#f59e0b] uppercase font-bold block mb-1">
                    2. SAMPLE VIDEO HOOK FORMULA
                  </span>
                  <p className="text-[#8E9BB4] font-sans">
                    3-second negative-contrast visual hook + ElevenLabs deep voiceover + kinetic high-retention subtitles.
                  </p>
                </div>

                <div className="pt-3 border-t border-white/[0.06]">
                  <span className="text-[10px] text-[#f59e0b] uppercase font-bold block mb-1">
                    3. TURNKEY CLIENT OFFER
                  </span>
                  <p className="text-[#8E9BB4] font-sans">
                    "{selectedPlay.deliverablesCount} high-retention vertical short-form videos delivered monthly. We handle script, rendering, and sound design. You just post."
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center pt-4">
              <Button
                size="lg"
                onClick={() => setStep(3)}
                className="bg-[#f59e0b] text-black font-extrabold uppercase font-mono px-8 h-12 shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:bg-[#f59e0b]/90"
              >
                Approve Strategy &amp; Launch Production &rarr;
              </Button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: VIDEO PRODUCTION + BUYER DISCOVERY (SPLIT SCREEN) */}
        {step === 3 && (
          <motion.div
            key="v-step3"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono">
              <div className="flex items-center justify-between mb-2 text-xs">
                <span className="text-[#8E9BB4]">VIDEO ENGINE &amp; BUYER SCOUT PROGRESS:</span>
                <span className="text-[#f59e0b] font-bold">{videoProgress}%</span>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#f59e0b] h-full transition-all duration-300"
                  style={{ width: `${videoProgress}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* LEFT: Faceless Video Maker Preview Canvas */}
              <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col justify-between font-mono">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2">
                      <Film className="w-4 h-4 text-[#f59e0b]" />
                      <span className="text-xs font-bold text-white uppercase">
                        FACELESS VIDEO MAKER
                      </span>
                    </div>
                    <span className="text-[10px] text-[#f59e0b] bg-[#f59e0b]/10 px-2 py-0.5 rounded">
                      CORE 1: REMOTION RENDERER
                    </span>
                  </div>

                  <div className="aspect-[9/12] max-h-72 w-full mx-auto rounded-2xl bg-black border border-white/10 flex flex-col items-center justify-center p-4 text-center relative overflow-hidden mb-4">
                    {videoRenderReady ? (
                      <div className="space-y-2">
                        <div className="w-12 h-12 rounded-full bg-[#f59e0b] text-black flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(245,158,11,0.6)]">
                          <Play className="w-6 h-6 fill-current ml-0.5" />
                        </div>
                        <div className="text-xs font-bold text-white font-sans">
                          {selectedPlay.sampleVideoTitle}
                        </div>
                        <div className="text-[10px] text-[#00FF66]">9:16 Remotion Render Complete</div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-8 h-8 border-2 border-[#f59e0b] border-t-transparent rounded-full animate-spin mx-auto" />
                        <div className="text-xs text-[#8E9BB4]">
                          Compiling ElevenLabs voiceover and B-roll...
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-[10px] text-[#8E9BB4]">
                  STATUS: {videoRenderReady ? 'Sample video ready for client outreach.' : 'Rendering short-form asset...'}
                </div>
              </div>

              {/* RIGHT: Qualified Video Retainer Buyers */}
              <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col justify-between font-mono">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#00FF66]" />
                      <span className="text-xs font-bold text-white uppercase">
                        QUALIFIED CLIENT SCOUT
                      </span>
                    </div>
                    <span className="text-[10px] text-[#00FF66] bg-[#00FF66]/10 px-2 py-0.5 rounded">
                      CORE 2: B2B LEADS
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                      <div className="flex items-center justify-between font-bold text-white mb-1">
                        <span>Cascade Dental &amp; Aesthetics</span>
                        <span className="text-[#00FF66] text-[10px]">96% MATCH</span>
                      </div>
                      <p className="text-[11px] text-[#8E9BB4]">Needs 4x monthly Instagram Reels &amp; TikTok smile transformations.</p>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                      <div className="flex items-center justify-between font-bold text-white mb-1">
                        <span>Apex High-Ticket Coaching</span>
                        <span className="text-[#00FF66] text-[10px]">94% MATCH</span>
                      </div>
                      <p className="text-[11px] text-[#8E9BB4]">Actively hunting for a clipping editor to repurpose podcast recordings.</p>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                      <div className="flex items-center justify-between font-bold text-white mb-1">
                        <span>Solas Wellness Brand (DTC)</span>
                        <span className="text-[#00FF66] text-[10px]">91% MATCH</span>
                      </div>
                      <p className="text-[11px] text-[#8E9BB4]">Running $8K/mo Meta ads, needs weekly creative variation.</p>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-[#00FF66] mt-4">
                  FOUND: 3 verified buyers with active creative budget.
                </div>
              </div>
            </div>

            <div className="text-center pt-4">
              <Button
                size="lg"
                disabled={!videoRenderReady}
                onClick={() => setStep(4)}
                className="bg-[#f59e0b] text-black font-extrabold uppercase font-mono px-8 h-12 shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:bg-[#f59e0b]/90 disabled:opacity-40"
              >
                Proceed to Step 4: Pick Buyers &amp; Send Samples &rarr;
              </Button>
            </div>
          </motion.div>
        )}

        {/* STEP 4: PICK BUYERS & SEND SAMPLES */}
        {step === 4 && (
          <motion.div
            key="v-step4"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6 font-mono"
          >
            <div className="text-center max-w-2xl mx-auto mb-6">
              <h2 className="text-2xl font-bold text-white mb-2 font-sans">
                Authorize Client Outreach
              </h2>
              <p className="text-xs text-[#8E9BB4]">
                Outreach includes your rendered sample video link. Review and approve before sending.
              </p>
            </div>

            {/* Mode selection */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                onClick={() => setSendingMode('MANUAL')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  sendingMode === 'MANUAL'
                    ? 'bg-[#f59e0b]/10 border-[#f59e0b]'
                    : 'bg-white/[0.02] border-white/10'
                }`}
              >
                <div className="font-bold text-xs text-white mb-1">Manual Mode (Default)</div>
                <div className="text-[10px] text-[#8E9BB4]">You inspect and copy the pitch.</div>
              </div>

              <div
                onClick={() => setSendingMode('DRAFT_APPROVE')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  sendingMode === 'DRAFT_APPROVE'
                    ? 'bg-[#f59e0b]/10 border-[#f59e0b]'
                    : 'bg-white/[0.02] border-white/10'
                }`}
              >
                <div className="font-bold text-xs text-white mb-1">Draft &amp; Approve</div>
                <div className="text-[10px] text-[#8E9BB4]">One-click authorization.</div>
              </div>

              <div className="p-3.5 rounded-xl border bg-white/[0.01] border-white/5 opacity-50 cursor-not-allowed">
                <div className="font-bold text-xs text-white/50 mb-1 flex items-center justify-between">
                  <span>Full-Auto Outreach</span>
                  <Lock className="w-3 h-3 text-[#f59e0b]" />
                </div>
                <div className="text-[10px] text-[#8E9BB4]">Unlocks after first closed client.</div>
              </div>
            </div>

            {/* Buyer rows */}
            <div className="space-y-3">
              {['Cascade Dental & Aesthetics', 'Apex High-Ticket Coaching', 'Solas Wellness Brand (DTC)'].map(
                (clientName, idx) => (
                  <div
                    key={clientName}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="font-bold text-sm text-white font-sans">{clientName}</div>
                      <div className="text-xs text-[#8E9BB4]">
                        Pitch: "Rendered a custom 9:16 sample video for your brand — [View Sample Video]"
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `Hi there, I rendered a tailored vertical short-form video for ${clientName}. You can watch the preview here: https://trendly.io/preview/sample-${idx + 1}`
                        );
                        toast.success(`Copied pitch for ${clientName}!`);
                      }}
                      className="text-xs h-8 border-white/10 text-[#f59e0b]"
                    >
                      Copy Pitch
                    </Button>
                  </div>
                )
              )}
            </div>

            <div className="text-center pt-4">
              <Button
                size="lg"
                onClick={() => setStep(5)}
                className="bg-[#f59e0b] text-black font-extrabold uppercase font-mono px-8 h-12 shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:bg-[#f59e0b]/90"
              >
                Confirm Outreach &amp; Open Pipeline &rarr;
              </Button>
            </div>
          </motion.div>
        )}

        {/* STEP 5: TRACK & SCALE */}
        {step === 5 && (
          <motion.div
            key="v-step5"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6 font-mono"
          >
            <div className="text-center max-w-2xl mx-auto mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00FF66]/10 border border-[#00FF66]/20 text-xs text-[#00FF66] mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> VIDEO RETAINER PIPELINE LIVE
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 font-sans">
                Track Retainers &amp; Scale
              </h2>
              <p className="text-xs text-[#8E9BB4]">
                Manage conversations, issue monthly invoices, and unlock multi-client scaling tools.
              </p>
            </div>

            {/* Pipeline columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                <div className="text-xs font-bold text-[#f59e0b] mb-2">Pitches Sent (3)</div>
                <p className="text-[11px] text-[#8E9BB4]">All 3 buyers received tailored video samples.</p>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                <div className="text-xs font-bold text-[#FFD700] mb-2">In Discussion (1)</div>
                <p className="text-[11px] text-[#8E9BB4]">Cascade Dental viewed the video preview link.</p>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                <div className="text-xs font-bold text-[#00FF66] mb-2">Monthly Invoicing</div>
                <p className="text-[11px] text-[#8E9BB4] mb-3">Target Retainer: {selectedPlay.price}</p>
                <Button
                  size="sm"
                  onClick={() => toast.success(`Generated recurring retainer invoice for ${selectedPlay.price}!`)}
                  className="w-full bg-[#00FF66] text-black font-bold text-xs h-8 hover:bg-[#00FF66]/90"
                >
                  Generate Stripe Retainer
                </Button>
              </div>
            </div>

            {/* Platform Arbitrage Scout (Whop, Gumroad, Stan, Etsy) */}
            <div className="p-6 rounded-2xl bg-black/40 border border-[#8b5cf6]/30 space-y-4 font-mono">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-[#8b5cf6]" />
                  <span className="text-xs font-bold text-white uppercase">
                    PLATFORM ARBITRAGE SCOUT (PASSIVE DIGITAL SALES)
                  </span>
                </div>
                <span className="text-[10px] text-[#00FF66] bg-[#00FF66]/10 px-2 py-0.5 rounded border border-[#00FF66]/20 font-bold">
                  MULTI-PLATFORM READY
                </span>
              </div>

              <p className="text-xs text-[#8E9BB4]">
                Don't just sell monthly retainers to clients. License this exact video clip bundle across high-volume digital marketplaces simultaneously.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">Whop Listing</div>
                    <div className="text-[10px] text-[#8E9BB4]">$49.00 (95% Payout)</div>
                  </div>
                  <span className="text-[10px] text-[#00FF66] font-bold">Score: 94/100</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">Gumroad Asset</div>
                    <div className="text-[10px] text-[#8E9BB4]">$39.00 (90% Payout)</div>
                  </div>
                  <span className="text-[10px] text-[#00FF66] font-bold">Score: 88/100</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">Stan Store Bundle</div>
                    <div className="text-[10px] text-[#8E9BB4]">$29.00 (95% Payout)</div>
                  </div>
                  <span className="text-[10px] text-[#00FF66] font-bold">Score: 92/100</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">Etsy Template Pack</div>
                    <div className="text-[10px] text-[#8E9BB4]">$19.00 (High Volume)</div>
                  </div>
                  <span className="text-[10px] text-[#00FF66] font-bold">Score: 82/100</span>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => {
                  setSyndicated(true);
                  toast.success('Syndicated video pack across Whop, Gumroad, Stan Store & Etsy!');
                }}
                className="w-full bg-[#8b5cf6] text-white font-bold uppercase text-xs h-9 hover:bg-[#8b5cf6]/90 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
              >
                {syndicated ? '✓ Syndicated to All 4 Platforms' : 'Syndicate to Whop, Gumroad, Stan & Etsy &rarr;'}
              </Button>
            </div>

            {/* Progressive Scaling Unlocks */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
              <div className="text-xs font-bold text-white uppercase">
                SCALING ROADMAP UNLOCKS
              </div>
              <div className="space-y-2 text-xs text-[#8E9BB4]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF66]" />
                  <span>Play 0{selectedPlay.number} workflow initiated.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#FFD700] border border-[#FFD700]/30 px-1.5 py-0.5 rounded">
                    UNLOCKS AT CLIENT 1
                  </span>
                  <span>"Add More Clients" automated multi-account dispatcher.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#8E9BB4] border border-white/10 px-1.5 py-0.5 rounded">
                    UNLOCKS AT 3 CLIENTS
                  </span>
                  <span>White-label video delivery portal and Remotion batch rendering.</span>
                </div>
              </div>
            </div>

            <div className="text-center pt-4">
              <Link href="/dashboard">
                <Button size="lg" className="bg-[#f59e0b] text-black font-extrabold uppercase font-mono px-8 h-12">
                  Return to Dashboard &rarr;
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating 9-Agent Swarm Drawer */}
      <AgentSwarmDrawer />

      {/* Molecular Economics Modal */}
      <UnitEconomicsModal
        isOpen={showEconomicsModal}
        onClose={() => setShowEconomicsModal(false)}
        model={FULL_FINANCIAL_MODELS['video-local-business']}
      />
    </div>
  );
}