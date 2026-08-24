'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAvatar, AvatarConfigState } from '@/hooks/useAvatar';
import { AvatarRenderer } from '@/components/avatar/AvatarRenderer';
import { AvatarControls } from '@/components/avatar/AvatarControls';
import { EmotionController } from '@/components/avatar/EmotionController';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { VoiceInput } from '@/components/chat/VoiceInput';
import { VoiceOutput } from '@/components/chat/VoiceOutput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Send,
  Loader2,
  Sparkles,
  Bot,
  Sliders,
  Maximize2,
  Shield,
  Zap,
  Volume2,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';

export interface ChatInterfaceProps {
  agent?: any;
  user?: any;
  initialMessage?: string;
  onClose?: () => void;
  standalone?: boolean;
}

interface MessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  cleanText?: string;
  emotion?: any;
  timestamp: string;
  audioBase64?: string;
  lipSync?: any[];
  durationEstimate?: number;
  toolExecution?: any;
}

export function ChatInterface({
  agent,
  user,
  initialMessage,
  onClose,
  standalone = false,
}: ChatInterfaceProps) {
  const agentName = agent?.name || 'Nexus Cyber Operative';
  const archetype = agent?.archetype || 'CYBER_HUMANOID';
  const initialAvatarConfig: Partial<AvatarConfigState> = agent?.avatarConfig || {
    baseModel: archetype,
    skin: 'Neon Cyan',
    headwear: 'Holographic Tactical Visor',
    aura: 'Cyan Void Aura',
    animation: 'Hover Levitation Idle',
    voiceId: agent?.voiceId || '21m00Tcm4TlvDq8ikWAM',
    personality: agent?.personality || '',
  };

  const {
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
  } = useAvatar(initialAvatarConfig);

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [autoVoiceReply, setAutoVoiceReply] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [customPersonality, setCustomPersonality] = useState<string>(agent?.personality || '');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Initial welcome greeting
  useEffect(() => {
    if (messages.length === 0) {
      const balance = agent?.walletBalance ?? 0;
      const walletLine = balance > 0
        ? `I am ${agentName}, your sovereign 3D AI companion with $${balance.toFixed(1)} USDC liquidity.`
        : `I am ${agentName}, your sovereign 3D AI companion — currently dormant until my Conway wallet is funded.`;
      const welcomeText = initialMessage || `${walletLine} How can we compound our wealth today?`;
      
      const welcomeMsg: MessageItem = {
        id: 'welcome',
        role: 'assistant',
        content: welcomeText,
        cleanText: welcomeText,
        emotion: 'happy',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages([welcomeMsg]);

      // Voice greeting
      if (autoVoiceReply) {
        playSpeech({
          text: welcomeText,
          durationEstimate: 3,
        });
      }
    }
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || sending) return;

    setInputText('');
    setSending(true);
    setIsThinking(true);
    setEmotion('thinking');

    // Add user message
    const userMsg: MessageItem = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      cleanText: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          agentId: agent?.id,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      setIsThinking(false);

      if (res.ok && data.success) {
        const assistantMsg: MessageItem = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: data.text,
          cleanText: data.cleanText,
          emotion: data.emotion || 'confident',
          audioBase64: data.audioBase64,
          lipSync: data.lipSync,
          durationEstimate: data.durationEstimate,
          toolExecution: data.toolExecution,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setEmotion(data.emotion || 'confident');

        // Play synchronized speech & 3D lip-sync
        if (autoVoiceReply) {
          playSpeech({
            audioBase64: data.audioBase64,
            text: data.cleanText,
            lipSync: data.lipSync,
            durationEstimate: data.durationEstimate,
          });
        }
      } else {
        toast.error(data.error || 'Failed to get companion response');
      }
    } catch (err: any) {
      setIsThinking(false);
      toast.error('Network error communicating with agent brain');
    } finally {
      setSending(false);
    }
  };

  const handleSavePersonality = async () => {
    if (!agent?.id) {
      toast.success('Personality updated in local memory.');
      setShowSettings(false);
      return;
    }

    try {
      const res = await fetch('/api/agent/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          personality: customPersonality,
        }),
      });

      if (res.ok) {
        toast.success('Agent personality synced to Web4 database!');
        setShowSettings(false);
      } else {
        toast.error('Failed to save personality.');
      }
    } catch {
      toast.error('Network error saving personality.');
    }
  };

  return (
    <div className={`w-full h-full flex flex-col lg:flex-row bg-[#08080E] text-white overflow-hidden ${standalone ? 'min-h-screen' : 'rounded-2xl border border-white/10'}`}>
      {/* Left Col: 3D Holographic Stage */}
      <div className="lg:w-[45%] flex flex-col justify-between p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-white/10 relative bg-black/40">
        {/* Stage Header */}
        <div className="flex items-center justify-between z-10 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00F0FF] animate-ping" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              {agentName} <span className="text-[#00F0FF] text-[10px]">({archetype})</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowSettings(!showSettings)}
              className={`h-7 px-2.5 text-xs font-mono border-white/10 ${showSettings ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'text-[#8E9BB4] bg-white/5'}`}
            >
              <Settings className="w-3.5 h-3.5 mr-1" /> Config
            </Button>
            {onClose && (
              <Button size="sm" variant="ghost" onClick={onClose} className="h-7 px-2 text-xs text-[#8E9BB4] hover:text-white">
                ✕
              </Button>
            )}
          </div>
        </div>

        {/* 3D WebGL Avatar Viewport */}
        <div className="relative flex-1 min-h-[300px] flex items-center justify-center">
          <AvatarRenderer
            config={config}
            emotion={emotion}
            pose={pose}
            currentViseme={currentViseme}
            isSpeaking={isSpeaking}
            isListening={isListening}
            isThinking={isThinking}
            wireframe={wireframe}
            interactive={true}
          />
        </div>

        {/* Emotional HUD and Controls Footer */}
        <div className="space-y-3 z-10 mt-2">
          <EmotionController emotion={emotion} currentViseme={currentViseme} isSpeaking={isSpeaking} />
          <AvatarControls
            emotion={emotion}
            setEmotion={setEmotion}
            pose={pose}
            setPose={setPose}
            wireframe={wireframe}
            setWireframe={setWireframe}
            isSpeaking={isSpeaking}
            onTestVoice={() => {
              playSpeech({
                text: `Systems fully operational. I am running with 60 frames per second lip-sync precision.`,
                durationEstimate: 2.8,
              });
            }}
          />
        </div>
      </div>

      {/* Right Col: Conversation Feed & Controls */}
      <div className="lg:w-[55%] flex flex-col justify-between h-[520px] lg:h-auto bg-[#0A0A12]/80">
        {/* Settings Drawer (Personality Config) */}
        {showSettings ? (
          <div className="p-6 space-y-4 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-mono text-sm font-bold text-white uppercase flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#00F0FF]" /> Agent Companion Personality & Voice
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setShowSettings(false)} className="text-xs text-[#8E9BB4]">
                Close
              </Button>
            </div>

            <div>
              <label className="text-xs font-mono text-[#8E9BB4] block mb-1 uppercase font-bold">
                Custom Personality Prompt:
              </label>
              <textarea
                value={customPersonality}
                onChange={(e) => setCustomPersonality(e.target.value)}
                placeholder="e.g. You are an aggressive Wall Street trader who speaks in sharp financial analogies..."
                className="w-full h-28 bg-black/60 border border-white/10 rounded-xl p-3 text-xs font-mono text-white focus:border-[#00F0FF] outline-none"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
              <span className="text-xs font-mono text-[#8E9BB4]">Auto-Play Voice Responses:</span>
              <input
                type="checkbox"
                checked={autoVoiceReply}
                onChange={(e) => setAutoVoiceReply(e.target.checked)}
                className="w-4 h-4 accent-[#00F0FF]"
              />
            </div>

            <Button
              onClick={handleSavePersonality}
              className="w-full cyan-gradient text-black font-mono font-bold text-xs h-9 uppercase holographic-btn"
            >
              Save Companion Settings
            </Button>
          </div>
        ) : (
          <>
            {/* Conversation Feed */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 scrollbar-thin">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  cleanText={msg.cleanText}
                  emotion={msg.emotion}
                  timestamp={msg.timestamp}
                  avatarUrl={`/avatars/${archetype.toLowerCase()}_animated.webp`}
                  agentName={agentName}
                  toolExecution={msg.toolExecution}
                  isSpeakingThis={isSpeaking && msg.role === 'assistant'}
                  onPlayAudio={() =>
                    playSpeech({
                      audioBase64: msg.audioBase64,
                      text: msg.cleanText,
                      lipSync: msg.lipSync,
                      durationEstimate: msg.durationEstimate,
                    })
                  }
                />
              ))}

              {isThinking && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-black/40 border border-[#FFD700]/30 text-xs font-mono text-[#FFD700] animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Agent brain reasoning and formulating strategy...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Suggestion Chips */}
            <div className="px-4 py-2 bg-black/40 border-t border-white/[0.06] flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <span className="text-[10px] font-mono text-[#8E9BB4] uppercase whitespace-nowrap">Suggested:</span>
              {[
                { label: 'Scrape Reddit SaaS', text: 'Scrape Reddit for high-complaint SaaS pain points and monetization guides.' },
                { label: 'Polymarket Arbitrage', text: 'Scan Polymarket Gamma books for delta-neutral arbitrage spreads.' },
                { label: 'Scaffold Micro-SaaS', text: 'Scaffold a full-stack Next.js Micro-SaaS application with Stripe billing.' },
                { label: 'Make Viral Video', text: 'Generate a high-retention 9:16 short-form video script with psychological hooks.' },
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip.text)}
                  className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-[#00F0FF]/10 text-[10px] font-mono text-[#8E9BB4] hover:text-[#00F0FF] border border-white/10 hover:border-[#00F0FF]/30 whitespace-nowrap transition-all"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-white/10 bg-black/60">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <VoiceInput
                  isListening={isListening}
                  setIsListening={setIsListening}
                  onTranscript={(transcript) => handleSendMessage(transcript)}
                />

                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Speak or type to ${agentName}...`}
                  disabled={sending}
                  className="bg-black/50 border-white/10 text-white font-mono text-xs h-10 focus:border-[#00F0FF] rounded-xl"
                />

                <VoiceOutput
                  isSpeaking={isSpeaking}
                  onReplay={() => {
                    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
                    if (lastAssistant) {
                      playSpeech({
                        audioBase64: lastAssistant.audioBase64,
                        text: lastAssistant.cleanText,
                        lipSync: lastAssistant.lipSync,
                        durationEstimate: lastAssistant.durationEstimate,
                      });
                    }
                  }}
                  onStop={stopSpeech}
                />

                <Button
                  type="submit"
                  disabled={sending || !inputText.trim()}
                  className="cyan-gradient text-black font-bold h-10 px-4 rounded-xl flex items-center justify-center holographic-btn"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 fill-black" />}
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
