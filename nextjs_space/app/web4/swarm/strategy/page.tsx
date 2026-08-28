import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { Header } from '@/components/header';
import { SwarmNav } from '../_components/swarm-nav';
import { prisma } from '@/lib/db';
import { Compass, History, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Trendly Autonomous Swarm | Strategy Evolution History',
  description: 'Versioned Strategic Adaptations, Impact Analyses, and Learning Loop Ledger',
};

export const dynamic = 'force-dynamic';

export default async function SwarmStrategyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any)?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const brainState = await prisma.swarmBrainState.findUnique({ where: { id: 'global' } });
  const strategyUpdates = await prisma.strategyUpdate.findMany({
    orderBy: { appliedAt: 'desc' },
    take: 20,
  });

  const currentStrategy = (brainState?.strategyState as any) || {
    templatePriority: ['FACELESS_VIDEO', 'ECOMMERCE_LISTING', 'LANDING_PAGE'],
    trendPreferences: ['AI Creator Economy', 'SaaS Growth Tools'],
    outreachFocus: ['fiverr', 'upwork', 'twitter'],
    pricingAdjustments: { FACELESS_VIDEO: 249, ECOMMERCE_LISTING: 189, LANDING_PAGE: 399 },
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col">
      <Header />
      <SwarmNav
        isSurvival={brainState?.survivalMode ?? false}
        isDryRun={brainState?.dryRun ?? false}
      />

      <div className="max-w-7xl mx-auto w-full px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <Compass className="w-8 h-8 text-cyan-400" />
              Strategy Evolution History
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Autonomous learning loops: micro-reviews (every 10 tasks) and full reviews (every 50 tasks) continuously adapt strategy.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Active Version: v{brainState?.strategyVersion || 1}.0
            </span>
          </div>
        </div>

        {/* Current Strategy Overview */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/30 via-slate-900/60 to-purple-950/30 border border-cyan-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Currently Active Production Strategy
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <span className="text-slate-500 font-semibold block uppercase">Template Priorities</span>
              <div className="flex flex-wrap gap-1.5">
                {(currentStrategy.templatePriority || []).map((t: string) => (
                  <span key={t} className="px-2 py-1 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <span className="text-slate-500 font-semibold block uppercase">Outreach Channels</span>
              <div className="flex flex-wrap gap-1.5">
                {(currentStrategy.outreachFocus || []).map((c: string) => (
                  <span key={c} className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <span className="text-slate-500 font-semibold block uppercase">Dynamic Target Pricing</span>
              <div className="space-y-1 text-slate-300">
                {Object.entries(currentStrategy.pricingAdjustments || {}).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span>{k}:</span>
                    <span className="text-emerald-400 font-bold">${v as number}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Strategy History Timeline */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            Strategy Change Log
          </h2>

          <div className="space-y-4">
            {strategyUpdates.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 font-sans">
                Initial baseline strategy active. Updates will be recorded upon completion of 50-task review cycles.
              </div>
            ) : (
              strategyUpdates.map(update => (
                <div
                  key={update.id}
                  className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3 font-mono"
                >
                  <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                    <span className="font-bold text-cyan-300">Version v{update.version}.0</span>
                    <span className="text-slate-500">{new Date(update.appliedAt).toLocaleString()}</span>
                  </div>
                  <div className="text-sm font-sans text-slate-200">
                    {update.reasoning}
                  </div>
                  <div className="text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                    Expected Impact: {update.expectedImpact}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
