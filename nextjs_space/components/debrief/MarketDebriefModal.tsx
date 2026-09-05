'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  TrendingUp,
  Zap,
  ArrowRight,
  Sparkles,
  Radio,
  Download,
  Copy,
  Check,
  ShieldAlert,
  Bot,
  Layers,
  ChevronRight,
  Coins,
  Cpu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';
import { Stage3DCanvas } from '@/components/avatar/stage3d/Stage3DCanvas';
import { VOICE_PRESETS, getVoicePresetById, VoicePreset } from '@/lib/intelligence/voice/voice-presets';

export interface MarketDebriefModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MarketDebriefModal({ isOpen, onClose }: MarketDebriefModalProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState('nova');
  const [activeTab, setActiveTab] = useState<'briefing' | 'telemetry'>('briefing');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Fetch debrief data
  useEffect(() => {
    if (!isOpen) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    fetch('/api/debrief')
      .then((res) => res.json())
      .then((json) => {
        if (isMounted && json.success) {
          setData(json);
        }
      })
      .catch((err) => {
        console.error('Failed to load debrief:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen]);

  const handleTogglePlay = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error('Web Speech Audio not supported in this browser.');
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    if (!data?.spokenScript) return;

    window.speechSynthesis.cancel();
    const preset = getVoicePresetById(selectedVoiceId);
    const utterance = new SpeechSynthesisUtterance(data.spokenScript);
    utterance.rate = preset?.rate ?? 1.0;
    utterance.pitch = preset?.pitch ?? 1.0;

    const availableVoices = window.speechSynthesis.getVoices();
    if (availableVoices && availableVoices.length > 0 && preset) {
      let matchedVoice = null;
      for (const pref of preset.preferredSystemVoices) {
        const found = availableVoices.find((v) =>
          v.name.toLowerCase().includes(pref.toLowerCase())
        );
        if (found) {
          matchedVoice = found;
          break;
        }
      }
      if (!matchedVoice) {
        matchedVoice = availableVoices.find((v) => v.lang.startsWith('en')) || availableVoices[0];
      }
      if (matchedVoice) utterance.voice = matchedVoice;
    }

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const handleRestartSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setTimeout(handleTogglePlay, 100);
    }
  };

  const handleCopyTranscript = () => {
    if (!data?.spokenScript) return;
    navigator.clipboard.writeText(data.spokenScript);
    setCopied(true);
    toast.success('Market Intelligence Transcript copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xl overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-5xl rounded-3xl border border-[#00F0FF]/30 bg-black/90 shadow-[0_0_60px_rgba(0,240,255,0.2)] overflow-hidden flex flex-col my-auto max-h-[92vh]"
        >
          {/* Header Controls */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-[#00F0FF]/15 via-black to-[#FFD700]/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/40 flex items-center justify-center shadow-[0_0_12px_rgba(0,240,255,0.3)]">
                <Radio className="w-5 h-5 text-[#00F0FF] animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-orbitron font-black text-base uppercase text-white tracking-wider">
                    Trendly <span className="cyan-gold-gradient-text">Live Market Debrief</span>
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-mono font-bold animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> LIVE BROADCAST
                  </span>
                </div>
                <p className="text-[11px] text-[#8E9BB4] font-mono">
                  {data?.todayDate ?? 'Synthesizing live intelligence...'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="w-8 h-8 p-0 rounded-full text-[#8E9BB4] hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Main Broadcast Body */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-y-auto flex-1">
            {/* Left Stage Column: 3D Robot News Anchor & Audio Visualizer */}
            <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-white/10 p-5 flex flex-col justify-between bg-gradient-to-b from-black via-dark-navy/40 to-black relative">
              <div className="absolute top-4 left-4 z-10">
                <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-black/60 border border-[#00F0FF]/30 text-[#00F0FF] shadow-md flex items-center gap-1.5">
                  <Cpu className="w-3 h-3 text-[#00F0FF]" /> 3D AI News Anchor
                </span>
              </div>

              {/* 3D Stage Viewport */}
              <div className="w-full h-64 sm:h-72 relative rounded-2xl overflow-hidden border border-white/10 bg-black/80 my-auto shadow-[inset_0_0_30px_rgba(0,0,0,0.8)]">
                <Stage3DCanvas
                  className="w-full h-full"
                  isSpeaking={isPlaying}
                  emotion={isPlaying ? 'happy' : 'neutral'}
                />

                {/* Animated Speech Equalizer Waveform Overlay */}
                {isPlaying && (
                  <div className="absolute bottom-3 left-3 right-3 py-1.5 px-3 rounded-lg bg-black/70 border border-[#00F0FF]/30 backdrop-blur-md flex items-center justify-between gap-1 z-10">
                    <div className="flex items-center gap-1 text-[10px] font-mono text-[#00F0FF] font-bold">
                      <Volume2 className="w-3.5 h-3.5 animate-pulse" /> SPEAKING
                    </div>
                    <div className="flex items-end gap-1 h-4">
                      {[12, 24, 18, 28, 14, 22, 30, 16, 20, 26, 12, 18].map((h, i) => (
                        <motion.span
                          key={i}
                          animate={{ height: [4, h, 6] }}
                          transition={{ repeat: Infinity, duration: 0.4 + (i % 4) * 0.1, ease: 'easeInOut' }}
                          className="w-1 bg-gradient-to-t from-[#00F0FF] to-[#FFD700] rounded-full"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Broadcast Speech Controls */}
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-[#8E9BB4]">
                    <Bot className="w-3.5 h-3.5 text-[#FFD700]" /> Voice:
                    <select
                      value={selectedVoiceId}
                      onChange={(e) => {
                        setSelectedVoiceId(e.target.value);
                        if (isPlaying) handleRestartSpeech();
                      }}
                      className="bg-black/60 border border-white/15 rounded-md px-2 py-1 text-xs text-white font-mono focus:border-[#00F0FF] outline-none"
                    >
                      {VOICE_PRESETS.map((v) => (
                        <option key={v.id} value={v.id} className="bg-black text-white">
                          {v.name} ({v.codename})
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyTranscript}
                    className="h-7 text-[10px] font-mono text-[#8E9BB4] hover:text-white px-2"
                  >
                    {copied ? <Check className="w-3 h-3 mr-1 text-green-400" /> : <Copy className="w-3 h-3 mr-1" />}
                    Copy Text
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleTogglePlay}
                    className={`flex-1 font-mono uppercase font-bold text-xs h-10 shadow-lg ${
                      isPlaying
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                        : 'cyan-gradient text-black font-extrabold holographic-btn shadow-[0_0_20px_rgba(0,240,255,0.3)]'
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-4 h-4 mr-1.5 fill-current" /> Pause Speech
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-1.5 fill-current" /> Play Spoken Debrief
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRestartSpeech}
                    title="Replay Spoken Intelligence"
                    className="border-white/15 text-white hover:bg-white/10 h-10 px-3"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Column: Live Intelligence Telemetry & Actionable Move */}
            <div className="lg:col-span-7 p-5 flex flex-col justify-between space-y-4">
              {/* Tabs Navigation */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('briefing')}
                    className={`text-xs font-mono font-bold uppercase px-3 py-1.5 rounded-lg transition-all ${
                      activeTab === 'briefing'
                        ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30'
                        : 'text-[#8E9BB4] hover:text-white'
                    }`}
                  >
                    Executive Briefing
                  </button>
                  <button
                    onClick={() => setActiveTab('telemetry')}
                    className={`text-xs font-mono font-bold uppercase px-3 py-1.5 rounded-lg transition-all ${
                      activeTab === 'telemetry'
                        ? 'bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/30'
                        : 'text-[#8E9BB4] hover:text-white'
                    }`}
                  >
                    Market Radar Signals ({data?.topTrends?.length ?? 0})
                  </button>
                </div>

                <div className="text-[10px] font-mono text-[#8E9BB4]">
                  Bot Reserves: <span className="text-green-400 font-bold">${data?.userStats?.totalBotBalance?.toFixed(2) ?? '0.00'} USDC</span>
                </div>
              </div>

              {/* Tab 1: Spoken Executive Script & Primary Move */}
              {activeTab === 'briefing' && (
                <div className="space-y-4">
                  {/* Spoken Script Box */}
                  <div className="p-4 rounded-2xl bg-black/60 border border-white/10 text-xs font-sans text-[#CCD6F6] leading-relaxed space-y-2 max-h-44 overflow-y-auto">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#00F0FF] uppercase mb-1">
                      <Sparkles className="w-3.5 h-3.5" /> Intelligence Synthesis Transcript:
                    </div>
                    {data?.spokenScript ? (
                      data.spokenScript.split('\n\n').map((paragraph: string, idx: number) => (
                        <p key={idx}>{paragraph}</p>
                      ))
                    ) : (
                      <p className="text-[#8E9BB4] italic">Loading real-time market debrief synthesis...</p>
                    )}
                  </div>

                  {/* Highlighted Primary Actionable Move */}
                  {data?.primaryMove && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FFD700]/10 via-black to-[#00F0FF]/10 border border-[#FFD700]/30 relative group shadow-[0_0_20px_rgba(255,215,0,0.1)]">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono font-bold uppercase text-[#FFD700] flex items-center gap-1">
                          <Zap className="w-3 h-3 fill-current" /> TOP ACTIONABLE ALPHA OF THE DAY
                        </span>
                        <span className="text-[10px] font-mono font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                          +${data.primaryMove.estimatedEarningsLow} - ${data.primaryMove.estimatedEarningsHigh} est.
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-white font-mono mb-1">
                        {data.primaryMove.title}
                      </h4>
                      <p className="text-xs text-[#8E9BB4] font-sans line-clamp-2 mb-3">
                        {data.primaryMove.description}
                      </p>

                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[11px] font-mono text-[#8E9BB4]">
                          Startup Cost: <span className="text-white font-bold">${data.primaryMove.startupCost}</span>
                        </div>
                        <Link href={`/tasks/${data.primaryMove.id}`} onClick={onClose}>
                          <Button size="sm" className="cyan-gradient text-black font-extrabold uppercase text-xs h-8 px-4 holographic-btn font-mono">
                            Execute Move Now <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Live Market Signals & Velocity */}
              {activeTab === 'telemetry' && (
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {data?.topTrends?.map((trend: any, i: number) => (
                    <div
                      key={trend.id || i}
                      className="p-3 rounded-xl bg-black/60 border border-white/10 hover:border-[#00F0FF]/30 transition-all"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white font-mono">{trend.name}</span>
                        <span className="text-[10px] font-mono text-[#00F0FF] font-bold">
                          🔥 Velocity: {trend.mentionVelocity}x
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8E9BB4] font-sans line-clamp-2">
                        {trend.whyItMatters || trend.newsSummary || 'High customer demand detected on organic developer threads.'}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Bottom Scrolling Market Ticker */}
              <div className="p-2.5 rounded-xl bg-black/80 border border-white/10 text-[10px] font-mono text-[#8E9BB4] flex items-center justify-between overflow-hidden">
                <div className="flex items-center gap-2 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
                  <span className="font-bold text-white uppercase">24H TELEMETRY:</span>
                </div>
                <div className="truncate px-2 text-[#00F0FF]">
                  [REDDIT PAIN POINT SCRAPER: +$1,200/mo] • [PREDICTION ARBITRAGE: +14.2% ROI] • [MICRO-SAAS SCAFFOLDER: $4,500 MRR]
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
