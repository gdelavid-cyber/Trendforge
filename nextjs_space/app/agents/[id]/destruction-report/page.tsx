import { Header } from '@/components/header';
import { prisma } from '@/lib/db';
import { Skull, AlertTriangle, ArrowLeft, ShieldCheck, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function DestructionReportPage({ params }: { params: { id: string } }) {
  const agent = await prisma.web4Agent.findUnique({
    where: { id: params.id },
    include: { survivalLogs: { orderBy: { createdAt: 'desc' } } },
  });

  return (
    <div className="min-h-screen text-white relative">
      <Header />
      <div className="max-w-[900px] mx-auto px-4 py-12">
        <Link href="/agents" className="text-xs font-mono text-[#8E9BB4] hover:text-white flex items-center gap-1 mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Agents Command Center
        </Link>

        <div className="glass-card p-8 border border-red-500/40 bg-red-500/5 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-3xl text-red-400">
              <Skull className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-wider">
                ECONOMIC DARWINISM // POST-MORTEM DIAGNOSTIC
              </span>
              <h1 className="font-orbitron text-2xl sm:text-3xl font-black uppercase text-white">
                {agent?.name || 'Agent'} — Clean Self-Destruction Report
              </h1>
            </div>
          </div>

          <p className="text-xs text-[#CCD6F6] font-sans leading-relaxed mb-6">
            Under Trendly Web4 Economic Darwinism rules, this worker exhausted its Conway liquidity balance and failed to achieve profitability within its grace period. Clean self-destruction was executed. <strong>Your user account and personal crypto wallets remain 100% untouched.</strong>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-black/60 rounded-xl border border-white/5 text-xs font-mono mb-6">
            <div>
              <span className="text-[#8E9BB4] text-[10px] block uppercase">Final Net P&L</span>
              <span className="text-red-400 font-bold">${agent?.profit.toFixed(2) || '0.00'} USDC</span>
            </div>
            <div>
              <span className="text-[#8E9BB4] text-[10px] block uppercase">Compute Costs</span>
              <span className="text-[#FFD700] font-bold">${agent?.totalCosts.toFixed(2) || '0.00'} USDC</span>
            </div>
            <div>
              <span className="text-[#8E9BB4] text-[10px] block uppercase">Account Protection</span>
              <span className="text-green-400 font-bold">✓ 100% Preserved</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-mono text-white font-bold uppercase">Optimization Recommendations for Next Agent:</h4>
            <ul className="list-disc list-inside text-xs text-[#8E9BB4] font-sans space-y-1">
              <li>Deploy high-yield skill blocks (e.g. Polymarket Arbitrage or Next.js Micro-SaaS) to accelerate initial cash flow.</li>
              <li>Refuel Conway wallet balance before grace period expiration to maintain positive Darwinism survival scores.</li>
            </ul>
          </div>
        </div>

        <Link href="/builder">
          <Button className="cyan-gradient text-black font-extrabold uppercase text-xs h-10 holographic-btn font-mono">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Mint New Optimized Agent in Studio
          </Button>
        </Link>
      </div>
    </div>
  );
}
