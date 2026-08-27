'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Check, Sparkles, Play, Pause, Mic, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { VOICE_PRESETS, VoicePreset, getVoicePresetById } from '@/lib/agent/voice-presets';

export interface VoiceSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoiceId: string;
  onSelectVoice: (voiceId: string) => void;
}

export function VoiceSelectorModal({
  isOpen,
  onClose,
  selectedVoiceId,
  onSelectVoice,
}: VoiceSelectorModalProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);

  const handlePreviewVoice = (preset: VoicePreset) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error('Web Speech Audio not supported in this browser.');
      return;
    }

    if (playingId === preset.id) {
      window.speechSynthesis.cancel();
      setPlayingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    setPlayingId(preset.id);

    const utterance = new SpeechSynthesisUtterance(preset.sampleText);
    utterance.rate = preset.rate;
    utterance.pitch = preset.pitch;

    const availableVoices = window.speechSynthesis.getVoices();
    if (availableVoices && availableVoices.length > 0) {
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
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
    }

    utterance.onend = () => {
      setPlayingId(null);
    };

    utterance.onerror = () => {
      setPlayingId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={() => {
        window.speechSynthesis?.cancel();
        onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        className="glass-card border border-[#00F0FF]/30 rounded-3xl p-6 md:p-8 w-full max-w-2xl text-left relative overflow-hidden shadow-[0_0_60px_rgba(0,240,255,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00F0FF]/20 border border-[#00F0FF]/40 flex items-center justify-center text-[#00F0FF]">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-orbitron font-black text-base uppercase text-white">
                Neural Voice Synthesis Engine
              </h3>
              <span className="text-[10px] font-mono text-[#8E9BB4] uppercase block">
                Choose from 5 Realistic Professional Voices
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              window.speechSynthesis?.cancel();
              onClose();
            }}
            className="text-[#8E9BB4] hover:text-white text-xs font-mono px-2 py-1 bg-white/5 rounded-lg border border-white/10"
          >
            ESC ✕
          </button>
        </div>

        {/* 5 Voice Cards Grid */}
        <div className="space-y-3 max-h-[58vh] overflow-y-auto pr-1">
          {VOICE_PRESETS.map((preset) => {
            const isSelected = selectedVoiceId === preset.id || selectedVoiceId === preset.elevenLabsVoiceId;
            const isPlaying = playingId === preset.id;

            return (
              <div
                key={preset.id}
                onClick={() => onSelectVoice(preset.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isSelected
                    ? 'bg-[#00F0FF]/10 border-[#00F0FF] shadow-[0_0_25px_rgba(0,240,255,0.2)]'
                    : 'bg-black/50 border-white/10 hover:border-white/25 hover:bg-black/70'
                }`}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-orbitron font-bold text-sm text-white">
                      {preset.name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-[#00F0FF] border border-white/10">
                      {preset.codename}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      {preset.gender}
                    </span>
                    {isSelected && (
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> ACTIVE
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#CCD6F6] font-sans line-clamp-1">
                    {preset.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {preset.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] font-mono text-[#8E9BB4] bg-black/40 px-1.5 py-0.5 rounded border border-white/5"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Preview Button */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreviewVoice(preset);
                    }}
                    className={`h-9 px-3 text-xs font-mono uppercase font-bold border transition-all ${
                      isPlaying
                        ? 'bg-[#FF007A]/20 text-[#FF007A] border-[#FF007A]/50 animate-pulse'
                        : 'bg-white/5 text-white border-white/15 hover:bg-[#00F0FF]/15 hover:border-[#00F0FF]/40 hover:text-[#00F0FF]'
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 mr-1.5" /> Stop Sample
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 mr-1.5 fill-current" /> Play Sample
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info note */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] font-mono text-[#8E9BB4]">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>Multi-modal ElevenLabs &amp; Web Speech Neural Audio Engine</span>
          </div>

          <Button
            size="sm"
            onClick={() => {
              window.speechSynthesis?.cancel();
              onClose();
            }}
            className="cyan-gradient text-black font-extrabold uppercase text-xs h-8 px-4 font-mono ml-auto"
          >
            Apply Voice &rarr;
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
