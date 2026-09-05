'use client';

import { useEffect, useState } from 'react';
import { Bot, Send, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { VoiceInput } from '@/components/chat/VoiceInput';

// N4 Nova OS console: briefing + chat + approvals + tasks in one surface.
// Same endpoints as the widget; page-sized and voice-capable.

interface Msg {
  id: string;
  sender: 'user' | 'nova';
  text: string;
}

export function NovaConsole({ displayName }: { displayName: string }) {
  const [messages, setMessages] = useState<Msg[]>([
    { id: 'w', sender: 'nova', text: `Good to see you, ${displayName}. This console is your interface to the whole system — your live position is on the left, your words go below, and anything I propose waits for your approval on the right.` },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [briefing, setBriefing] = useState<any | null>(null);
  const [actions, setActions] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);

  const refresh = async () => {
    try {
      const [b, a, t] = await Promise.all([
        fetch('/api/nova/briefing').then((r) => r.json()).catch(() => null),
        fetch('/api/nova/actions').then((r) => r.json()).catch(() => null),
        fetch('/api/nova/tasks').then((r) => r.json()).catch(() => null),
      ]);
      if (b?.ok) setBriefing(b.briefing);
      if (a?.ok) {
        setActions(a.actions);
        setTools(a.tools);
      }
      if (t?.ok) setTasks(t.tasks);
    } catch {}
  };

  useEffect(() => {
    refresh();
  }, []);

  const send = async (text: string) => {
    const clean = text.trim();
    if (!clean || loading) return;
    setMessages((p) => [...p, { id: `u-${Date.now()}`, sender: 'user', text: clean }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/nova/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: clean }),
      });
      const data = await res.json();
      setMessages((p) => [
        ...p,
        { id: `n-${Date.now()}`, sender: 'nova', text: data.ok ? data.reply : data.error ?? 'Something went wrong.' },
      ]);
      if (data.warning) toast.warning(data.warning);
    } catch {
      setMessages((p) => [...p, { id: `n-${Date.now()}`, sender: 'nova', text: 'Network error reaching Nova.' }]);
    } finally {
      setLoading(false);
      refresh();
    }
  };

  const decide = async (id: string, decision: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/nova/actions/${id}/${decision}`, { method: 'POST' });
      const data = await res.json();
      if (data.ok || data.status === 'EXECUTED') {
        toast.success(decision === 'approve' ? 'Executed — receipt recorded below.' : 'Rejected.');
        if (data.receipt) {
          setMessages((p) => [...p, { id: `n-${Date.now()}`, sender: 'nova', text: `Done. Receipt: ${JSON.stringify(data.receipt)}` }]);
        }
      } else {
        toast.error(data.error ?? 'Decision failed');
      }
      refresh();
    } catch {
      toast.error('Decision failed');
    }
  };

  const pending = actions.filter((a) => a.status === 'PROPOSED');
  const decided = actions.filter((a) => a.status !== 'PROPOSED').slice(0, 8);

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#38bdf8]/15 border border-[#38bdf8]/40 flex items-center justify-center text-[#38bdf8]">
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white font-mono">NOVA · TRENDLY OS</h1>
          <p className="text-xs text-[#8E9BB4] font-mono">Your interface to the entire system. Nothing runs without your approval.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: live position */}
        <div className="space-y-4">
          <div className="glass-card p-5">
            <div className="text-[10px] text-[#8E9BB4] uppercase tracking-widest font-mono mb-3">Live position</div>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between"><span className="text-[#8E9BB4]">Ledger income</span><span className="text-white">${briefing?.wallet.available ? Number(briefing.wallet.realIncomeUsdc ?? 0).toFixed(2) : '—'}</span></div>
              <div className="flex justify-between"><span className="text-[#8E9BB4]">Credits</span><span className="text-white">{briefing?.credits.available ? `${briefing.credits.balance}/${briefing.credits.allocation}` : '—'}</span></div>
              <div className="flex justify-between"><span className="text-[#8E9BB4]">Agents</span><span className="text-white">{briefing?.wallet.available ? `${briefing.wallet.fundedAgents ?? 0}/${briefing.wallet.agents ?? 0} funded` : '—'}</span></div>
              <div className="flex justify-between"><span className="text-[#8E9BB4]">Swarm</span><span className="text-white">{briefing?.swarm.available ? briefing.swarm.status : '—'}</span></div>
            </div>
          </div>
          <div className="glass-card p-5">
            <div className="text-[10px] text-[#8E9BB4] uppercase tracking-widest font-mono mb-3">Insights</div>
            {!briefing && <div className="text-xs text-[#8E9BB4] font-mono">Loading…</div>}
            {briefing?.insights?.length === 0 && <div className="text-xs text-[#8E9BB4] font-mono">All quiet. Nothing needs you.</div>}
            {briefing?.insights?.map((ins: any, i: number) => (
              <div key={i} className={`mb-2 text-xs font-mono px-3 py-2 rounded-xl border ${ins.level === 'alert' ? 'text-red-300 border-red-400/30 bg-red-400/5' : ins.level === 'warning' ? 'text-amber-200 border-amber-400/30 bg-amber-400/5' : 'text-[#38bdf8] border-[#38bdf8]/20 bg-[#38bdf8]/5'}`}>
                {ins.text}
              </div>
            ))}
          </div>
          <div className="glass-card p-5">
            <div className="text-[10px] text-[#8E9BB4] uppercase tracking-widest font-mono mb-3">What Nova can do</div>
            {tools.map((t: any) => (
              <div key={t.name} className="flex justify-between items-center py-1.5 border-b border-white/[0.05] last:border-0">
                <span className="text-xs text-white font-mono">{t.name}</span>
                <span className="text-[10px] text-[#8E9BB4] font-mono">{t.requiresApproval ? 'approval' : `${t.creditCost} cr`}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Center: conversation */}
        <div className="glass-card p-5 flex flex-col min-h-[540px]">
          <div className="text-[10px] text-[#8E9BB4] uppercase tracking-widest font-mono mb-3">Conversation</div>
          <div className="flex-1 space-y-3 overflow-y-auto text-sm max-h-[560px]">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] p-3 rounded-2xl leading-relaxed ${m.sender === 'user' ? 'bg-[#38bdf8] text-black font-medium' : 'bg-white/[0.04] text-[#f8fafc] border border-white/10'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <div className="text-xs text-[#38bdf8] font-mono">Nova is thinking…</div>}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send(input)}
              placeholder="Ask about your position, propose an action, ask why…"
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#8E9BB4] focus:outline-none focus:border-[#38bdf8]"
            />
            <VoiceInput onTranscript={(t) => send(t)} isListening={listening} setIsListening={setListening} />
            <Button size="sm" onClick={() => send(input)} disabled={!input.trim() || loading} className="h-10 w-10 p-0 bg-[#38bdf8] hover:bg-[#38bdf8]/90 text-black rounded-xl">
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="mt-2 text-[10px] text-[#8E9BB4] font-mono">
            {listening ? 'Listening — speak now.' : 'Type, or use the mic. Billed 2 credits per message.'}
          </div>
        </div>

        {/* Right: approvals + tasks */}
        <div className="space-y-4">
          <div className="glass-card p-5">
            <div className="text-[10px] text-[#8E9BB4] uppercase tracking-widest font-mono mb-3">Awaiting decision ({pending.length})</div>
            {pending.length === 0 && <div className="text-xs text-[#8E9BB4] font-mono">Nothing waiting. Proposals land here — nothing runs until you approve it.</div>}
            {pending.map((a: any) => (
              <div key={a.id} className="mb-2 p-3 rounded-xl bg-black/40 border border-[#38bdf8]/20">
                <div className="text-xs font-bold text-white font-mono">{a.tool}</div>
                <div className="text-[11px] text-[#8E9BB4] font-mono break-all">{JSON.stringify(a.params)}</div>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={() => decide(a.id, 'approve')} className="bg-[#00FF66] text-black text-[10px] font-bold uppercase h-7">Approve & run</Button>
                  <Button size="sm" onClick={() => decide(a.id, 'reject')} className="bg-transparent border border-white/20 text-white text-[10px] font-bold uppercase h-7">Reject</Button>
                </div>
              </div>
            ))}
            {decided.length > 0 && (
              <div className="mt-3">
                <div className="text-[10px] text-[#8E9BB4] uppercase tracking-widest font-mono mb-2">Recent</div>
                {decided.map((a: any) => (
                  <div key={a.id} className="flex justify-between py-1 text-[11px] font-mono border-b border-white/[0.05] last:border-0">
                    <span className="text-white">{a.tool}</span>
                    <span className={a.status === 'EXECUTED' ? 'text-[#00FF66]' : a.status === 'FAILED' ? 'text-red-300' : 'text-[#8E9BB4]'}>{a.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="glass-card p-5">
            <div className="text-[10px] text-[#8E9BB4] uppercase tracking-widest font-mono mb-3">Background tasks ({tasks.length})</div>
            {tasks.slice(0, 6).map((t: any) => (
              <div key={t.id} className="flex justify-between py-1 text-[11px] font-mono border-b border-white/[0.05] last:border-0">
                <span className="text-white truncate mr-2">{t.title}</span>
                <span className="text-[#8E9BB4]">{t.status}</span>
              </div>
            ))}
            {tasks.length === 0 && <div className="text-xs text-[#8E9BB4] font-mono">No monitors yet. Ask Nova to set one up.</div>}
          </div>
          <div className="p-1 flex items-center gap-2 text-[11px] text-[#8E9BB4] font-mono">
            <Mic className="w-3.5 h-3.5" /> Voice in place — speech becomes chat text.
          </div>
        </div>
      </div>
    </div>
  );
}
