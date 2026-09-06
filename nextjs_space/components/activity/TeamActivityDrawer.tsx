'use client';

import { useEffect, useState } from 'react';

export interface FeedEntry { id: string; kind: string; taskId: string; text: string; timestamp: string; hash: string | null; }

export function TeamActivityDrawer({ taskId }: { taskId?: string }) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    if (!open) return;
    let dead = false;
    const load = async () => {
      const q = taskId ? `?taskId=${taskId}` : '';
      const res = await fetch(`/api/activity/feed${q}`, { cache: 'no-store' });
      const data = await res.json();
      if (!dead && data.success) setEntries(data.entries);
    };
    load();
    if (!isLive) return () => { dead = true; };
    const t = setInterval(load, 3500);
    return () => { dead = true; clearInterval(t); };
  }, [open, taskId, isLive]);

  if (!open) return <button onClick={() => setOpen(true)} className="fixed bottom-4 right-4 z-50 px-4 py-2 rounded-full bg-cyan-400 text-black font-mono text-xs font-bold">Team feed</button>;
  const shown = entries.filter((e) => filter === 'ALL' ? true : e.kind.toLowerCase().includes(filter.toLowerCase().slice(0, 4)));
  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[70vh] overflow-y-auto rounded-2xl border border-white/10 bg-black/90 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono font-bold text-white uppercase">Team activity</span>
        <div className="flex gap-2">
          <button onClick={() => setIsLive((v) => !v)} className="text-[10px] font-mono text-cyan-300">{isLive ? 'LIVE' : 'PAUSED'}</button>
          <button onClick={() => setOpen(false)} className="text-[10px] font-mono text-white/50">Close</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mb-2">
        {['ALL', 'MILESTONES', 'LEADS', 'OUTREACH', 'SALES', 'APPROVALS', 'VALIDATION'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={filter === f ? 'text-[10px] font-mono text-cyan-300 font-bold' : 'text-[10px] font-mono text-white/50'}>{f}</button>
        ))}
      </div>
      <div className="space-y-2">
        {shown.length === 0 ? <p className="text-[11px] text-white/40">No activity yet. Run a task to see the team talk.</p> : shown.map((e) => (
          <div key={e.id} className="rounded-lg border border-white/10 p-2">
            <div className="text-[9px] font-mono text-white/40">{e.kind} · {new Date(e.timestamp).toLocaleTimeString()} · #{(e.hash || '').slice(0, 8)}</div>
            <div className="text-[11px] text-white/90">{e.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
