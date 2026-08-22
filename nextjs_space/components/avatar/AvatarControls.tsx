'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { AvatarEmotion, AvatarPose } from '@/hooks/useAvatar';
import {
  RotateCcw,
  Sparkles,
  Eye,
  Zap,
  Flame,
  Crown,
  Volume2,
  Sliders,
  Maximize2,
} from 'lucide-react';

export interface AvatarControlsProps {
  emotion: AvatarEmotion;
  setEmotion: (emotion: AvatarEmotion) => void;
  pose: AvatarPose;
  setPose: (pose: AvatarPose) => void;
  wireframe: boolean;
  setWireframe: (wireframe: boolean) => void;
  onResetCamera?: () => void;
  onTestVoice?: () => void;
  isSpeaking?: boolean;
}

export function AvatarControls({
  emotion,
  setEmotion,
  pose,
  setPose,
  wireframe,
  setWireframe,
  onResetCamera,
  onTestVoice,
  isSpeaking = false,
}: AvatarControlsProps) {
  const emotions: { key: AvatarEmotion; label: string; icon: string }[] = [
    { key: 'confident', label: 'Confident', icon: '👑' },
    { key: 'happy', label: 'Happy', icon: '😄' },
    { key: 'thinking', label: 'Thinking', icon: '🤔' },
    { key: 'surprised', label: 'Surprised', icon: '😲' },
    { key: 'battle', label: 'Battle', icon: '⚔️' },
  ];

  return (
    <div className="flex flex-col gap-3 p-3 bg-black/60 border border-white/10 rounded-xl backdrop-blur-md">
      {/* Emotion Selector Toolbar */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 scrollbar-hide">
        <span className="text-[10px] font-mono text-[#8E9BB4] uppercase mr-1">Emotion:</span>
        <div className="flex items-center gap-1.5">
          {emotions.map((e) => (
            <button
              key={e.key}
              onClick={() => setEmotion(e.key)}
              className={`px-2 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1 ${
                emotion === e.key
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                  : 'bg-white/5 text-[#8E9BB4] hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{e.icon}</span>
              <span className="text-[11px] hidden sm:inline">{e.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stage Inspection & Utility Tools */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.06] text-xs font-mono">
        <div className="flex items-center gap-2">
          {onTestVoice && (
            <Button
              size="sm"
              variant="outline"
              disabled={isSpeaking}
              onClick={onTestVoice}
              className="h-7 px-2.5 text-[11px] font-mono border-white/10 text-white bg-white/5 hover:border-[#00F0FF]/40"
            >
              <Volume2 className="w-3 h-3 mr-1 text-[#00F0FF]" />
              {isSpeaking ? 'Speaking...' : 'Test Voice'}
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => setWireframe(!wireframe)}
            className={`h-7 px-2.5 text-[11px] font-mono border-white/10 ${
              wireframe ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/40' : 'text-[#8E9BB4] bg-white/5'
            }`}
          >
            <Eye className="w-3 h-3 mr-1" />
            {wireframe ? 'Wireframe ON' : 'Mesh View'}
          </Button>
        </div>

        {onResetCamera && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onResetCamera}
            className="h-7 px-2 text-[10px] font-mono text-[#8E9BB4] hover:text-white"
          >
            <RotateCcw className="w-3 h-3 mr-1" /> Reset Angle
          </Button>
        )}
      </div>
    </div>
  );
}
