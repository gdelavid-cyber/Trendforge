'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  Bot,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit3,
  Flame,
  MessageSquare,
  Phone,
  Send,
  Shield,
  Sparkles,
  User,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { CopilotAnalysis, TranscriptMessage } from '@/lib/copilot/types';
import { CallDashboard } from './call-dashboard';

interface CoPilotLiveViewProps {
  sessionId: string;
  initialSession?: any;
  onDealClosed?: (data: any) => void;
}

export function CoPilotLiveView({ sessionId, initialSession, onDealClosed }: CoPilotLiveViewProps) {
  const [session, setSession] = useState<any>(initialSession || null);
  const [loading, setLoading] = useState<boolean>(!initialSession);
  const [activeSuggestion, setActiveSuggestion] = useState<any>(null);
  const [userText, setUserText] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [showCallModal, setShowCallModal] = useState<boolean>(false);

  // Poll session data
  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/earn/copilot/session/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        if (data.session.suggestions && data.session.suggestions.length > 0) {
          const latest = data.session.suggestions[0];
          if (!latest.used) {
            setActiveSuggestion(latest);
            if (!isEditing && !userText) {
              setUserText(latest.suggestedReply);
            }
          }
        }
        if (data.session.status === 'closed_won' && onDealClosed) {
          onDealClosed(data.session);
        }
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 3500);
    return () => clearInterval(interval);
  }, [sessionId]);

  const handleSendApproved = async (contentToSend: string, edited: boolean = false) => {
    setSending(true);
    try {
      const res = await fetch('/api/copilot/send-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          suggestionId: activeSuggestion?.id,
          replyContent: contentToSend,
          edited,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch reply');
      }

      toast.success('Message authorized and sent to prospect!');
      setUserText('');
      setIsEditing(false);
      setActiveSuggestion(null);
      fetchSession();
    } catch (err: any) {
      toast.error(err.message || 'Error sending reply');
    } finally {
      setSending(false);
    }
  };

  if (loading || !session) {
    return (
      <div className="p-8 rounded-2xl bg-[#07070C] border border-white/10 text-center font-mono text-xs text-[#8E9BB4]">
        <Clock className="w-5 h-5 mx-auto mb-2 animate-spin text-[#00F0FF]" />
        Connecting live sales co-pilot session...
      </div>
    );
  }

  const analysis = activeSuggestion?.aiAnalysis as CopilotAnalysis | undefined;
  const transcript = ((session.transcript as any) || []) as TranscriptMessage[];

  const statusColors: Record<string, string> = {
    waiting: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    engaged: 'bg-[#00F0FF]/10 text-[#00F0FF] border-[#00F0FF]/20',
    in_progress: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    closed_won: 'bg-[#00FF66]/10 text-[#00FF66] border-[#00FF66]/20',
    closed_lost: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    escalated: 'bg-red-500/10 text-red-400 border-red-500/20',
    opted_out: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  return (
    <div className="p-6 rounded-2xl bg-[#07070C] border border-white/10 text-left font-mono space-y-6">
      {/* Session Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold uppercase ${
                statusColors[session.status] || 'bg-white/10 text-white'
              }`}
            >
              {session.status.replace('_', ' ')}
            </span>
            <span className="text-xs text-[#8E9BB4] uppercase">
              Channel: <span className="text-white font-bold">{session.channel}</span>
            </span>
            <span className="text-xs text-[#8E9BB4] uppercase">
              Mode: <span className="text-[#00F0FF] font-bold">{session.mode}</span>
            </span>
          </div>
          <h3 className="text-lg font-bold text-white font-sans">
            Lead: {session.lead?.buyerName || 'Target Prospect'}
          </h3>
          <p className="text-xs text-[#8E9BB4]">{session.lead?.requestText || 'Direct deliverable engagement'}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-[#8E9BB4] uppercase block">Offer / Floor</span>
            <div className="text-sm font-bold text-white">
              ${session.priceOffer || 450} <span className="text-[#FFD700]">/ ${session.priceFloor} min</span>
            </div>
          </div>

          {session.channel === 'phone' && (
            <Button
              onClick={() => setShowCallModal(true)}
              className="bg-[#00FF66]/20 border border-[#00FF66]/30 text-[#00FF66] hover:bg-[#00FF66]/30 text-xs font-bold uppercase h-9"
            >
              <Phone className="w-3.5 h-3.5 mr-1.5" /> Call Dashboard
            </Button>
          )}
        </div>
      </div>

      {/* Live AI Alert & Coaching Card */}
      {activeSuggestion && analysis && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-xl bg-[#00F0FF]/5 border border-[#00F0FF]/30 space-y-4"
        >
          {/* Analysis Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-2.5 py-1 rounded-md bg-[#00F0FF]/20 text-[#00F0FF] text-xs font-bold flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5" /> Intent: {analysis.intent}
            </div>

            {analysis.objection && (
              <div className="px-2.5 py-1 rounded-md bg-yellow-500/20 text-yellow-300 text-xs font-bold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Objection: {analysis.objection}
              </div>
            )}

            <div
              className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${
                analysis.urgency === 'high'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-white/10 text-[#8E9BB4]'
              }`}
            >
              Urgency: {analysis.urgency}
            </div>
          </div>

          {/* Coaching Tip */}
          {analysis.coachingTip && (
            <div className="p-3 rounded-lg bg-black/40 border border-white/5 text-xs text-white/90 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[#00F0FF] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#00F0FF] uppercase mr-1.5">AI Coaching Tip:</span>
                {analysis.coachingTip}
              </div>
            </div>
          )}

          {/* Decision Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              onClick={() => handleSendApproved(analysis.suggestedReply, false)}
              disabled={sending}
              className="cyan-gradient text-black font-extrabold uppercase text-xs h-9 px-4 holographic-btn"
            >
              <Check className="w-3.5 h-3.5 mr-1" /> Use AI Suggestion
            </Button>

            <Button
              onClick={() => {
                setIsEditing(true);
                setUserText(analysis.suggestedReply);
              }}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 text-xs h-9 font-bold uppercase"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit &amp; Send
            </Button>

            <Button
              onClick={() => {
                setIsEditing(true);
                setUserText('');
              }}
              variant="ghost"
              className="text-[#8E9BB4] hover:text-white text-xs h-9 uppercase"
            >
              Ignore — Type My Own
            </Button>
          </div>
        </motion.div>
      )}

      {/* Message Composer (When editing or typing own) */}
      {isEditing && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3"
        >
          <div className="flex items-center justify-between text-xs text-[#8E9BB4]">
            <span>Message Composer ({session.channel.toUpperCase()})</span>
            <span className="text-[10px] text-white/50">User Review Required</span>
          </div>

          <Textarea
            value={userText}
            onChange={(e) => setUserText(e.target.value)}
            className="bg-[#0B0B14] border-white/20 text-white font-mono text-xs min-h-[100px]"
            placeholder="Type your message to the prospect..."
          />

          <div className="flex items-center justify-end gap-2">
            <Button
              onClick={() => setIsEditing(false)}
              variant="ghost"
              className="text-[#8E9BB4] text-xs h-8 uppercase"
            >
              Cancel
            </Button>

            <Button
              onClick={() => handleSendApproved(userText, true)}
              disabled={sending || !userText.trim()}
              className="cyan-gradient text-black font-extrabold uppercase text-xs h-8 px-4"
            >
              <Send className="w-3 h-3 mr-1" /> Send to Prospect
            </Button>
          </div>
        </motion.div>
      )}

      {/* Live Conversation Transcript */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold text-[#8E9BB4] uppercase tracking-wider">
          Conversation Transcript ({transcript.length} events)
        </h4>

        <div className="max-h-[280px] overflow-y-auto space-y-2.5 p-3 rounded-xl bg-[#0B0B14] border border-white/5 scrollbar-thin">
          {transcript.length === 0 ? (
            <p className="text-xs text-[#8E9BB4]/60 text-center py-4">
              Waiting for prospect response... AI will pop coaching tips the moment they engage.
            </p>
          ) : (
            transcript.map((msg, i) => {
              const isBuyer = msg.role === 'buyer';
              const isAi = msg.role === 'ai';

              return (
                <div
                  key={msg.id || i}
                  className={`p-3 rounded-lg text-xs leading-relaxed ${
                    isBuyer
                      ? 'bg-white/5 border border-white/10 text-white mr-8'
                      : isAi
                      ? 'bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-[#E8E8E8] ml-8'
                      : 'bg-[#FFD700]/10 border border-[#FFD700]/20 text-white ml-8'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-[#8E9BB4] mb-1 font-bold">
                    <span>
                      {isBuyer ? 'PROSPECT' : isAi ? 'AI ASSISTANT (AUTO)' : 'YOU (VERIFIED HUMAN)'}
                    </span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="whitespace-pre-line">{msg.content}</p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Phone Call Dashboard Modal Overlay */}
      {showCallModal && (
        <CallDashboard
          sessionId={session.id}
          lead={session.lead}
          onClose={() => setShowCallModal(false)}
        />
      )}
    </div>
  );
}
