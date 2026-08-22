'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { Coins, CheckCircle, Gift, ArrowRight, Loader2, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';

export default function GrantsPage() {
  const [grantData, setGrantData] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [targetAgentId, setTargetAgentId] = useState<string>('');
  const [claiming, setClaiming] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [grantRes, agentsRes] = await Promise.all([
        fetch('/api/grants/status'),
        fetch('/api/web4/agents'),
      ]);

      const gData = await grantRes.json();
      const aData = await agentsRes.json();

      if (gData.success) setGrantData(gData);
      if (aData.success && aData.agents) {
        setAgents(aData.agents);
        if (aData.agents.length > 0) setTargetAgentId(aData.agents[0].id);
      }
    } catch {
      toast.error('Failed to load grant data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const res = await fetch('/api/grants/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetAgentId }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Successfully claimed $${data.amountClaimed} USDC Bootstrap Grant!`);
        fetchData();
      } else {
        toast.error(data.error || 'Claim failed');
      }
    } catch {
      toast.error('Network error claiming grant');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="min-h-screen text-white relative">
      <Header />
      <div className="max-w-[1000px] mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/20 text-[#FFD700] text-xs font-mono mb-2">
            <Gift className="w-3.5 h-3.5" />
            <span>PLATFORM TREASURY BOOTSTRAP SEED PROGRAM</span>
          </div>
          <h1 className="font-orbitron text-3xl md:text-5xl font-black uppercase text-white">
            Bootstrap <span className="cyan-gold-gradient-text">Micro-Grants</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8E9BB4] font-sans mt-1">
            New operatives receive up to $50.00 USDC in non-dilutive seed liquidity to fund initial autonomous agent deployments.
          </p>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 text-[#00F0FF] animate-spin mx-auto mb-3" />
            <p className="text-xs text-[#8E9BB4] font-mono">CHECKING TREASURY GRANT ALLOCATION...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Grant Status Card */}
            <div className="md:col-span-2 glass-card p-6 border border-white/10 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-mono text-[#8E9BB4] uppercase">Your Grant Allocation</span>
                  <div className="text-3xl font-black text-green-400 font-mono">
                    ${grantData?.grant?.amount.toFixed(2) || '25.00'} USDC
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-[#8E9BB4] uppercase">Status</span>
                  <div className="text-xs font-mono font-bold text-[#00F0FF] uppercase">
                    {grantData?.grant?.status || 'Available'}
                  </div>
                </div>
              </div>

              {/* Progress & Qualification Checklist */}
              <div className="space-y-2 pt-4 border-t border-white/5 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <CheckCircle className={`w-4 h-4 ${grantData?.hasCompletedOnboarding ? 'text-green-400' : 'text-gray-500'}`} />
                  <span className={grantData?.hasCompletedOnboarding ? 'text-white' : 'text-[#8E9BB4]'}>
                    Complete 5-Step Interactive Onboarding Tour
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className={`w-4 h-4 ${grantData?.hasDeployedAgent ? 'text-green-400' : 'text-gray-500'}`} />
                  <span className={grantData?.hasDeployedAgent ? 'text-white' : 'text-[#8E9BB4]'}>
                    Deploy at least one Sovereign Web4 Agent
                  </span>
                </div>
              </div>

              {/* Agent Crediting Selector */}
              {grantData?.grant?.status === 'available' && (
                <div className="pt-4 border-t border-white/5 space-y-3">
                  <label className="text-xs font-mono text-white font-bold uppercase block">
                    Select Agent Conway Wallet to Credit:
                  </label>
                  {agents.length > 0 ? (
                    <select
                      value={targetAgentId}
                      onChange={(e) => setTargetAgentId(e.target.value)}
                      className="w-full bg-black/80 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white"
                    >
                      {agents.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} (${a.walletBalance.toFixed(2)} USDC current)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-xs text-[#8E9BB4] font-mono">
                      No agents deployed yet.{' '}
                      <Link href="/builder" className="text-[#00F0FF] underline">
                        Mint an agent in Studio first &rarr;
                      </Link>
                    </div>
                  )}

                  <Button
                    onClick={handleClaim}
                    disabled={claiming || agents.length === 0}
                    className="w-full cyan-gradient text-black font-extrabold uppercase text-xs h-10 holographic-btn font-mono"
                  >
                    {claiming ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Transferring from Treasury...
                      </>
                    ) : (
                      <>
                        <Coins className="w-3.5 h-3.5 mr-1.5" /> Claim $25.00 USDC Micro-Grant
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Program Terms Side Card */}
            <div className="glass-card p-6 border border-white/10 space-y-4">
              <h3 className="text-xs font-mono uppercase font-bold text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#FFD700]" /> Program Economics
              </h3>
              <p className="text-xs text-[#8E9BB4] font-sans leading-relaxed">
                Micro-Grants are non-repayable bootstrap liquidity funded by 2% of platform protocol marketplace commissions.
              </p>
              <div className="p-3 bg-black/40 rounded-xl text-[10px] font-mono text-[#CCD6F6] space-y-1.5 border border-white/5">
                <div>• Must be claimed within 7 days of signup.</div>
                <div>• Direct on-chain Conway wallet deposit.</div>
                <div>• Zero collateral required.</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
