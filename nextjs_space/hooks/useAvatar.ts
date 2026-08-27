'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { VisemeKeyframe, getVisemeFromAudioFrequencies } from '@/lib/agent/lipsync';
import { getVoicePresetById } from '@/lib/agent/voice-presets';

export type AvatarEmotion = 'neutral' | 'happy' | 'surprised' | 'thinking' | 'confident' | 'battle';
export type AvatarPose = 'idle' | 'talking' | 'thinking' | 'battle' | 'celebrating';

export interface AvatarConfigState {
  baseModel: 'CYBER_HUMANOID' | 'QUANTUM_ANDROID' | 'WALL_STREET_TITAN' | 'COSMIC_ENTITY' | string;
  skin: string;
  headwear?: string;
  accessory?: string;
  wings?: string;
  aura: string;
  animation: string;
  voiceId?: string;
  personality?: string;
}

export function useAvatar(initialConfig?: Partial<AvatarConfigState>) {
  const [config, setConfig] = useState<AvatarConfigState>({
    baseModel: initialConfig?.baseModel || 'CYBER_HUMANOID',
    skin: initialConfig?.skin || 'Neon Cyan',
    headwear: initialConfig?.headwear || 'Holographic Tactical Visor',
    accessory: initialConfig?.accessory || 'Holographic Tactical Visor',
    wings: initialConfig?.wings || 'None',
    aura: initialConfig?.aura || 'Cyan Void Aura',
    animation: initialConfig?.animation || 'Hover Levitation Idle',
    voiceId: initialConfig?.voiceId || '21m00Tcm4TlvDq8ikWAM',
    personality: initialConfig?.personality || '',
  });

  const [emotion, setEmotion] = useState<AvatarEmotion>('confident');
  const [pose, setPose] = useState<AvatarPose>('idle');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);

  // Real-time lip-sync state
  const [currentViseme, setCurrentViseme] = useState<{
    amplitude: number;
    mouthOpen: number;
    mouthWide: number;
    mouthRound: number;
  }>({
    amplitude: 0,
    mouthOpen: 0,
    mouthWide: 0,
    mouthRound: 0,
  });

  // Audio Context for real-time audio analysis
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const visemeTimeoutRef = useRef<NodeJS.Timeout[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      visemeTimeoutRef.current.forEach(clearTimeout);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  /**
   * Plays speech audio and synchronizes 3D mouth lip-sync
   */
  const playSpeech = useCallback(
    async (params: {
      audioBase64?: string;
      text?: string;
      lipSync?: VisemeKeyframe[];
      durationEstimate?: number;
      onEnd?: () => void;
    }) => {
      const { audioBase64, text, lipSync, durationEstimate = 3, onEnd } = params;

      setIsSpeaking(true);
      setPose('talking');

      // Clear any pending keyframe timers
      visemeTimeoutRef.current.forEach(clearTimeout);
      visemeTimeoutRef.current = [];

      // Strategy A: Real Audio via Web Audio Analyser if base64 exists
      if (audioBase64 && typeof window !== 'undefined') {
        try {
          if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioCtx();
          }

          if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
          }

          const audio = new Audio(audioBase64);
          const analyser = audioContextRef.current.createAnalyser();
          analyser.fftSize = 256;
          analyserRef.current = analyser;

          const source = audioContextRef.current.createMediaElementSource(audio);
          source.connect(analyser);
          analyser.connect(audioContextRef.current.destination);

          const freqData = new Uint8Array(analyser.frequencyBinCount);

          const updateLipSync = () => {
            if (!audio.paused && !audio.ended) {
              analyser.getByteFrequencyData(freqData);
              const visemeData = getVisemeFromAudioFrequencies(freqData);
              setCurrentViseme(visemeData);
              animFrameRef.current = requestAnimationFrame(updateLipSync);
            } else {
              setCurrentViseme({ amplitude: 0, mouthOpen: 0, mouthWide: 0, mouthRound: 0 });
              setIsSpeaking(false);
              setPose('idle');
              if (onEnd) onEnd();
            }
          };

          audio.onended = () => {
            setIsSpeaking(false);
            setPose('idle');
            setCurrentViseme({ amplitude: 0, mouthOpen: 0, mouthWide: 0, mouthRound: 0 });
            if (onEnd) onEnd();
          };

          audio.onerror = () => {
            playFallbackKeyframes(lipSync, durationEstimate, onEnd);
          };

          await audio.play();
          animFrameRef.current = requestAnimationFrame(updateLipSync);
          return;
        } catch (err) {
          console.warn('[useAvatar] Audio element playback failed, using speech synthesis fallback:', err);
        }
      }

      // Strategy B: Browser Web Speech Synthesis with natural voice matching
      if (text && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          const preset = getVoicePresetById(config.voiceId);

          utterance.rate = preset.rate;
          utterance.pitch = preset.pitch;

          // Intelligently select best available high-fidelity browser voice
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

            if (!matchedVoice) {
              // Fallback to any high-quality English voice
              matchedVoice =
                availableVoices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Premium'))) ||
                availableVoices.find((v) => v.lang.startsWith('en')) ||
                availableVoices[0];
            }

            if (matchedVoice) {
              utterance.voice = matchedVoice;
            }
          }

          utterance.onend = () => {
            setIsSpeaking(false);
            setPose('idle');
            setCurrentViseme({ amplitude: 0, mouthOpen: 0, mouthWide: 0, mouthRound: 0 });
            if (onEnd) onEnd();
          };

          utterance.onerror = () => {
            setIsSpeaking(false);
            setPose('idle');
            if (onEnd) onEnd();
          };

          window.speechSynthesis.speak(utterance);
          playFallbackKeyframes(lipSync, durationEstimate, onEnd);
          return;
        } catch (e) {
          console.warn('[useAvatar] Speech synthesis error:', e);
        }
      }

      // Strategy C: Pure Keyframe Timeline Simulation
      playFallbackKeyframes(lipSync, durationEstimate, onEnd);
    },
    [config.baseModel]
  );

  const playFallbackKeyframes = (
    keyframes?: VisemeKeyframe[],
    durationSeconds: number = 3,
    onEnd?: () => void
  ) => {
    if (!keyframes || keyframes.length === 0) {
      // Simulate speaking rhythm
      const interval = setInterval(() => {
        setCurrentViseme({
          amplitude: 0.5 + Math.random() * 0.4,
          mouthOpen: 0.3 + Math.random() * 0.5,
          mouthWide: Math.random() * 0.6,
          mouthRound: Math.random() * 0.5,
        });
      }, 70);

      setTimeout(() => {
        clearInterval(interval);
        setCurrentViseme({ amplitude: 0, mouthOpen: 0, mouthWide: 0, mouthRound: 0 });
        setIsSpeaking(false);
        setPose('idle');
        if (onEnd) onEnd();
      }, durationSeconds * 1000);
      return;
    }

    keyframes.forEach((kf) => {
      const t = setTimeout(() => {
        setCurrentViseme({
          amplitude: kf.amplitude,
          mouthOpen: kf.mouthOpen,
          mouthWide: kf.mouthWide,
          mouthRound: kf.mouthRound,
        });
      }, kf.timeMs);
      visemeTimeoutRef.current.push(t);
    });

    const endTimer = setTimeout(() => {
      setCurrentViseme({ amplitude: 0, mouthOpen: 0, mouthWide: 0, mouthRound: 0 });
      setIsSpeaking(false);
      setPose('idle');
      if (onEnd) onEnd();
    }, durationSeconds * 1000 + 100);

    visemeTimeoutRef.current.push(endTimer);
  };

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    visemeTimeoutRef.current.forEach(clearTimeout);
    visemeTimeoutRef.current = [];
    setIsSpeaking(false);
    setPose('idle');
    setCurrentViseme({ amplitude: 0, mouthOpen: 0, mouthWide: 0, mouthRound: 0 });
  }, []);

  return {
    config,
    setConfig,
    emotion,
    setEmotion,
    pose,
    setPose,
    isSpeaking,
    isListening,
    setIsListening,
    isThinking,
    setIsThinking,
    currentViseme,
    playSpeech,
    stopSpeech,
  };
}
