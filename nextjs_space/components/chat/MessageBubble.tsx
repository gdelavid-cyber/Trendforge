'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Bot, User, Volume2, CheckCircle, ExternalLink, Zap } from 'lucide-react';
import { AvatarEmotion } from '@/hooks/useAvatar';
import { CompanionPortrait } from '@/components/avatar/CompanionPortrait';
import Link from 'next/link';

export interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  cleanText?: string;
  emotion?: AvatarEmotion;
  timestamp?: string;
  archetype?: string;
  agentName?: string;
  toolExecution?: {
    tool: string;
    params: any;
    runId?: string;
    status: string;
  };
  onPlayAudio?: () => void;
  isSpeakingThis?: boolean;
}

export function MessageBubble({
  role,
  content,
  cleanText,
  emotion,
  timestamp,
  archetype,
  agentName = 'Agent',
  toolExecution,
  onPlayAudio,
  isSpeakingThis = false,
}: MessageBubbleProps) {
  const isUser = role === 'user';
  const displayContent = cleanText || content.replace(/\[EMOTION:.*?\]/g, '').replace(/\[EXECUTE_TOOL:.*?\]/g, '').trim();

  const getEmotionBadge = () => {
    if (!emotion) return null;
    switch (emotion) {
      case 'happy':
        return <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">😄 Happy</span>;
      case 'surprised':
        return <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/20">⚡ Alert</span>;
      case 'thinking':
        return <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/20">🤔 Computing</span>;
      case 'battle':
        return <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#FF007A]/10 text-[#FF007A] border border-[#FF007A]/20">⚔️ Combat</span>;
      case 'confident':
      default:
        return <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#F5A623]/10 text-[#F5A623] border border-[#F5A623]/20">👑 Sovereign</span>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar Icon */}
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border overflow-hidden ${
          isUser
            ? 'bg-[#00F0FF]/10 border-[#00F0FF]/30 text-[#00F0FF]'
            : 'bg-black/60 border-white/10 text-white shadow-[0_0_12px_rgba(0,240,255,0.15)]'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : archetype ? (
          <CompanionPortrait archetype={archetype} className="w-full h-full" seed={agentName.length} />
        ) : (
          <Bot className="w-4 h-4 text-[#00F0FF]" />
        )}
      </div>

      {/* Bubble Content */}
      <div className={`max-w-[82%] sm:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-mono font-bold text-white">
            {isUser ? 'You' : agentName}
          </span>
          {!isUser && getEmotionBadge()}
          {timestamp && <span className="text-[9px] font-mono text-[#8E9BB4]">{timestamp}</span>}
        </div>

        <div
          className={`p-3.5 rounded-2xl text-xs leading-relaxed font-sans ${
            isUser
              ? 'bg-[#00F0FF]/15 text-white border border-[#00F0FF]/30 rounded-tr-none'
              : isSpeakingThis
              ? 'bg-black/70 text-[#E8E8E8] border border-[#00F0FF]/50 shadow-[0_0_20px_rgba(0,240,255,0.15)] rounded-tl-none'
              : 'bg-black/60 text-[#E8E8E8] border border-white/10 rounded-tl-none'
          }`}
        >
          <p className="whitespace-pre-wrap">{displayContent}</p>

          {/* Triggered Tool Execution Card */}
          {toolExecution && (
            <div className="mt-3 p-2.5 rounded-xl bg-black/60 border border-[#00F0FF]/30 space-y-1 text-[11px] font-mono">
              <div className="flex items-center justify-between text-[#00F0FF]">
                <span className="flex items-center gap-1 font-bold">
                  <Zap className="w-3 h-3 text-[#FFD700]" /> Autonomous Execution
                </span>
                <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded border border-green-500/30">
                  {toolExecution.status}
                </span>
              </div>
              <div className="text-[#8E9BB4]">
                Skill: <span className="text-white">{toolExecution.tool}</span>
              </div>
              {toolExecution.runId && (
                <div className="flex justify-between items-center pt-1 border-t border-white/10 text-[10px]">
                  <span className="text-[#8E9BB4]">ID: {toolExecution.runId}</span>
                  <Link
                    href={`/agents`}
                    className="text-[#00F0FF] hover:underline flex items-center gap-0.5"
                  >
                    View in Swarm <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Voice Replay Button for Assistant */}
          {!isUser && onPlayAudio && (
            <div className="mt-2 pt-2 border-t border-white/[0.06] flex items-center justify-between">
              <button
                onClick={onPlayAudio}
                className="text-[10px] font-mono text-[#00F0FF] hover:text-white flex items-center gap-1 transition-colors"
              >
                <Volume2 className="w-3 h-3" />
                {isSpeakingThis ? 'Playing...' : 'Play Voice'}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
