import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { redirect } from 'next/navigation';
import { Header } from '@/components/layouts/header';
import { SwarmNav } from '../_components/swarm-nav';
import { prisma } from '@/lib/core/db';
import { Layers, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Trendly Autonomous Swarm | Task Pipeline Feed',
  description: 'Real-time Autonomous Pipeline, State Machine, and Task Checkpoints',
};

export const dynamic = 'force-dynamic';

export default async function SwarmTasksPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any)?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const brainState = await prisma.swarmBrainState.findUnique({ where: { id: 'global' } });
  const activeTasks = await prisma.swarmTask.findMany({
    where: { state: { notIn: ['COMPLETED', 'FAILED', 'REFUNDED'] } },
    orderBy: { createdAt: 'desc' },
  });

  const recentTasks = await prisma.swarmTask.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 20,
    include: {
      outreachRecords: true,
      evidenceBundle: true,
      attestation: true,
    },
  });

  const getPhaseColor = (state: string) => {
    switch (state) {
      case 'COMPLETED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'FAILED':
      case 'REFUNDED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'DISPUTED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'DELIVERY':
      case 'LOGGING':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default:
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    }
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
              <Layers className="w-8 h-8 text-cyan-400" />
              Task Execution Pipeline
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              9-stage autonomous state machine with checkpointed step recovery and warm-lead outreach tracking.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              {activeTasks.length} In-Flight Tasks
            </span>
          </div>
        </div>

        {/* Task Cards Feed */}
        <div className="space-y-4">
          {recentTasks.map(task => {
            const checkpoint = (task.checkpoint as any) || {};
            const completedSteps = checkpoint.completedSteps || [];

            return (
              <div
                key={task.id}
                className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 hover:border-cyan-500/30 transition-all space-y-4 font-mono text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-cyan-300">
                      Task {task.id.slice(0, 10)}...
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold border ${getPhaseColor(task.state)}`}>
                      {task.state}
                    </span>
                    <span className="text-slate-400 font-sans">{task.templateId}</span>
                  </div>

                  <div className="flex items-center gap-4 text-slate-400">
                    <span>Est Cost: ${(task.estimatedCost || 18.5).toFixed(2)}</span>
                    <span className="text-emerald-400 font-bold">Target Sale: ${task.salePrice || 249}</span>
                  </div>
                </div>

                {/* Checkpoint Progress Flow */}
                <div className="space-y-1.5 font-sans">
                  <span className="text-slate-500 text-xs font-mono block">Pipeline Checkpoints:</span>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    {['DISCOVERY', 'ANALYSIS', 'BUILDING', 'VALIDATION', 'LISTING', 'OUTREACH', 'DELIVERY', 'LOGGING', 'COMPLETED'].map((step, idx) => {
                      const isDone = completedSteps.includes(step) || (task.state === 'COMPLETED');
                      const isCurrent = task.state === step;

                      return (
                        <div key={step} className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-1 rounded-md text-[11px] font-mono font-medium ${
                              isDone
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : isCurrent
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 animate-pulse'
                                : 'bg-slate-900 text-slate-600 border border-slate-800'
                            }`}
                          >
                            {step}
                          </span>
                          {idx < 8 && <ArrowRight className="w-3 h-3 text-slate-700" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Metadata details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800/60 text-slate-400">
                  <div>
                    <span className="text-slate-500 block">Buyer Email:</span>
                    <span className="text-slate-200">{task.buyerEmail || 'Warm lead matching...'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Escrow Ledger:</span>
                    <span className="text-emerald-400 font-bold">{task.escrowStatus}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Attestation:</span>
                    <span className="text-cyan-300 truncate block">
                      {task.attestationId ? `Verified (${task.attestationId.slice(0, 8)}...)` : 'Pending completion'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
