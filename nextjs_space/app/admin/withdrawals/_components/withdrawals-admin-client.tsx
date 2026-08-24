'use client';

import { useState } from 'react';
import { ArrowUpFromLine, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Row {
  id: string;
  agentName: string;
  agentBalance: number;
  userName: string;
  userEmail: string;
  amountUsdc: number;
  destination: string;
  status: string;
  createdAt: string;
}

export function WithdrawalsAdminClient({ requests: initial }: { requests: Row[] }) {
  const [requests, setRequests] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);

  const review = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
    setBusyId(id);
    try {
      const res = await fetch('/api/admin/withdrawals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, decision }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Withdrawal ${decision.toLowerCase()}.`);
        setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: decision } : r)));
      } else {
        toast.error(data.error || 'Review failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setBusyId(null);
    }
  };

  const pending = requests.filter((r) => r.status === 'PENDING');
  const reviewed = requests.filter((r) => r.status !== 'PENDING');

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-8 space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-mono mb-2">
          <ArrowUpFromLine className="w-3.5 h-3.5" />
          REAL MONEY // ADMIN REVIEW QUEUE
        </div>
        <h1 className="font-orbitron text-2xl md:text-4xl font-black uppercase tracking-wider text-white">
          Withdrawal <span className="gold-gradient-text">Requests</span>
        </h1>
        <p className="text-xs text-[#8E9BB4] mt-1 font-mono">
          Approving debits the agent ledger (WITHDRAWAL entry) and marks the request paid-out manually in v1.
        </p>
      </div>

      {pending.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <p className="text-xs text-[#8E9BB4] font-mono uppercase">Queue clear — no pending withdrawals.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((r) => (
            <div key={r.id} className="glass-card border border-white/10 rounded-xl p-5 flex flex-wrap items-center gap-4 justify-between">
              <div className="min-w-0">
                <div className="text-sm font-bold text-white font-mono">
                  ${r.amountUsdc.toFixed(2)} USDC → <span className="text-[#00F0FF]">{r.agentName}</span>
                </div>
                <div className="text-[10px] text-[#8E9BB4] font-mono mt-0.5 truncate max-w-md">
                  {r.userName} ({r.userEmail}) → dest {r.destination}
                </div>
                <div className="text-[10px] text-[#8E9BB4] font-mono mt-0.5">
                  Agent balance now: ${r.agentBalance.toFixed(2)} · requested {new Date(r.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={() => review(r.id, 'APPROVED')}
                  disabled={busyId === r.id || r.agentBalance < r.amountUsdc}
                  className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold uppercase h-8"
                >
                  {busyId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5 mr-1" />}
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => review(r.id, 'REJECTED')}
                  disabled={busyId === r.id}
                  className="border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-bold uppercase h-8"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {reviewed.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-mono uppercase text-[#8E9BB4] tracking-widest">Recently reviewed</h2>
          {reviewed.slice(0, 10).map((r) => (
            <div key={r.id} className="flex items-center justify-between glass-card rounded-lg px-4 py-2 border border-white/5">
              <span className="text-[11px] font-mono text-[#8E9BB4] truncate">
                ${r.amountUsdc.toFixed(2)} · {r.agentName} · {new Date(r.createdAt).toLocaleDateString()}
              </span>
              <span className={`text-[10px] font-mono font-bold ${r.status === 'APPROVED' ? 'text-green-400' : 'text-red-400'}`}>
                {r.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
