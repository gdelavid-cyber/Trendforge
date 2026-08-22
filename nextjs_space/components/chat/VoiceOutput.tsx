'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';

export interface VoiceOutputProps {
  isSpeaking: boolean;
  onReplay: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export function VoiceOutput({
  isSpeaking,
  onReplay,
  onStop,
  disabled = false,
}: VoiceOutputProps) {
  return (
    <div className="flex items-center gap-1.5">
      {isSpeaking ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onStop}
          className="h-8 px-2.5 rounded-lg text-xs font-mono bg-[#FF007A]/10 text-[#FF007A] border-[#FF007A]/30 hover:bg-[#FF007A]/20"
        >
          <VolumeX className="w-3.5 h-3.5 mr-1" /> Stop Voice
        </Button>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={disabled}
          onClick={onReplay}
          className="h-8 px-2.5 rounded-lg text-xs font-mono text-[#8E9BB4] hover:text-white hover:bg-white/5"
        >
          <Volume2 className="w-3.5 h-3.5 mr-1 text-[#00F0FF]" /> Replay Voice
        </Button>
      )}
    </div>
  );
}
