'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export function AckGate({ approvalId, title, onDecided }: { approvalId: string; title: string; onDecided: () => void }) {
  const [busy, setBusy] = useState(false);
  const decide = async (path: 'approve' | 'reject') => {
    setBusy(true);
    try {
      const res = await fetch(`/api/approvals/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ approvalId }) });
      const data = await res.json();
      if (data.success || res.ok) toast.success(`Decision recorded: ${path}.`);
      else toast.error(data.error || 'Decision failed.');
      onDecided();
    } catch {
      toast.error('Network error recording decision.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3">
      <div className="text-[11px] font-mono font-bold text-amber-300 uppercase">Needs one click: {title}</div>
      <div className="mt-2 flex gap-2">
        <button disabled={busy} onClick={() => decide('approve')} className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-[11px] font-mono font-bold">Approve</button>
        <button disabled={busy} onClick={() => decide('reject')} className="px-3 py-1 rounded-full bg-white/5 text-white/70 text-[11px] font-mono">Reject</button>
      </div>
    </div>
  );
}
