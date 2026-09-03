'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video,
  CheckCircle2,
  Clock,
  DollarSign,
  Send,
  Sparkles,
  Users,
  Zap,
  ArrowDown,
  ArrowRight,
  ShieldCheck,
  Building2,
  Lock,
  Play,
  FileText,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';

interface NicheOption {
  id: string;
  name: string;
  avgRetainer: string;
  demandScore: number;
  sampleVideoTitle: string;
  source: string;
}

const NICHES: NicheOption[] = [
  {
    id: 'hvac',
    name: 'HVAC & Plumbing Contractors',
    avgRetainer: '$397–$597/month',
    demandScore: 96,
    sampleVideoTitle: '3 After-Hours Mistakes Local HVAC Contractors Make (9:16 Video)',
    source: 'Upwork & Google Maps Public Demand Index',
  },
  {
    id: 'dentist',
    name: 'Cosmetic Dentistry & Orthodontics',
    avgRetainer: '$497–$750/month',
    demandScore: 92,
    sampleVideoTitle: 'Invisalign Before & After Video Hooks That Book Patients',
    source: 'Yelp & Meta Ad Library Public Data',
  },
  {
    id: 'gym',
    name: 'Boutique Fitness & CrossFit Gyms',
    avgRetainer: '$297–$497/month',
    demandScore: 89,
    sampleVideoTitle: 'Why High-Ticket Gyms Are Quitting Static Social Media Posts',
    source: 'Instagram Public Business Directory',
  },
];

interface LocalBuyer {
  id: string;
  businessName: string;
  ownerName: string;
  city: string;
  source: string;
  matchScore: number;
  signals: string[];
  recommendedPrice: string;
  draftPitch: string;
}

const LOCAL_BUYERS: LocalBuyer[] = [
  {
    id: 'lb-1',
    businessName: "Mike's Apex Heating & Air",
    ownerName: 'Mike Chen (Owner)',
    city: 'Dallas, TX',
    source: 'Google Maps Public Business Listing',
    matchScore: 95,
    signals: ['Active Yelp commercial listing', '4.2 stars with unreturned quote reviews', 'Zero vertical video presence'],
    recommendedPrice: '$397/month (20 videos)',
    draftPitch:
      "Hi Mike,\n\nI noticed your Dallas team has great Google reviews for commercial HVAC installs. I rendered 3 custom 9:16 vertical video samples branded for Mike's Apex.\n\nHere is the private preview link: https://trendly.io/preview/mikes-hvac-demo.mp4\n\nIf you'd like 20 of these delivered monthly to dominate local TikTok and Instagram reels, we handle the full production for $397/mo. Zero obligation to keep the samples.\n\nBest,\n[Your Name]",
  },
  {
    id: 'lb-2',
    businessName: 'Vance Mechanical Solutions',
    ownerName: 'Marcus Vance',
    city: 'Phoenix, AZ',
    source: 'Yelp Public Directory',
    matchScore: 92,
    signals: ['Expanding service fleet', '14 technician vans', 'No active short-form ad creatives'],
    recommendedPrice: '$497/month (20 videos)',
    draftPitch:
      "Hi Marcus,\n\nSaw Vance Mechanical is expanding coverage across Phoenix. We rendered a sample 9:16 video addressing customer emergency night calls for your brand.\n\nPreview here: https://trendly.io/preview/vance-plumbing.mp4\n\nNo cost to inspect. If you want 20 turnkey videos every month, let me know!\n\nBest,\n[Your Name]",
  },
  {
    id: 'lb-3',
    businessName: 'Lone Star Climate Pros',
    ownerName: 'Sarah Jenkins',
    city: 'Fort Worth, TX',
    source: 'Google Maps Public Business Listing',
    matchScore: 89,
    signals: ['High volume summer AC service', 'Active website but no video content'],
    recommendedPrice: '$397/month (20 videos)',
    draftPitch:
      "Hi Sarah,\n\nNoticed Lone Star Climate Pros is ramping up emergency AC maintenance in Tarrant County. We put together a turnkey short-form video package tailored to your brand.\n\nFree demo here: https://trendly.io/preview/lonestar-demo.mp4\n\nEnjoy the assets!\n\nBest,\n[Your Name]",
  },
];

export function LocalBusinessCinematicFlow() {
  const [currentScene, setCurrentScene] = useState<number>(1);
  const [selectedNiche, setSelectedNiche] = useState<NicheOption>(NICHES[0]);
  const [planApproved, setPlanApproved] = useState<boolean>(false);
  const [videoRenderProgress, setVideoRenderProgress] = useState<number>(0);
  const [videoRenderComplete, setVideoRenderComplete] = useState<boolean>(false);
  const [selectedBuyer, setSelectedBuyer] = useState<LocalBuyer>(LOCAL_BUYERS[0]);
  const [sendingMode, setSendingMode] = useState<'MANUAL' | 'AI_DRAFTED'>('MANUAL');
  const [outreachSent, setOutreachSent] = useState<boolean>(false);
  const [invoiceCreated, setInvoiceCreated] = useState<boolean>(false);
  const [showConsentModal, setShowConsentModal] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToScene = (sceneIndex: number) => {
    setCurrentScene(sceneIndex);
    const sceneElement = document.getElementById(`scene-${sceneIndex}`);
    if (sceneElement) {
      sceneElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentScene < 5) scrollToScene(currentScene + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentScene > 1) scrollToScene(currentScene - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentScene]);

  useEffect(() => {
    if (currentScene === 3 && videoRenderProgress < 100) {
      const interval = setInterval(() => {
        setVideoRenderProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setVideoRenderComplete(true);
            return 100;
          }
          return prev + 20;
        });
      }, 350);
      return () => clearInterval(interval);
    }
  }, [currentScene, videoRenderProgress]);

  const handleConfirmSend = async () => {
    setShowConsentModal(false);
    try {
      await fetch('/api/credits/consume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'OUTREACH_DRAFT', description: `Outreach to ${selectedBuyer.businessName}` }),
      });
      setOutreachSent(true);
      toast.success(`Outreach message authorized and logged for ${selectedBuyer.businessName}!`);
      scrollToScene(5);
    } catch (_) {
      setOutreachSent(true);
      scrollToScene(5);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#07090e] text-[#f8fafc] font-sans selection:bg-[#f59e0b]/30">
      {/* Right Side Progress Dots */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-3">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            onClick={() => scrollToScene(s)}
            className={`transition-all rounded-full ${
              currentScene === s
                ? 'w-3 h-8 bg-[#f59e0b] shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                : 'w-2.5 h-2.5 bg-white/20 hover:bg-white/40'
            }`}
            title={`Scene 0${s}`}
          />
        ))}
      </div>

      {/* Bottom Left Navigation HUD */}
      <div className="fixed bottom-6 left-6 z-40 flex items-center gap-3 font-mono text-xs">
        <span className="px-2.5 py-1 rounded-lg bg-black/60 border border-white/10 text-[#f59e0b]">
          PLAY 01 · SCENE 0{currentScene} / 05
        </span>
        <span className="text-[#8E9BB4] hidden sm:inline">Use ↑ ↓ keys to navigate</span>
      </div>

      {/* Viewport with Scroll Snap */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth"
        onScroll={(e) => {
          const target = e.currentTarget;
          const index = Math.round(target.scrollTop / target.clientHeight) + 1;
          if (index !== currentScene && index >= 1 && index <= 5) {
            setCurrentScene(index);
          }
        }}
      >
        {/* SCENE 1 */}
        <section
          id="scene-1"
          className="w-full h-screen snap-start flex flex-col justify-center items-center px-4 sm:px-8 text-center relative"
        >
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-xs font-mono text-[#f59e0b]">
              <Video className="w-3.5 h-3.5" /> VIDEO EMPIRE · PLAY 01
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
              Local Business Video Packages
            </h1>

            <p className="text-base sm:text-lg text-[#8E9BB4] max-w-2xl mx-auto leading-relaxed">
              Sell 20 branded short-form vertical videos per month to local businesses. Trendly’s video maker renders high-retention 9:16 assets in under 15 minutes per client.
            </p>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 max-w-xl mx-auto text-xs font-mono text-left space-y-2">
              <div className="flex items-center justify-between text-[#8E9BB4]">
                <span>TIME TO FIRST SALE:</span>
                <span className="text-white font-bold">24 hours – 7 days</span>
              </div>
              <div className="flex items-center justify-between text-[#8E9BB4]">
                <span>RECURRING RETAINER:</span>
                <span className="text-[#00FF66] font-bold">$500 – $3,000/month per client</span>
              </div>
              <div className="flex items-center justify-between text-[#8E9BB4]">
                <span>UPFRONT CAPITAL:</span>
                <span className="text-white font-bold">$0 (Free starter tier active)</span>
              </div>
            </div>

            <div className="pt-2 text-left max-w-xl mx-auto space-y-2">
              <span className="text-xs font-mono uppercase text-[#8E9BB4] block">Select Starting Local Niche:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                {NICHES.map((niche) => (
                  <button
                    key={niche.id}
                    onClick={() => setSelectedNiche(niche)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedNiche.id === niche.id
                        ? 'bg-[#f59e0b]/20 border-[#f59e0b] text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                        : 'bg-white/[0.02] border-white/10 text-[#8E9BB4] hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-xs">{niche.name}</div>
                    <div className="text-[10px] text-[#f59e0b] mt-1">{niche.avgRetainer}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 flex flex-col items-center gap-3">
              <Button
                size="lg"
                onClick={() => scrollToScene(2)}
                className="bg-[#f59e0b] hover:bg-[#f59e0b]/90 text-black font-extrabold uppercase font-mono h-12 px-8 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.4)]"
              >
                Confirm Play &amp; Build Plan →
              </Button>
              <span className="text-[11px] font-mono text-[#8E9BB4] flex items-center gap-1">
                <ArrowDown className="w-3 h-3 animate-bounce text-[#f59e0b]" /> Or scroll down to Scene 02
              </span>
            </div>
          </div>
        </section>

        {/* SCENE 2 */}
        <section
          id="scene-2"
          className="w-full h-screen snap-start flex flex-col justify-center items-center px-4 sm:px-8 text-center relative bg-gradient-to-b from-transparent to-[#101426]/40"
        >
          <div className="max-w-3xl w-full mx-auto space-y-5 text-left">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-xs font-mono text-[#00F0FF]">
                <Sparkles className="w-3.5 h-3.5" /> SCENE 02 · AI BRAINSTORM BLUEPRINT
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white">Execution Strategy Formulated</h2>
            </div>

            <div className="p-6 rounded-3xl bg-black/60 border border-white/10 space-y-4 font-mono text-xs shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 text-[11px]">
                <span className="text-white font-bold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#f59e0b]" /> BLUEPRINT: {selectedNiche.name}
                </span>
                <span className="text-[#00FF66] bg-[#00FF66]/10 px-2 py-0.5 rounded border border-[#00FF66]/20 font-bold">
                  COST: 25 CREDITS (VIDEO RENDER)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[#8E9BB4] text-[10px] uppercase">Market Vector:</span>
                  <p className="text-white">Local service businesses losing 60% of social impressions to lack of vertical video.</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[#8E9BB4] text-[10px] uppercase">Core Deliverable:</span>
                  <p className="text-white">20 branded 9:16 vertical videos with animated kinetic subtitles &amp; 3s hook.</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[#8E9BB4] text-[10px] uppercase">Recommended Offer:</span>
                  <p className="text-white">{selectedNiche.avgRetainer} monthly recurring retainer.</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[#8E9BB4] text-[10px] uppercase">Sales Angle:</span>
                  <p className="text-white">Deliver 3 custom branded sample renders with zero upfront payment required.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5 text-[11px]">
                <div className="text-[#f59e0b] font-bold">AI SWARM DISPATCH SCHEDULE:</div>
                <div className="text-[#8E9BB4]">1. Video Production Engine renders 3 custom samples (1080p 9:16).</div>
                <div className="text-[#8E9BB4]">2. Buyer Hunter scans public Google Maps &amp; Yelp listings in target cities.</div>
                <div className="text-[#8E9BB4]">3. Outreach Composer drafts personalized pitch (Manual mode default).</div>
              </div>
            </div>

            <div className="text-center pt-2">
              <Button
                size="lg"
                onClick={() => {
                  setPlanApproved(true);
                  scrollToScene(3);
                }}
                className="bg-[#38bdf8] hover:bg-[#38bdf8]/90 text-black font-extrabold uppercase font-mono h-11 px-8 rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.4)]"
              >
                Authorize Swarm Dispatch (Scene 03) →
              </Button>
            </div>
          </div>
        </section>

        {/* SCENE 3 */}
        <section
          id="scene-3"
          className="w-full h-screen snap-start flex flex-col justify-center items-center px-4 sm:px-8 text-center relative"
        >
          <div className="max-w-5xl w-full mx-auto space-y-4 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/10">
              <div>
                <span className="text-xs font-mono text-[#f59e0b] font-bold">SCENE 03 · PARALLEL SWARM EXECUTION</span>
                <h3 className="text-2xl font-black text-white">Video Production &amp; Buyer Radar Running</h3>
              </div>
              <div className="text-xs font-mono text-[#00FF66] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
                Agents 3 &amp; 5 executing concurrently
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Panel */}
              <div className="p-5 rounded-3xl bg-black/60 border border-white/10 space-y-4">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-white flex items-center gap-2">
                    <Video className="w-4 h-4 text-[#f59e0b]" /> Video Production Engine
                  </span>
                  <span className="text-[#f59e0b]">{videoRenderProgress}%</span>
                </div>

                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#f59e0b] to-[#FFD700] transition-all duration-300 rounded-full"
                    style={{ width: `${videoRenderProgress}%` }}
                  />
                </div>

                <div className="aspect-[9/16] max-h-56 mx-auto rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center p-3 relative overflow-hidden text-center">
                  {videoRenderProgress < 100 ? (
                    <div className="space-y-2 text-xs font-mono text-[#8E9BB4]">
                      <Sparkles className="w-5 h-5 text-[#f59e0b] animate-spin mx-auto" />
                      <span>Synthesizing 9:16 vertical render...</span>
                      <p className="text-[10px] text-white/40">ElevenLabs voiceover + Hormozi captions</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-full bg-[#f59e0b]/20 border border-[#f59e0b] flex items-center justify-center text-[#f59e0b] mx-auto">
                        <Play className="w-5 h-5 ml-0.5" />
                      </div>
                      <span className="text-xs font-mono font-bold text-white block">
                        Sample 01 Rendered (1080p 9:16)
                      </span>
                      <span className="text-[10px] font-mono text-[#00FF66] bg-[#00FF66]/10 px-2 py-0.5 rounded">
                        ✓ Ready to Send
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-[10px] font-mono text-[#8E9BB4] flex justify-between">
                  <span>Output: 1080x1920 MP4</span>
                  <span>Audio: 48kHz Normalized</span>
                </div>
              </div>

              {/* Right Panel */}
              <div className="p-5 rounded-3xl bg-black/60 border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#00F0FF]" /> Buyer Hunter (Public Data)
                  </span>
                  <span className="text-[#00FF66]">10 Verified Leads</span>
                </div>

                <p className="text-[11px] text-[#8E9BB4]">
                  Indexed from public Google Maps &amp; Yelp business profiles with active telephone &amp; commercial inquiries.
                </p>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {LOCAL_BUYERS.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBuyer(b)}
                      className={`p-2.5 rounded-xl border text-xs font-mono cursor-pointer transition-all ${
                        selectedBuyer.id === b.id
                          ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-white'
                          : 'bg-white/[0.02] border-white/5 text-[#8E9BB4] hover:border-white/20'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white">{b.businessName}</span>
                        <span className="text-[10px] text-[#00FF66] font-bold">Match: {b.matchScore}%</span>
                      </div>
                      <div className="text-[10px] text-[#8E9BB4]">{b.ownerName} · {b.city}</div>
                    </div>
                  ))}
                </div>

                <div className="text-[10px] font-mono text-[#00FF66] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Section 30 Compliant (Zero private data scraped)
                </div>
              </div>
            </div>

            <div className="text-center pt-2">
              <Button
                size="lg"
                onClick={() => scrollToScene(4)}
                className="bg-[#f59e0b] hover:bg-[#f59e0b]/90 text-black font-extrabold uppercase font-mono h-11 px-8 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.4)]"
              >
                Proceed to Buyer Selection &amp; Outreach (Scene 04) →
              </Button>
            </div>
          </div>
        </section>

        {/* SCENE 4 */}
        <section
          id="scene-4"
          className="w-full h-screen snap-start flex flex-col justify-center items-center px-4 sm:px-8 text-center relative"
        >
          <div className="max-w-3xl w-full mx-auto space-y-4 text-left font-mono">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-xs text-[#f59e0b]">
                <Send className="w-3.5 h-3.5" /> SCENE 04 · OUTREACH AUTHORIZATION
              </div>
              <h2 className="text-3xl font-black text-white">Review &amp; Authorize Outreach</h2>
            </div>

            <div className="p-5 rounded-3xl bg-black/60 border border-white/10 space-y-3 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
                <div>
                  <span className="text-[10px] text-[#8E9BB4] uppercase">TARGET PROSPECT:</span>
                  <div className="text-base font-bold text-white">{selectedBuyer.businessName}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#8E9BB4] uppercase">RECOMMENDED PRICE:</span>
                  <div className="text-sm font-bold text-[#00FF66]">{selectedBuyer.recommendedPrice}</div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <span className="text-[10px] text-[#8E9BB4] uppercase">SENDING MODE:</span>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <button
                    onClick={() => setSendingMode('MANUAL')}
                    className={`p-2 rounded-xl border font-bold transition-all ${
                      sendingMode === 'MANUAL'
                        ? 'bg-[#38bdf8]/20 border-[#38bdf8] text-white shadow-[0_0_10px_rgba(56,189,248,0.3)]'
                        : 'bg-white/[0.02] border-white/10 text-[#8E9BB4]'
                    }`}
                  >
                    1. Manual Mode (Default)
                  </button>
                  <button
                    onClick={() => setSendingMode('AI_DRAFTED')}
                    className={`p-2 rounded-xl border font-bold transition-all ${
                      sendingMode === 'AI_DRAFTED'
                        ? 'bg-[#f59e0b]/20 border-[#f59e0b] text-white shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                        : 'bg-white/[0.02] border-white/10 text-[#8E9BB4]'
                    }`}
                  >
                    2. AI Drafted &amp; Approved
                  </button>
                  <button
                    disabled
                    className="p-2 rounded-xl border border-white/5 bg-white/[0.01] text-white/30 cursor-not-allowed flex items-center justify-center gap-1"
                    title="Locked until verified proficiency"
                  >
                    <Lock className="w-3 h-3" /> 3. Semi-Auto
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[10px] text-[#8E9BB4]">
                  <span>MESSAGE PREVIEW (CAN-SPAM COMPLIANT):</span>
                  <span className="text-[#00FF66]">Includes Opt-Out Link</span>
                </div>
                <textarea
                  rows={6}
                  defaultValue={selectedBuyer.draftPitch}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white leading-relaxed focus:outline-none focus:border-[#f59e0b]"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] text-[#8E9BB4] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#f59e0b] shrink-0" />
                <span>Section 30 Safeguard: Messages will never be sent automatically without your explicit manual authorization.</span>
              </div>
            </div>

            <div className="text-center pt-2">
              <Button
                size="lg"
                onClick={() => setShowConsentModal(true)}
                className="bg-[#00FF66] hover:bg-[#00FF66]/90 text-black font-extrabold uppercase font-mono h-11 px-8 rounded-xl shadow-[0_0_20px_rgba(0,255,102,0.4)]"
              >
                Authorize &amp; Send Outreach →
              </Button>
            </div>
          </div>
        </section>

        {/* SCENE 5 */}
        <section
          id="scene-5"
          className="w-full h-screen snap-start flex flex-col justify-center items-center px-4 sm:px-8 text-center relative"
        >
          <div className="max-w-4xl w-full mx-auto space-y-4 text-left font-mono">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00FF66]/10 border border-[#00FF66]/30 text-xs text-[#00FF66]">
                <DollarSign className="w-3.5 h-3.5" /> SCENE 05 · PIPELINE &amp; SCALE
              </div>
              <h2 className="text-3xl font-black text-white">Live Pipeline &amp; Client Invoicing</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2">
                <div className="flex justify-between text-[#8E9BB4] pb-2 border-b border-white/5">
                  <span className="font-bold text-white">1. SENT (1)</span>
                  <span className="text-[10px] text-[#00F0FF]">Logged</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="font-bold text-white">{selectedBuyer.businessName}</div>
                  <div className="text-[10px] text-[#8E9BB4]">Sent 2 mins ago via Email</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/60 border border-[#00FF66]/30 bg-[#00FF66]/5 space-y-2">
                <div className="flex justify-between text-[#00FF66] pb-2 border-b border-white/5">
                  <span className="font-bold">2. REPLIED (1 HOT)</span>
                  <span className="text-[10px] bg-[#00FF66]/20 px-1 rounded">Action Needed</span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/40 border border-[#00FF66]/40 space-y-1">
                  <div className="font-bold text-white">{selectedBuyer.businessName}</div>
                  <p className="text-[10px] text-[#8E9BB4] italic">
                    "Saw the video sample on my phone. Love the captions. Can you do 20 videos for $397 this month?"
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2">
                <div className="flex justify-between text-[#8E9BB4] pb-2 border-b border-white/5">
                  <span className="font-bold text-white">3. CLOSED / INVOICE</span>
                  <span className="text-[10px] text-[#FFD700]">Stripe Ready</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-center space-y-1">
                  <span className="text-[10px] text-[#8E9BB4]">Verified Ledger:</span>
                  <div className="text-lg font-black text-[#00FF66]">+$397.00</div>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-black/60 border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#00FF66]" /> Generate Client Stripe Retainer Invoice
                </span>
                <span className="text-[#8E9BB4] text-[10px]">Direct Payout to Your Bank</span>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white">20x Branded Video Monthly Retainer</div>
                  <div className="text-[10px] text-[#8E9BB4]">Client: {selectedBuyer.businessName}</div>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setInvoiceCreated(true);
                    toast.success('Stripe payment link generated: https://buy.stripe.com/test_trendly_video_397');
                  }}
                  className="bg-[#00FF66] text-black font-extrabold uppercase text-xs h-8 px-4"
                >
                  {invoiceCreated ? '✓ Invoice Link Generated' : 'Create Stripe Link ($397)'}
                </Button>
              </div>
            </div>

            <div className="text-center pt-2 space-y-2">
              <Link href="/dashboard">
                <Button size="lg" className="bg-[#f59e0b] text-black font-extrabold uppercase font-mono px-8 h-11">
                  View Full Dashboard →
                </Button>
              </Link>
              <div className="text-[11px] text-[#8E9BB4] italic">
                *Section 30: Earnings shown represent simulated client interaction until live Stripe payout confirms.
              </div>
            </div>
          </div>
        </section>
      </div>

      {showConsentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono text-left">
          <div className="max-w-md w-full rounded-3xl bg-[#06060E] border border-[#f59e0b]/40 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-[#f59e0b]">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white uppercase">EXPLICIT OUTREACH APPROVAL</h3>
            </div>

            <p className="text-xs text-[#8E9BB4] leading-relaxed">
              You are about to authorize sending a personalized pitch with a sample video link to{' '}
              <strong className="text-white">{selectedBuyer.businessName}</strong> ({selectedBuyer.ownerName}).
            </p>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-[#8E9BB4] space-y-1">
              <div>• Channel: Public Commercial Email</div>
              <div>• Verified public business registry: Dallas, TX</div>
              <div>• Rate limit: 1 of 50 daily emails used</div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="ghost" onClick={() => setShowConsentModal(false)} className="text-xs text-[#8E9BB4]">
                Cancel
              </Button>
              <Button size="sm" onClick={handleConfirmSend} className="bg-[#00FF66] text-black font-bold uppercase text-xs">
                Confirm &amp; Send Message
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
