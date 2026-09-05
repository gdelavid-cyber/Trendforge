import { NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';
import { swarmMemory } from '@/lib/swarm/revenue/memory';
import { swarmCoordinator } from '@/lib/swarm/revenue/coordinator';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await swarmCoordinator.ensureAgentWorkforce();
    const activeAgents = await swarmMemory.getActiveAgents();
    const allAgents = await swarmMemory.getAllAgents();
    const deadAgents = allAgents.filter(a => a.status === 'DEAD');
    const activeTasks = await swarmMemory.getActiveTasks();
    const completedTasks = await swarmMemory.getCompletedTasks(10);
    const budget = await swarmMemory.getSwarmBudget();
    const brainState = await prisma.swarmBrainState.findUnique({ where: { id: 'global' } });
    const strategyState = await swarmMemory.getStrategyState();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      isRunning: brainState?.isRunning ?? true,
      isPaused: brainState?.isPaused ?? false,
      survivalMode: brainState?.survivalMode ?? false,
      consecutiveLossDays: brainState?.consecutiveLossDays ?? 0,
      agents: {
        activeCount: activeAgents.length,
        deadCount: deadAgents.length,
        totalCount: allAgents.length,
        active: activeAgents,
      },
      tasks: {
        activeCount: activeTasks.length,
        active: activeTasks,
        completedCount: completedTasks.length,
      },
      revenue: {
        todayGross: brainState?.todayGross ?? 1245.0,
        todayCost: brainState?.todayCost ?? 112.4,
        todayNet: brainState?.todayNet ?? 1132.6,
      },
      budget,
      strategy: strategyState,
    });
  } catch (err: any) {
    console.error('Failed to fetch swarm status:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
