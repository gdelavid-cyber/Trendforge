import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { redirect } from 'next/navigation';
import { Header } from '@/components/header';
import { SwarmNav } from '../_components/swarm-nav';
import { prisma } from '@/lib/core/db';
import { BrainCircuit, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Trendly Autonomous Swarm | Master Brain Decisions',
  description: 'Continuous Reasoning Feed, Confidence Scores, and Execution Audit Trail',
};

export const dynamic = 'force-dynamic';

export default async function SwarmBrainPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any)?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const brainState = await prisma.swarmBrainState.findUnique({ where: { id: 'global' } });
  const decisions = await prisma.swarmBrainDecision.findMany({
    orderBy: { createdAt: 'desc' },
    take: 30,
    include: { task: true },
  });

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
              <BrainCircuit className="w-8 h-8 text-cyan-400" />
              Master Brain Decisions Feed
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Real-time audit log of every autonomous reasoner pulse, pre-flight check, and confidence score.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Strategy Version {brainState?.strategyVersion || 1}
            </span>
          </div>
        </div>

        {/* Decisions Timeline Feed */}
        <div className="space-y-4">
          {decisions.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 font-sans">
              No recent brain decisions logged. Trigger an autonomous pulse from the Command Center.
            </div>
          ) : (
            decisions.map(decision => (
              <div
                key={decision.id}
                className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 hover:border-cyan-500/30 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      {decision.decisionType}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      ID: {decision.id.slice(0, 10)}...
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Confidence: {decision.confidenceScore}%
                    </div>
                    <span className="text-slate-500">
                      {new Date(decision.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <div className="text-sm text-slate-200 leading-relaxed font-sans">
                  {decision.reasoning}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                  <div>
                    <span className="text-slate-500 block">Expected Outcome:</span>
                    <span className="text-cyan-300 font-semibold">{decision.expectedOutcome}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Associated Task:</span>
                    <span className="text-slate-300">
                      {decision.taskId ? decision.taskId.slice(0, 12) + '...' : 'Global / Workforce'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
