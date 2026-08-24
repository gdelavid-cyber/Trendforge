'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Inbox, RefreshCw, XCircle } from 'lucide-react';

interface ApprovalRow {
  id: string;
  stepIndex: number;
  status: string;
  action: { title?: string; description?: string; action?: string };
  createdAt: string;
  reviewedAt?: string | null;
  userTask: { task: { title: string }; mode: string | null };
}

export function ApprovalsClient() {
  const [pending, setPending] = useState<ApprovalRow[]>([]);
  const [history, setHistory] = useState<ApprovalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/approvals/list', { cache: 'no-store' });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to load approvals');
      setPending(body.pending ?? []);
      setHistory(body.history ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const review = async (approvalId: string, decision: 'approve' | 'reject') => {
    setBusyId(approvalId);
    setError(null);
    try {
      const res = await fetch(`/api/approvals/${decision}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || `Failed to ${decision}`);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="relative max-w-[1000px] mx-auto px-4 pt-12 pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-orbitron font-black text-3xl tracking-wider text-white">
            APPROVAL <span className="text-[#00F0FF]">INBOX</span>
          </h1>
          <p className="text-xs font-mono text-[#8E9BB4] mt-2 uppercase tracking-widest">
            Your companion pauses here. One click sends it forward.
          </p>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-lg border border-white/10 bg-white/[0.03] text-[#8E9BB4] hover:text-white transition-colors"
          aria-label="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-xs font-mono p-3">
          {error}
        </div>
      )}

      {/* Pending */}
      <h2 className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/40 mb-3">
        Pending ({pending.length})
      </h2>
      {loading ? (
        <div className="text-sm font-mono text-[#8E9BB4] py-8">Loading…</div>
      ) : pending.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
          <Inbox className="w-8 h-8 text-[#00F0FF]/50 mx-auto mb-3" />
          <p className="text-sm font-mono text-[#8E9BB4]">
            Nothing waiting. Launch a task in Autopilot and gates will land here.
          </p>
        </div>
      ) : (
        <div className="space-y-3 mb-12">
          {pending.map((a) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-[#00F0FF]/20 bg-[#00F0FF]/[0.04] p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#00F0FF]/70 mb-1">
                    Step {a.stepIndex + 1} · {a.action.action ?? 'action'} · {a.userTask.mode ?? 'AUTOPILOT'}
                  </div>
                  <div className="font-bold text-white truncate">{a.action.title}</div>
                  <div className="text-xs font-mono text-[#8E9BB4] mt-1 truncate">
                    Task: {a.userTask.task.title}
                  </div>
                  {a.action.description && (
                    <p className="text-xs text-[#8E9BB4] mt-2 line-clamp-2">{a.action.description}</p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <button
                    disabled={busyId === a.id}
                    onClick={() => review(a.id, 'approve')}
                    className="px-3 py-2 rounded-lg text-xs font-mono font-bold uppercase bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] hover:bg-[#00F0FF]/25 disabled:opacity-50 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> Approve
                  </button>
                  <button
                    disabled={busyId === a.id}
                    onClick={() => review(a.id, 'reject')}
                    className="px-3 py-2 rounded-lg text-xs font-mono uppercase border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5 inline mr-1" /> Reject
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <>
          <h2 className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/40 mb-3">
            Recently reviewed
          </h2>
          <div className="space-y-2">
            {history.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
              >
                <span className="text-xs font-mono text-[#8E9BB4] truncate pr-4">
                  {a.action.title} · {a.userTask.task.title}
                </span>
                <span
                  className={`text-[10px] font-mono uppercase tracking-wider shrink-0 ${
                    a.status === 'APPROVED' ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
