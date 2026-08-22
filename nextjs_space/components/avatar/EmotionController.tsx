'use client';

import React from 'react';
import { AvatarEmotion } from '@/hooks/useAvatar';
import { Sparkles, Zap, Heart, ShieldAlert, Brain } from 'lucide-react';

export interface EmotionControllerProps {
  emotion: AvatarEmotion;
  currentViseme?: {
    amplitude: number;
    mouthOpen: number;
    mouthWide: number;
    mouthRound: number;
  };
  isSpeaking?: boolean;
}

export function EmotionController({
  emotion,
  currentViseme = { amplitude: 0, mouthOpen: 0, mouthWide: 0, mouthRound: 0 },
  isSpeaking = false,
}: EmotionControllerProps) {
  const getEmotionDetails = () => {
    switch (emotion) {
      case 'happy':
        return { label: 'Euphoric / Harmonious', color: '#22C55E', icon: Heart, desc: 'Warm resonance & high trust' };
      case 'surprised':
        return { label: 'Alpha Alert / High Delta', color: '#00F0FF', icon: Zap, desc: 'Discovered significant market edge' };
      case 'thinking':
        return { label: 'Neural Compute / Analysis', color: '#FFD700', icon: Brain, desc: 'Scanning orderbooks & codebase' };
      case 'battle':
        return { label: 'Combat / Sovereign Duel', color: '#FF007A', icon: ShieldAlert, desc: 'Competitive survival intensity' };
      case 'confident':
      default:
        return { label: 'Strategic / Sovereign', color: '#F5A623', icon: Sparkles, desc: 'Optimal execution readiness' };
    }
  };

  const details = getEmotionDetails();
  const Icon = details.icon;

  return (
    <div className="flex items-center justify-between p-3 bg-black/40 border border-white/[0.08] rounded-xl text-xs font-mono">
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${details.color}20`, border: `1px solid ${details.color}50` }}
        >
          <Icon className="w-4 h-4" style={{ color: details.color }} />
        </div>
        <div>
          <div className="font-bold text-white uppercase text-[11px] flex items-center gap-1.5">
            <span>{details.label}</span>
          </div>
          <div className="text-[10px] text-[#8E9BB4] font-sans">{details.desc}</div>
        </div>
      </div>

      {/* Live Viseme / Audio Waveform Meter */}
      <div className="flex items-center gap-1">
        {[0.3, 0.7, 1.0, 0.6, 0.4].map((multiplier, idx) => {
          const height = isSpeaking ? Math.max(4, Math.min(20, (currentViseme.amplitude || 0.2) * 22 * multiplier)) : 4;
          return (
            <div
              key={idx}
              className="w-1 bg-[#00F0FF] rounded-full transition-all duration-75"
              style={{
                height: `${height}px`,
                backgroundColor: isSpeaking ? details.color : '#8E9BB440',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
