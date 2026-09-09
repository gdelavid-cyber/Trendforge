'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/layout/header';
import { Loader2, Send, RefreshCw, Trophy, MessageSquare } from 'lucide-react';

const SCENARIOS = [
  { key: 'cold_reply', label: '🧊 Cold Reply', desc: 'They replied to your outreach — now what?' },
  { key: 'discovery_call', label: '📞 Discovery Call', desc: 'You got the call. Open strong.' },
  { key: 'price_objection', label: '💰 Price Pushback', desc: 'They love it but choke on the price.' },
];

interface Turn {
  ordinal: number;
  speaker: 'user' | 'buyer_bot';
  message: string;
  critique?: string;
}

export default function CoachPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
  const executionId = id;
  const [scenario, setScenario] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [persona, setPersona] = useState<any>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [finalScore, setFinalScore] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), [turns]);

  const start = async (s: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/coach/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executionId, scenario: s }),
      });
      const data = await res.json();
      setSessionId(data.sessionId);
      setPersona(data.buyerPersona);
      setTurns([{ ordinal: 0, speaker: 'buyer_bot', message: data.opener }]);
      setScenario(s);
    } catch (err) {
      console.error('Failed to start session', err);
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    if (!input.trim() || !sessionId || loading) return;
    const myMessage = input.trim();
    setInput('');
    setTurns(prev => [...prev, { ordinal: prev.length, speaker: 'user', message: myMessage }]);
    setLoading(true);

    try {
      const res = await fetch('/api/coach/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: myMessage }),
      });
      const data = await res.json();

      setTurns(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], critique: data.critique };
        updated.push({ ordinal: updated.length, speaker: 'buyer_bot', message: data.buyerReply });
        return updated;
      });
    } catch (err) {
      console.error('Failed to send reply', err);
    } finally {
      setLoading(false);
    }
  };

  const finish = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/coach/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      setFinalScore(await res.json());
    } catch (err) {
      console.error('Failed to finish session', err);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setScenario(null);
    setSessionId(null);
    setPersona(null);
    setTurns([]);
    setFinalScore(null);
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <Header title="Pitch Coach" subtitle="AI plays a real buyer. You practice. You get scored." />

      <div className="p-6 max-w-4xl mx-auto">
        {!scenario && (
          <div className="grid md:grid-cols-3 gap-4">
            {SCENARIOS.map(s => (
              <Card
                key={s.key}
                className="hover:border-[#00F0FF]/50 hover:shadow-[0_0_20px_rgba(0,240,255,0.15)] cursor-pointer transition-all bg-card/40 backdrop-blur-sm"
                onClick={() => start(s.key)}
              >
                <CardContent className="p-5">
                  <p className="font-semibold text-base text-foreground font-display">{s.label}</p>
                  <p className="text-xs text-muted-foreground mt-2">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {scenario && !finalScore && (
          <>
            {persona && (
              <Card className="mb-4 border-cyan-500/30 bg-cyan-500/5">
                <CardContent className="p-3.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-muted-foreground">Practicing against: </span>
                    <span className="font-medium text-foreground">{persona.name}, {persona.role}</span>
                    <span className="text-muted-foreground"> · {persona.mood} · {persona.communication_style}</span>
                  </div>
                  <Badge variant="cyber-blue" className="text-[9px] uppercase font-mono">{scenario}</Badge>
                </CardContent>
              </Card>
            )}

            <div className="space-y-3 mb-4 min-h-[400px]">
              {turns.map((t, i) => (
                <div key={i} className={`flex ${t.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[80%] space-y-1">
                    <div className={`rounded-xl px-4 py-3 text-sm ${t.speaker === 'user' ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-100' : 'bg-muted/60 text-foreground border border-border/50'}`}>
                      {t.message}
                    </div>
                    {t.critique && (
                      <p className="text-[11px] text-amber-400 italic px-1">💡 {t.critique}</p>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-[#00F0FF]" />
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="flex gap-2 sticky bottom-4 bg-background/90 backdrop-blur-md py-3 border-t border-border/40">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
                placeholder="Type your response to the prospect..."
                disabled={loading}
                className="flex-1"
              />
              <Button variant="cyber" onClick={send} disabled={loading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={finish} disabled={loading || turns.length < 3}>
                <Trophy className="h-4 w-4 mr-1" /> Finish & score
              </Button>
            </div>
          </>
        )}

        {finalScore && (
          <Card className="border-emerald-500/40 bg-card/60 backdrop-blur-md shadow-[0_0_30px_rgba(16,185,129,0.15)]">
            <CardContent className="p-6 space-y-5">
              <div className="text-center">
                <p className="text-[11px] text-muted-foreground uppercase font-mono tracking-wider">Your pitch score</p>
                <p className="text-5xl font-extrabold text-[#00F0FF] my-2">{finalScore.score}/100</p>
                <Badge variant={finalScore.would_this_close ? 'cyber' : 'cyber-yellow'} className="mt-1">
                  {finalScore.would_this_close ? '✅ This would close' : '⚠️ Would not close as-is'}
                </Badge>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <p className="text-xs font-semibold text-emerald-400 mb-2">What worked</p>
                  <ul className="text-xs space-y-1.5 text-muted-foreground">
                    {finalScore.strengths?.map((s: string, i: number) => <li key={i} className="flex items-start gap-1.5"><span className="text-emerald-400">✓</span> {s}</li>)}
                  </ul>
                </div>
                <div className="p-3.5 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <p className="text-xs font-semibold text-amber-400 mb-2">Fix these</p>
                  <ul className="text-xs space-y-1.5 text-muted-foreground">
                    {finalScore.weaknesses?.map((w: string, i: number) => <li key={i} className="flex items-start gap-1.5"><span className="text-amber-400">→</span> {w}</li>)}
                  </ul>
                </div>
              </div>

              {finalScore.one_thing_to_fix && (
                <div className="p-3.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                  <p className="text-xs font-semibold text-cyan-400 mb-1">The one thing to fix:</p>
                  <p className="text-sm text-foreground">{finalScore.one_thing_to_fix}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="cyber" className="flex-1" onClick={reset}>
                  <RefreshCw className="h-3 w-3 mr-1" /> Practice again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
