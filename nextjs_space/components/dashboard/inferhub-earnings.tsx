'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Coins, RefreshCw, TrendingUp, Zap } from 'lucide-react';

interface Transfer {
  id: string;
  amountUsd: number;
  status: string;
  transactionId?: string | null;
  errorMessage?: string | null;
  createdAt: string;
}

interface EarningsData {
  earnings: {
    publisher_balance_usd: number;
    pending_usd?: number;
    paid_out_usd?: number;
  } | null;
  error?: string | null;
  totalReinvestedUsd: number;
  totalSuccessfulTransfers: number;
  recentTransfers: Transfer[];
}

function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function InferHubEarnings() {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reinvesting, setReinvesting] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/inferhub/reinvest');
      setData(await res.json());
    } catch {
      toast.error('Failed to load InferHub earnings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, []);

  const triggerReinvest = async () => {
    setReinvesting(true);
    try {
      const res = await fetch('/api/inferhub/reinvest', { method: 'POST' });
      const d = await res.json();
      if (res.ok && d.success && d.action === 'transferred') {
        toast.success(`Reinvested $${d.amountUsd?.toFixed(4)} to consumer balance`);
      } else if (d.action === 'skipped') {
        toast.info(d.reason || 'Skipped — below threshold');
      } else {
        toast.error(d.error || 'Reinvest failed');
      }
      fetchData();
    } catch {
      toast.error('Network error during reinvest');
    } finally {
      setReinvesting(false);
    }
  };

  if (loading) {
    return <div className="h-48 rounded-2xl bg-white/5 animate-pulse" />;
  }

  return (
    <Card className="border-amber-500/20 bg-slate-950/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2 text-white">
            <Coins className="h-5 w-5 text-amber-400" />
            InferHub Earnings
          </CardTitle>
          <Button size="sm" onClick={triggerReinvest} disabled={reinvesting || !data?.earnings}>
            {reinvesting ? (
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Zap className="h-3 w-3 mr-1" />
            )}
            Reinvest Now
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {data?.error ? (
          <p className="text-sm text-red-400">{data.error}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-white/5">
              <p className="text-[10px] text-slate-400 uppercase font-mono">Publisher Balance</p>
              <p className="text-lg font-mono text-amber-300 font-bold">
                {formatUsd(data?.earnings?.publisher_balance_usd || 0)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-white/5">
              <p className="text-[10px] text-slate-400 uppercase font-mono">Total Reinvested</p>
              <p className="text-lg font-mono text-emerald-300 font-bold">
                {formatUsd(data?.totalReinvestedUsd || 0)}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-400 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Recent Transfers
          </p>
          {!data?.recentTransfers?.length ? (
            <p className="text-xs text-slate-500 italic">No transfers yet</p>
          ) : (
            data.recentTransfers.slice(0, 5).map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant={t.status === 'success' ? 'default' : 'outline'}
                    className={
                      t.status === 'success'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]'
                        : t.status === 'failed'
                          ? 'text-red-300 border-red-500/30 text-[10px]'
                          : 'text-amber-300 border-amber-500/30 text-[10px]'
                    }
                  >
                    {t.status}
                  </Badge>
                  <span className="text-xs font-mono text-white">
                    {t.amountUsd > 0 ? formatUsd(t.amountUsd) : '—'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {timeAgo(new Date(t.createdAt))}
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
