'use client';

import React, { useState } from 'react';
import { DollarSign, CheckCircle2, Shield, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  taskId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function LogSaleModal({ taskId, isOpen, onClose, onSuccess }: Props) {
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPlatform, setBuyerPlatform] = useState('Fiverr');
  const [saleAmount, setSaleAmount] = useState('150');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const amountCents = Math.round(parseFloat(saleAmount || '0') * 100);
      const res = await fetch(`/api/tasks/${taskId}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerName,
          buyerEmail,
          buyerPlatform,
          saleAmountCents: amountCents,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Sale recorded! Payout credited to your dashboard.`);
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Failed to log sale');
      }
    } catch (e: any) {
      toast.error('Network error logging sale');
    } finally {
      setLoading(false);
    }
  };

  const amountNumber = parseFloat(saleAmount || '0');
  const platformFee = amountNumber * 0.1;
  const netPayout = amountNumber - platformFee;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0A0D1A] border border-white/15 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative font-mono text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-white uppercase">Log Completed Sale</div>
              <div className="text-[10px] text-white/50">Record direct deal & update earnings</div>
            </div>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] text-white/50 uppercase block mb-1">Buyer / Client Name</label>
            <input
              type="text"
              required
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="e.g. Marcus Vance"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F0FF]"
            />
          </div>

          <div>
            <label className="text-[10px] text-white/50 uppercase block mb-1">Buyer Email / Contact</label>
            <input
              type="email"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              placeholder="e.g. client@brand.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F0FF]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-white/50 uppercase block mb-1">Channel</label>
              <select
                value={buyerPlatform}
                onChange={(e) => setBuyerPlatform(e.target.value)}
                className="w-full bg-[#050814] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F0FF]"
              >
                <option value="Fiverr">Fiverr</option>
                <option value="Upwork">Upwork</option>
                <option value="Twitter">Twitter / X</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Direct Email">Direct Email</option>
                <option value="Etsy">Etsy</option>
                <option value="Gumroad">Gumroad</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-white/50 uppercase block mb-1">Sale Amount ($ USD)</label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={saleAmount}
                onChange={(e) => setSaleAmount(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F0FF] text-green-400 font-bold"
              />
            </div>
          </div>

          {/* Breakdown Card */}
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between text-white/60">
              <span>Gross Sale:</span>
              <span className="text-white">${amountNumber.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-white/40">
              <span>Platform Fee (10%):</span>
              <span>-${platformFee.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-green-400 font-bold pt-1 border-t border-white/[0.05]">
              <span>Your Net Payout:</span>
              <span>${netPayout.toFixed(2)}</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-full h-9 text-xs border-white/15"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="liquid-glass-strong text-white rounded-full px-6 h-9 font-bold hover:scale-105 transition-transform"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm & Record Sale'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
