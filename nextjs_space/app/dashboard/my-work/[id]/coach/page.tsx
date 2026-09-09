'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layouts/header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import {
  ArrowLeft,
  MessageSquare,
  Bot,
  User,
  Sparkles,
  Trophy,
  AlertCircle,
  CheckCircle2,
  Send,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface PitchTurn {
  id: string;
  ordinal: number;
  speaker: string;
  message: string;
  critique: string | null;
}

interface PitchSession {
  id: string;
  scenario: string;
  buyerPersona: any;
  turns: PitchTurn[];
  score: number | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
}

export default function CoachPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';

  const [session, setSession] = useState<PitchSession | null>(null);
  const [trend, setTrend] = useState<any>(null);
  const [revenueKit, setRevenueKit] = useState<any>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingTurn, setSubmittingTurn] = useState(false);
  const [scoring, setScoring] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/execution/${id}/coach`);
      if (!res.ok) return;
      const data = await res.json();
      setTrend(data.trend);
      setRevenueKit(data.revenueKit);
      if (data.session) {
        setSession(data.session);
      } else {
        startNewSession();
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const startNewSession = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/execution/${id}/coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });
      const data = await res.json();
      if (data.session) setSession(data.session);
    } catch {
      toast.error('Failed to start coach session');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchSession();
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.turns]);

  const handleSendTurn = async () => {
    if (!session || !inputMessage.trim() || submittingTurn) return;
    const msg = inputMessage.trim();
    setInputMessage('');
    setSubmittingTurn(true);

    try {
      const res = await fetch(`/api/execution/${id}/coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'turn',
          sessionId: session.id,
          message: msg,
        }),
      });
      const data = await res.json();
      if (data.session) {
        setSession(data.session);
      } else {
        toast.error(data.error || 'Failed to send turn');
      }
    } catch {
      toast.error('Network error communicating with coach');
    } finally {
      setSubmittingTurn(false);
    }
  };

  const handleFinishAndGrade = async () => {
    if (!session || scoring) return;
    setScoring(true);

    try {
      const res = await fetch(`/api/execution/${id}/coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'finish',
          sessionId: session.id,
        }),
      });
      const data = await res.json();
      if (data.session) {
        setSession(data.session);
        toast.success(`Pitch graded! Score: ${data.session.score}/100`);
      }
    } catch {
      toast.error('Failed to grade session');
    } finally {
      setScoring(false);
    }
  };

  const persona = session?.buyerPersona || {};

  return (
    <div className="min-h-screen bg-transparent text-white pb-20">
      <Header />
      <div className="max-w-[1260px] mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Navigation / Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <Link href={`/dashboard/my-work/${id}`}>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 rounded-lg border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.08] text-slate-300"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-cyan-400" />
                <h1 className="text-xl font-bold font-mono uppercase tracking-wider text-white">
                  AI Sales Pitch Practice Coach
                </h1>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {trend?.name} • Practice objection handling with zero risk
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={startNewSession}
              className="border-white/[0.1] text-xs font-mono text-slate-300 hover:text-white"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> New Session
            </Button>
            <Link href={`/dashboard/my-work/${id}/buyers`}>
              <Button
                size="sm"
                className="bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-mono font-bold"
              >
                Go to Real Buyers &rarr;
              </Button>
            </Link>
          </div>
        </div>

        {/* Persona Profile Card */}
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40 text-[10px] uppercase font-mono">
                Simulated Persona
              </Badge>
              <span className="font-bold text-sm text-white font-mono">{persona.name || 'Alex Miller'}</span>
              <span className="text-xs text-slate-400">({persona.role || 'Operations Lead'})</span>
            </div>
            <p className="text-xs text-slate-300 font-sans">
              <strong>Skepticism:</strong> {persona.skepticismLevel || 'Medium-High'} • <strong>Budget:</strong> {persona.budgetCapacity || '$200 - $1,500'}
            </p>
          </div>

          {session?.score ? (
            <div className="flex items-center gap-3 bg-black/50 px-4 py-2 rounded-xl border border-white/10">
              <Trophy className="w-6 h-6 text-amber-400" />
              <div>
                <div className="text-[10px] font-mono uppercase text-slate-400">Pitch Score</div>
                <div className="text-lg font-black font-mono text-emerald-400">{session.score}/100</div>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={handleFinishAndGrade}
              disabled={scoring || (session?.turns.length ?? 0) < 3}
              className="bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs"
            >
              {scoring ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Trophy className="w-3.5 h-3.5 mr-1.5" />}
              Grade My Pitch
            </Button>
          )}
        </div>

        {/* Evaluation Summary if graded */}
        {session?.score && (
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-emerald-500/30 bg-emerald-950/10">
              <CardContent className="p-4 space-y-2">
                <h4 className="text-xs font-mono font-bold uppercase text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Strong Techniques Used
                </h4>
                <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                  {(session.strengths as string[] || []).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-amber-500/30 bg-amber-950/10">
              <CardContent className="p-4 space-y-2">
                <h4 className="text-xs font-mono font-bold uppercase text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> Areas for Improvement
                </h4>
                <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                  {(session.weaknesses as string[] || []).map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Conversation Turns Stream */}
        <div className="space-y-4 max-w-3xl mx-auto">
          {session?.turns.map(turn => {
            const isUser = turn.speaker === 'user';
            return (
              <div key={turn.id} className="space-y-2">
                <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-mono ${
                      isUser
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div className={`max-w-xl space-y-1.5 ${isUser ? 'text-right' : ''}`}>
                    <div className="text-[10px] font-mono text-slate-400 uppercase">
                      {isUser ? 'You (Pitching)' : `${persona.name || 'Buyer'} (Prospect)`}
                    </div>
                    <div
                      className={`p-3.5 rounded-2xl text-xs font-sans leading-relaxed text-left ${
                        isUser
                          ? 'bg-cyan-600/20 border border-cyan-500/30 text-white'
                          : 'bg-white/[0.04] border border-white/[0.08] text-slate-200'
                      }`}
                    >
                      {turn.message}
                    </div>
                  </div>
                </div>

                {/* Instant Coach Critique box on User Turns */}
                {isUser && turn.critique && (
                  <div className="max-w-xl ml-auto mr-11 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-[11px] text-amber-200 leading-snug">
                      <strong className="font-mono text-amber-300 uppercase">Coach Tip: </strong>
                      {turn.critique}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="max-w-3xl mx-auto sticky bottom-4 bg-[#06060E]/90 backdrop-blur-xl p-3 rounded-2xl border border-white/[0.1] shadow-2xl">
          <div className="flex gap-2">
            <Textarea
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendTurn();
                }
              }}
              placeholder="Type your pitch response, address objections, or state your price..."
              className="bg-black/50 border-white/[0.1] text-xs text-white min-h-[50px] resize-none"
            />
            <Button
              onClick={handleSendTurn}
              disabled={submittingTurn || !inputMessage.trim()}
              className="bg-cyan-500 hover:bg-cyan-400 text-black px-4 h-auto font-mono font-bold text-xs"
            >
              {submittingTurn ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2 px-1 text-[10px] font-mono text-slate-400">
            <span>Press Enter to send pitch</span>
            <span>AI Coach evaluates each turn in real time</span>
          </div>
        </div>
      </div>
    </div>
  );
}
