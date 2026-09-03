'use client';

import React, { useState, useEffect } from 'react';
import { Zap, AlertTriangle, ArrowUpRight, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function CreditBadge() {
  const [balance, setBalance] = useState<number>(100);
  const [allocation, setAllocation] = useState<number>(100);
  const [tierName, setTierName] = useState<string>('Free Starter');
  const [showModal, setShowModal] = useState<boolean>(false);

  const fetchBalance = async () => {
    try {
      const res = await fetch('/api/credits/balance');
      const data = await res.json();
      if (data.ok) {
        setBalance(data.balance);
        setAllocation(data.monthlyAllocation);
        setTierName(data.tierName);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, []);

  const percentage = Math.round((balance / allocation) * 100);
  const isLow = percentage <= 20;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold transition-all border ${
          isLow
            ? 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30 hover:bg-[#ef4444]/20'
            : 'bg-[#00FF66]/10 text-[#00FF66] border-[#00FF66]/30 hover:bg-[#00FF66]/20'
        }`}
        title="AI Credit Budget Management"
      >
        <Zap className="w-3 h-3 animate-pulse" />
        <span>
          {balance} / {allocation}
        </span>
      </button>

      {/* Credit Details Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans text-left">
          <div className="max-w-md w-full rounded-3xl bg-[#06060E] border border-white/20 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/20 flex items-center justify-center text-[#00F0FF]">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase font-mono">AI BUDGET &amp; CREDITS</h3>
                  <p className="text-[10px] text-[#8E9BB4]">{tierName}</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[#8E9BB4] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 font-mono">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8E9BB4]">Current Balance:</span>
                <span className="font-bold text-white text-sm">{balance} Credits</span>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isLow ? 'bg-[#ef4444]' : 'bg-[#00FF66]'}`}
                  style={{ width: `${Math.max(5, percentage)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#8E9BB4]">
                <span>{percentage}% remaining</span>
                <span>Monthly Reset: In 27 Days</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-[#8E9BB4] font-mono">
              <div className="text-[11px] font-bold text-white uppercase">ACTION COSTS:</div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span>Nova Chat Message</span>
                <span className="text-[#00F0FF]">2 Credits</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span>Trend Scout Query</span>
                <span className="text-[#00F0FF]">5 Credits</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span>Buyer Discovery Batch</span>
                <span className="text-[#00F0FF]">10 Credits</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span>Video Generation (1080p 9:16)</span>
                <span className="text-[#00F0FF]">25 Credits</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <Button
                size="sm"
                onClick={() => {
                  toast.success('Redirecting to Pro Tier upgrade checkout...');
                  setShowModal(false);
                }}
                className="w-full bg-[#38bdf8] text-black font-extrabold uppercase font-mono text-xs h-9"
              >
                Upgrade to Pro (5,000 Credits) &rarr;
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}