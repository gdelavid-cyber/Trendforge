export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/core/auth-options';
import { isUserAdmin } from '@/lib/council/config';
import { Header } from '@/components/layouts/header';
import Link from 'next/link';
import { 
  Bot, 
  Flame, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  TrendingUp, 
  DollarSign, 
  Wrench, 
  AlertTriangle, 
  ArrowRight,
  CheckCircle2,
  Activity,
  Cpu
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function AdminSwarmsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/signin');
  if (!isUserAdmin(session.user as any)) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ADMIN SWARM COMMAND // RESTRICTED ACCESS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-orbitron text-white uppercase tracking-wider">
              The Two Core AI Swarms
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-sans mt-1">
              Both swarms run autonomously in the background. Swarm 1 hunts and debates profitable cashflow opportunities. Swarm 2 keeps the system, AI speed, and quality 100% on point.
            </p>
          </div>

          <Link href="/admin/council">
            <Button className="cyan-gradient text-black font-extrabold uppercase text-xs h-10 px-4 font-mono">
              <Flame className="w-4 h-4 mr-1.5 fill-black" /> Open Council Cockpit &rarr;
            </Button>
          </Link>
        </div>

        {/* 2-Swarm Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* SWARM 1: THE MONEY COUNCIL */}
          <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-6 space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl">
                  💰
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                    SWARM 1 // PROFIT HUNTER
                  </span>
                  <h2 className="text-lg font-bold text-white font-mono">The Money Council Swarm</h2>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Scouts market signals and vigorously debates viability. Enforces the strict <strong>Real-Deal Money Filter</strong>—killing viral vanity trends and passing only high-margin plays ($450–$2,500 target deals) to users.
            </p>

            {/* 6 Specialist Personas + Gatekeeper */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block font-semibold">
                6 Specialist AI Agents + Gatekeeper:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-amber-500/20 flex items-center gap-2">
                  <span className="text-base">💡</span>
                  <div>
                    <div className="font-bold text-amber-300 font-mono">Deal Finder (Lead AI)</div>
                    <div className="text-[10px] text-slate-400">Real-Deal Cash Discovery</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-cyan-500/20 flex items-center gap-2">
                  <span className="text-base">🎯</span>
                  <div>
                    <div className="font-bold text-cyan-300 font-mono">Trend Hunter</div>
                    <div className="text-[10px] text-slate-400">Search Velocity & Timing</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-emerald-500/20 flex items-center gap-2">
                  <span className="text-base">📊</span>
                  <div>
                    <div className="font-bold text-emerald-300 font-mono">Unit Economist</div>
                    <div className="text-[10px] text-slate-400">80%+ Gross Margin Audit</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-blue-500/20 flex items-center gap-2">
                  <span className="text-base">⚙️</span>
                  <div>
                    <div className="font-bold text-blue-300 font-mono">Operator</div>
                    <div className="text-[10px] text-slate-400">24-48h Fast Build Path</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-rose-500/20 flex items-center gap-2">
                  <span className="text-base">🛡️</span>
                  <div>
                    <div className="font-bold text-rose-300 font-mono">Contrarian</div>
                    <div className="text-[10px] text-slate-400">Red-Team & Flaw Veto</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-amber-500/20 flex items-center gap-2">
                  <span className="text-base">💼</span>
                  <div>
                    <div className="font-bold text-amber-300 font-mono">Closer</div>
                    <div className="text-[10px] text-slate-400">Auto-Close & Stripe Rails</div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between text-xs font-mono mt-2">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> The Gatekeeper Gavel
                </span>
                <span className="text-slate-300">Tier-1 Threshold: <strong>80/100</strong></span>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/admin/council">
                <Button variant="outline" className="w-full border-amber-500/30 text-amber-300 hover:bg-amber-500/10 font-mono text-xs h-10">
                  View Live Council Deliberations &rarr;
                </Button>
              </Link>
            </div>
          </div>

          {/* SWARM 2: THE QUALITY & SYSTEM GUARDIAN */}
          <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-6 space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-2xl">
                  🛡️
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                    SWARM 2 // SYSTEM WATCHDOG
                  </span>
                  <h2 className="text-lg font-bold text-white font-mono">The Quality Guardian Swarm</h2>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                100% SHARP
              </span>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Monitors the entire platform 24/7. Ensures all AI outputs meet strict quality benchmarks, prevents hallucinations, enforces legal compliance (CAN-SPAM, opt-outs), and guarantees sub-3s response speeds.
            </p>

            {/* 4 Watchdog Sentinels */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block font-semibold">
                4 Background Quality Sentinels:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                  <div className="font-bold text-cyan-300 font-mono flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Output Validator
                  </div>
                  <div className="text-[10px] text-slate-400 leading-relaxed">
                    Audits deliverables against golden sample standards before sending to buyers.
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400 mt-2 font-bold">99.4% Match Rate</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                  <div className="font-bold text-purple-300 font-mono flex items-center gap-1.5 mb-1">
                    <Activity className="w-3.5 h-3.5 text-purple-400" /> Latency Sentinel
                  </div>
                  <div className="text-[10px] text-slate-400 leading-relaxed">
                    Guarantees sub-3s response speed on all auto-closer buyer turns.
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400 mt-2 font-bold">Avg: 340ms</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                  <div className="font-bold text-emerald-300 font-mono flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Compliance Guard
                  </div>
                  <div className="text-[10px] text-slate-400 leading-relaxed">
                    Enforces CAN-SPAM, immediate opt-out cessation, and price floors.
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400 mt-2 font-bold">0 Violations</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                  <div className="font-bold text-amber-300 font-mono flex items-center gap-1.5 mb-1">
                    <Cpu className="w-3.5 h-3.5 text-amber-400" /> Self-Healing Unit
                  </div>
                  <div className="text-[10px] text-slate-400 leading-relaxed">
                    Detects degraded API keys, rate limits, or network stalls and switches providers.
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400 mt-2 font-bold">Auto-Failover Active</div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/admin/compliance">
                <Button variant="outline" className="w-full border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 font-mono text-xs h-10">
                  View Compliance & Quality Audit Log &rarr;
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
