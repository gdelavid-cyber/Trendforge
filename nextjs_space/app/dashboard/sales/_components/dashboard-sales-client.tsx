'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Shield,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  Download,
  AlertTriangle,
  Layers,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SaleRecord {
  id: string;
  taskId: string;
  task?: { id: string; title: string; category: string };
  lead?: { buyerName: string; source: string; sourceUrl: string } | null;
  buyerName: string;
  buyerEmail: string;
  buyerPlatform: string;
  productDelivered: string;
  saleAmountCents: number;
  platformFeeCents: number;
  userPayoutCents: number;
  escrowStatus: 'PENDING' | 'HELD' | 'RELEASED' | 'DISPUTED' | 'REFUNDED';
  deliveredAt: string | null;
  releasedAt: string | null;
  proofArtifacts: string[];
  loggedBy: string;
  createdAt: string;
}

interface Props {
  initialSales: SaleRecord[];
  isKycVerified: boolean;
}

export function DashboardSalesClient({ initialSales, isKycVerified }: Props) {
  const [sales, setSales] = useState<SaleRecord[]>(initialSales);
  const [filter, setFilter] = useState<string>('ALL');
  const [releasingId, setReleasingId] = useState<string | null>(null);

  const totalGross = sales.reduce((acc, s) => acc + s.saleAmountCents, 0);
  const totalNet = sales.filter((s) => s.escrowStatus === 'RELEASED').reduce((acc, s) => acc + s.userPayoutCents, 0);
  const totalEscrow = sales.filter((s) => s.escrowStatus === 'HELD' || s.escrowStatus === 'PENDING').reduce((acc, s) => acc + s.userPayoutCents, 0);
  const totalFees = sales.reduce((acc, s) => acc + s.platformFeeCents, 0);

  const filteredSales = sales.filter((s) => {
    if (filter === 'ALL') return true;
    if (filter === 'RELEASED') return s.escrowStatus === 'RELEASED';
    if (filter === 'HELD') return s.escrowStatus === 'HELD' || s.escrowStatus === 'PENDING';
    return true;
  });

  const handleReleaseEscrow = async (saleId: string) => {
    setReleasingId(saleId);
    try {
      const res = await fetch(`/api/sales/${saleId}/escrow/release`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Escrow payout released successfully!');
        setSales((prev) =>
          prev.map((s) => (s.id === saleId ? { ...s, escrowStatus: 'RELEASED', releasedAt: new Date().toISOString() } : s))
        );
      } else {
        toast.error(data.error || 'Failed to release escrow');
      }
    } catch (e) {
      toast.error('Network error releasing escrow');
    } finally {
      setReleasingId(null);
    }
  };

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-8 space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-white/50 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <DollarSign className="w-7 h-7 text-green-400" />
            <span>Sales & Escrow Ledger</span>
          </h1>
          <p className="text-xs font-mono text-white/50 mt-1">
            Real-time settlement records, escrow custody status, and verified delivery proofs.
          </p>
        </div>

        <Link href="/tasks">
          <Button size="sm" className="liquid-glass-strong text-white font-mono text-xs rounded-full px-5 h-9 font-bold hover:scale-105 transition-transform">
            <span>Explore New Power Moves →</span>
          </Button>
        </Link>
      </div>

      {/* KYC Compliance Alert Banner */}
      {!isKycVerified && totalGross > 30000 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-start gap-3 text-xs font-mono text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-amber-400 uppercase">Compliance Notice: Tier 2 Payouts ($500+)</div>
            <p className="text-[11px] text-amber-200/80 leading-relaxed font-sans">
              To withdraw cumulative earnings exceeding $500.00, please complete the standard one-time compliance terms.
            </p>
            <Link href="/compliance" className="inline-block text-[#00F0FF] underline font-bold mt-1">
              Complete Compliance Agreement →
            </Link>
          </div>
        </div>
      )}

      {/* Financial Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="liquid-glass rounded-3xl p-5 space-y-1">
          <div className="text-[10px] font-mono text-white/50 uppercase">Total Gross Sales</div>
          <div className="text-2xl font-bold text-white font-mono">${(totalGross / 100).toFixed(2)}</div>
          <div className="text-[10px] font-mono text-white/40">{sales.length} transactions</div>
        </div>

        <div className="liquid-glass rounded-3xl p-5 space-y-1">
          <div className="text-[10px] font-mono text-green-400 uppercase">Net Payouts Settled</div>
          <div className="text-2xl font-bold text-green-400 font-mono">${(totalNet / 100).toFixed(2)}</div>
          <div className="text-[10px] font-mono text-green-400/60">Credited to wallet</div>
        </div>

        <div className="liquid-glass rounded-3xl p-5 space-y-1">
          <div className="text-[10px] font-mono text-[#00F0FF] uppercase">Held in Escrow</div>
          <div className="text-2xl font-bold text-[#00F0FF] font-mono">${(totalEscrow / 100).toFixed(2)}</div>
          <div className="text-[10px] font-mono text-[#00F0FF]/60">Awaiting delivery check</div>
        </div>

        <div className="liquid-glass rounded-3xl p-5 space-y-1">
          <div className="text-[10px] font-mono text-white/50 uppercase">Platform Fees (10%)</div>
          <div className="text-2xl font-bold text-white/70 font-mono">${(totalFees / 100).toFixed(2)}</div>
          <div className="text-[10px] font-mono text-white/40">Protocol maintenance</div>
        </div>
      </div>

      {/* Sales Records Feed */}
      <div className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
          <h3 className="text-lg font-bold text-white">Transaction Provenance Log</h3>

          <div className="flex items-center gap-2 text-xs font-mono">
            {['ALL', 'RELEASED', 'HELD'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full transition-all ${
                  filter === f
                    ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40 font-bold'
                    : 'bg-white/5 text-white/50 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {filteredSales.length === 0 ? (
          <div className="py-16 text-center text-white/40 text-xs font-mono">
            No sales records found in this category. Complete tasks or log sales to populate your ledger.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSales.map((sale) => {
              const isReleased = sale.escrowStatus === 'RELEASED';
              const isHeld = sale.escrowStatus === 'HELD' || sale.escrowStatus === 'PENDING';

              return (
                <div
                  key={sale.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/15 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs"
                >
                  <div className="space-y-1.5 max-w-md">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold font-sans text-sm">
                        {sale.productDelivered}
                      </span>
                      <span className="text-[9px] px-2 py-0.2 rounded-full bg-white/10 text-white/70 uppercase">
                        {sale.buyerPlatform}
                      </span>
                      <span
                        className={`text-[9px] px-2 py-0.2 rounded-full font-bold uppercase ${
                          isReleased
                            ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                            : 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30'
                        }`}
                      >
                        {sale.escrowStatus}
                      </span>
                    </div>

                    <div className="text-[11px] text-white/60">
                      Buyer: <span className="text-white font-bold">{sale.buyerName}</span> ({sale.buyerEmail})
                    </div>

                    <div className="text-[10px] text-white/40">
                      Date: {new Date(sale.createdAt).toLocaleDateString()} · Logged by: {sale.loggedBy}
                    </div>
                  </div>

                  {/* Financial Breakdown & Actions */}
                  <div className="flex flex-wrap items-center gap-4 self-end md:self-center">
                    <div className="text-right">
                      <div className="text-[10px] text-white/40">SALE / NET PAYOUT</div>
                      <div className="text-sm font-bold text-green-400">
                        ${(sale.saleAmountCents / 100).toFixed(2)} → ${(sale.userPayoutCents / 100).toFixed(2)}
                      </div>
                    </div>

                    {isHeld && (
                      <Button
                        size="sm"
                        disabled={releasingId === sale.id}
                        onClick={() => handleReleaseEscrow(sale.id)}
                        className="liquid-glass-strong text-white text-xs font-mono rounded-full px-4 h-8 font-bold hover:scale-105 transition-transform"
                      >
                        {releasingId === sale.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          'Confirm & Release Payout'
                        )}
                      </Button>
                    )}

                    {sale.task?.id && (
                      <Link href={`/tasks/${sale.task.id}`}>
                        <Button size="sm" variant="outline" className="text-[10px] font-mono h-8 rounded-full border-white/15">
                          View Task
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
