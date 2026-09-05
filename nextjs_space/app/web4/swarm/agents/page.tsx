import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { redirect } from 'next/navigation';
import { Header } from '@/components/header';
import { SwarmNav } from '../_components/swarm-nav';
import { prisma } from '@/lib/core/db';
import { Users, Skull, Activity, ShieldCheck, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Trendly Autonomous Swarm | Colony & Agent Lifecycle',
  description: 'Darwinian Agent Management, Performance Scores, and Kill Registry',
};

export const dynamic = 'force-dynamic';

export default async function SwarmAgentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any)?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const brainState = await prisma.swarmBrainState.findUnique({ where: { id: 'global' } });
  const activeAgents = await prisma.autonomousAgent.findMany({
    where: { status: { in: ['ACTIVE', 'IDLE', 'WORKING', 'COOLDOWN'] } },
    orderBy: { performanceScore: 'desc' },
  });

  const deadAgents = await prisma.autonomousAgent.findMany({
    where: { status: { in: ['KILLED', 'DEAD'] } },
    orderBy: { lastActiveTime: 'desc' },
    take: 20,
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
              <Users className="w-8 h-8 text-cyan-400" />
              Agent Workforce Colony
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Darwinian lifecycle management: agents that contribute revenue thrive; underperforming agents are culled.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              {activeAgents.length} Active Agents
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
              <Skull className="w-3.5 h-3.5" />
              {deadAgents.length} Culled
            </span>
          </div>
        </div>

        {/* Active Workforce Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            Active Workforce Pool ({activeAgents.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeAgents.map(agent => (
              <div
                key={agent.id}
                className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 hover:border-cyan-500/40 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="font-bold text-sm text-white font-mono">{agent.role}</span>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {agent.modelTier}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                  <div>
                    <span className="text-slate-500 block">Performance</span>
                    <span className={`font-bold ${agent.performanceScore > 60 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {agent.performanceScore.toFixed(1)}/100
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Revenue</span>
                    <span className="font-bold text-emerald-400">
                      ${agent.revenueContributed.toFixed(0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Completed</span>
                    <span className="text-white font-bold">{agent.tasksCompleted} tasks</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Cycles No Rev</span>
                    <span className={`${agent.cyclesSinceRevenue > 5 ? 'text-rose-400' : 'text-slate-300'} font-bold`}>
                      {agent.cyclesSinceRevenue} cycles
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>ID: {agent.id.slice(0, 8)}...</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Healthy
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Culled / Dead Agents Log */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Skull className="w-5 h-5 text-rose-400" />
              Darwinian Cull Registry (Killed Agents)
            </h2>
            <span className="text-xs font-mono text-slate-400">
              {deadAgents.length} agents terminated to preserve compute budget
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Agent ID</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Model Tier</th>
                  <th className="p-3">Final Score</th>
                  <th className="p-3">Kill Reason</th>
                  <th className="p-3">Terminated At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {deadAgents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500 font-sans">
                      No agents currently culled. All active workers meeting performance thresholds.
                    </td>
                  </tr>
                ) : (
                  deadAgents.map(agent => (
                    <tr key={agent.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 text-slate-400">{agent.id.slice(0, 10)}...</td>
                      <td className="p-3 text-white font-bold">{agent.role}</td>
                      <td className="p-3 text-slate-400">{agent.modelTier}</td>
                      <td className="p-3 text-rose-400 font-bold">{agent.performanceScore.toFixed(1)}</td>
                      <td className="p-3 text-rose-300 font-sans">{agent.killReason || 'Cycles without revenue limit reached'}</td>
                      <td className="p-3 text-slate-500">
                        {agent.lastActiveTime ? new Date(agent.lastActiveTime).toLocaleString() : 'Recent'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
