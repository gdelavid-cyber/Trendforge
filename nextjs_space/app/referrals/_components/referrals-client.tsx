'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Share2, Users, DollarSign, Copy, Check, Sparkles, Bot, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function ReferralsClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchReferralStats = async () => {
    try {
      const res = await fetch('/api/referrals');
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchReferralStats();
  }, []);

  const handleCopy = () => {
    if (!data?.referralUrl) return;
    navigator.clipboard.writeText(data.referralUrl);
    setCopied(true);
    toast.success('Referral link copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-12 font-sans">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-[#00F0FF] text-xs font-mono mb-3">
          <Share2 className="w-3.5 h-3.5" />
          <span>VIRAL GROWTH ENGINE // 10% RECURRING COMMISSION</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-wider text-white">
          Referral <span className="cyan-gold-gradient-text">Partner Program</span>
        </h1>
        <p className="text-sm text-[#8892B0] max-w-2xl mt-2 font-sans">
          Invite fellow operators to Trendly. Earn +1 stackable Swarm Agent run for every operative who signs up and completes a run, plus <strong>10% recurring monthly commission</strong> when they upgrade.
        </p>
      </motion.div>

      {/* Link Sharing Box */}
      <div className="glass-card p-6 md:p-8 mb-8 border border-[#00F0FF]/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#00F0FF]/5 rounded-full blur-3xl pointer-events-none" />

        <h3 className="text-sm font-mono uppercase tracking-wider text-[#00F0FF] mb-2">
          Your Unique Operative Invite Link
        </h3>

        <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
          <Input
            readOnly
            value={data?.referralUrl ?? 'Loading invite link...'}
            className="bg-black/60 border-white/10 text-white font-mono text-sm h-11"
          />
          <Button
            onClick={handleCopy}
            className="cyan-gradient text-black font-extrabold uppercase holographic-btn h-11 px-6 flex-shrink-0"
          >
            {copied ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
            {copied ? 'Copied' : 'Copy Link'}
          </Button>
        </div>
      </div>

      {/* Telemetry Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="glass-card p-6">
          <span className="text-[#8892B0] text-[10px] uppercase font-mono block">Referred Operatives</span>
          <div className="text-3xl font-bold text-white mt-1 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#00F0FF]" /> {data?.totalReferrals ?? 0}
          </div>
          <span className="text-[10px] text-[#8892B0] font-mono block mt-1">Verified Registrations</span>
        </div>

        <div className="glass-card p-6">
          <span className="text-[#8892B0] text-[10px] uppercase font-mono block">Bonus Agent Runs Stacked</span>
          <div className="text-3xl font-bold text-purple-400 mt-1 flex items-center gap-2 font-mono">
            <Bot className="w-6 h-6 text-purple-400" /> +{data?.bonusAgentRuns ?? 0}
          </div>
          <span className="text-[10px] text-[#8892B0] font-mono block mt-1">+1 Run per Active Referee</span>
        </div>

        <div className="glass-card p-6">
          <span className="text-[#8892B0] text-[10px] uppercase font-mono block">Recurring Commissions</span>
          <div className="text-3xl font-bold text-green-400 mt-1 flex items-center gap-1 font-mono">
            <DollarSign className="w-6 h-6 text-green-400" /> ${(data?.totalCommissions ?? 0).toFixed(2)}
          </div>
          <span className="text-[10px] text-[#8892B0] font-mono block mt-1">10% Recurring Stripe Payouts</span>
        </div>
      </div>

      {/* Referrals Activity Table */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-mono uppercase tracking-wider text-white mb-4">
          Referral Attributions & Activity
        </h3>

        {loading ? (
          <div className="py-12 text-center text-xs font-mono text-[#8892B0]">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#00F0FF]" /> Loading activity...
          </div>
        ) : (data?.referrals?.length ?? 0) === 0 ? (
          <div className="py-12 text-center text-xs font-mono text-[#8892B0] border border-dashed border-white/10 rounded-lg">
            No referral activity yet. Share your invite link on X, LinkedIn, or Discord to start earning commissions.
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04] overflow-x-auto">
            {data.referrals.map((r: any) => (
              <div key={r.id} className="py-3 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-white font-bold">{r.referredEmail ?? 'Anonymous User'}</span>
                  <span className="text-[10px] text-[#8892B0] block">Joined {new Date(r.signedUpAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-green-400 font-bold">+${(r.commissionEarned || 0).toFixed(2)}</span>
                  <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
