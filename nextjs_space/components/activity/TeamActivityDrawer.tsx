'use client';

import { useEffect, useRef, useState } from 'react';

export interface FeedEntry { id: string; kind: string; taskId: string; text: string; timestamp: string; hash: string | null; approvalId?: string | null; }

interface DrawerProps { taskId?: string; autoOpen?: boolean; }

function byTimestampAsc(a: FeedEntry, b: FeedEntry) {
  const t = a.timestamp.localeCompare(b.timestamp);
  return t !== 0 ? t : a.id.localeCompare(b.id);
}

export function TeamActivityDrawer({ taskId, autoOpen }: DrawerProps) {
  const [open, setOpen] = useState(autoOpen ?? false);
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [isLive, setIsLive] = useState(true);
  const [unread, setUnread] = useState(0);
  const [approving, setApproving] = useState<Record<string, boolean>>({});
  const [approved, setApproved] = useState<Record<string, boolean>>({});
  const openRef = useRef(open);
  openRef.current = open;

  // Auto-open on first mount when embedded with autoOpen + taskId.
  useEffect(() => {
    if (autoOpen && taskId) setOpen(true);
  }, [autoOpen, taskId]);

  const upsert = (incoming: FeedEntry[]) => {
    setEntries((prev) => {
      const seen = new Set(prev.map((e) => e.id));
      const next = [...prev];
      for (const e of incoming) {
        if (!e?.id || seen.has(e.id)) continue;
        seen.add(e.id);
        next.push(e);
      }
      next.sort(byTimestampAsc);
      return next;
    });
  };

  // Initial + fallback load keeps data.entries key compat with /api/activity/feed.
  useEffect(() => {
    let dead = false;
    const load = async () => {
      const q = taskId ? `?taskId=${taskId}` : '';
      try {
        const res = await fetch(`/api/activity/feed${q}`, { cache: 'no-store' });
        const data = await res.json();
        if (!dead && data.success && Array.isArray(data.entries)) {
          if (!openRef.current) {
            setEntries((prev) => {
              const known = new Set(prev.map((e) => e.id));
              const fresh = data.entries.filter((e: FeedEntry) => !known.has(e.id));
              if (fresh.length > 0) setUnread((u) => u + fresh.length);
              return [...prev, ...fresh].sort(byTimestampAsc);
            });
          } else {
            upsert(data.entries);
          }
        }
      } catch {}
    };
    load();
    if (!isLive) return () => { dead = true; };
    const t = setInterval(load, 3500);
    return () => { dead = true; clearInterval(t); };
  }, [open, taskId, isLive]);

  // Single live SSE subscription per taskId replaces triple polling.
  useEffect(() => {
    if (!isLive || typeof EventSource === 'undefined') return;
    const url = `/api/activity/stream?taskId=${taskId ?? ''}`;
    const es = new EventSource(url);
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data?.nextCursor !== undefined && !data?.id) return; // cursor event
        const entry = data as FeedEntry;
        if (!entry?.id) return;
        if (!openRef.current) setUnread((u) => u + 1);
        upsert([entry]);
      } catch {}
    };
    return () => es.close();
  }, [taskId, isLive]);

  const sorted = [...entries].sort(byTimestampAsc);
  const latest = sorted.length > 0 ? sorted[sorted.length - 1] : null;

  const handleApprove = async (entry: FeedEntry) => {
    const approvalId = entry.approvalId ?? entry.id;
    setApproving((m) => ({ ...m, [entry.id]: true }));
    try {
      // Existing gate: POST /api/approvals/approve { approvalId } (no /api/tasks/[id]/approve route exists).
      const res = await fetch('/api/approvals/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalId }),
      });
      if (res.ok) setApproved((m) => ({ ...m, [entry.id]: true }));
    } catch {} finally {
      setApproving((m) => ({ ...m, [entry.id]: false }));
    }
  };

  const handleOpen = () => { setOpen(true); setUnread(0); };

  if (!open) {
    return (
      <button onClick={handleOpen} className="fixed bottom-4 right-4 z-50 px-4 py-2 rounded-full bg-cyan-400 text-black font-mono text-xs font-bold max-w-xs truncate">
        Team feed{unread > 0 ? ` · ${unread} unread` : ''}{latest ? ` · ${latest.text.slice(0, 60)}` : ''}
      </button>
    );
  }
  const shown = sorted.filter((e) => filter === 'ALL' ? true : e.kind.toLowerCase().includes(filter.toLowerCase().slice(0, 4)));
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
        {shown.length === 0 ? <p className="text-[11px] text-white/40">No activity yet. Run a task to see the team talk.</p> : shown.map((e) => {
          const isApproval = e.kind.toLowerCase().includes('approv');
          return (
            <div key={e.id} className="rounded-lg border border-white/10 p-2">
              <div className="text-[9px] font-mono text-white/40">{e.kind} · {new Date(e.timestamp).toLocaleTimeString()} · #{(e.hash || '').slice(0, 8)}</div>
              <div className="text-[11px] text-white/90">{e.text}</div>
              {isApproval && (
                approved[e.id] ? (
                  <div className="text-[10px] font-mono text-green-400 mt-1">Approved</div>
                ) : (
                  <button
                    disabled={!!approving[e.id]}
                    onClick={() => handleApprove(e)}
                    className="mt-1 text-[10px] font-mono font-bold px-2 py-1 rounded bg-cyan-400 text-black disabled:opacity-50"
                  >
                    {approving[e.id] ? 'Approving…' : 'Approve'}
                  </button>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Plan interface alias: single unified live drawer per task.
export const UnifiedTaskDrawer = TeamActivityDrawer;
