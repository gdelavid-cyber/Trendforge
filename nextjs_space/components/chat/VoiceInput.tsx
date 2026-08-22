'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { normalizeSpeechTranscript } from '@/lib/agent/stt';
import { toast } from 'sonner';

export interface VoiceInputProps {
  onTranscript: (transcript: string) => void;
  isListening: boolean;
  setIsListening: (isListening: boolean) => void;
  disabled?: boolean;
}

export function VoiceInput({
  onTranscript,
  isListening,
  setIsListening,
  disabled = false,
}: VoiceInputProps) {
  const recognitionRef = useRef<any>(null);
  const [supported, setSupported] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setSupported(false);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let current = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          current += event.results[i][0].transcript;
        }
        if (event.results[0].isFinal) {
          const clean = normalizeSpeechTranscript(current);
          if (clean) {
            onTranscript(clean);
            setIsListening(false);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('[STT] Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast.error('Microphone permission denied. Please allow microphone access.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [onTranscript, setIsListening]);

  const toggleListening = () => {
    if (!supported) {
      toast.error('Speech-to-text is not supported in this browser. Please type your message.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.warn('[STT] Could not start speech recognition:', err);
      }
    }
  };

  return (
    <div className="relative">
      <Button
        type="button"
        size="icon"
        disabled={disabled}
        onClick={toggleListening}
        className={`w-10 h-10 rounded-xl transition-all ${
          isListening
            ? 'bg-[#FF007A] text-white shadow-[0_0_20px_rgba(255,0,122,0.6)] animate-pulse'
            : 'bg-black/40 border border-white/10 text-[#8E9BB4] hover:text-white hover:border-[#00F0FF]/40'
        }`}
        title={isListening ? 'Stop Listening' : 'Speak to Agent (STT)'}
      >
        {isListening ? (
          <MicOff className="w-4 h-4 text-white" />
        ) : (
          <Mic className="w-4 h-4 text-[#00F0FF]" />
        )}
      </Button>

      {/* Floating Soundwave indicator when listening */}
      {isListening && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[9px] font-mono text-[#FF007A] uppercase tracking-wider bg-black/80 px-2 py-0.5 rounded-full border border-[#FF007A]/40 whitespace-nowrap animate-bounce">
          Listening...
        </span>
      )}
    </div>
  );
}
