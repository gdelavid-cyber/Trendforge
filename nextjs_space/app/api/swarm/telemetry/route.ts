export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';
import { getSessionUser, requireAdminUser } from '@/lib/core/route-auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const adminUser = await requireAdminUser();
  const isAdmin = Boolean(adminUser);

  try {
    // 1. Scraper Health Check
    const latestLogs = await prisma.trendIngestionLog.findMany({
      orderBy: { executedAt: 'desc' },
      take: 10,
    });

    let health: {
      status: 'LIVE' | 'STALE' | 'BLOCKED' | 'NEVER_RUN';
      lastRunAt: string | null;
      lastSource: string | null;
      recordsIngested: number;
      errorMessage: string | null;
      minutesSinceLastRun: number | null;
    };

    if (latestLogs.length === 0) {
      health = {
        status: 'NEVER_RUN',
        lastRunAt: null,
        lastSource: null,
        recordsIngested: 0,
        errorMessage: null,
        minutesSinceLastRun: null,
      };
    } else {
      const workerLog = latestLogs.find((l) => l.source === 'SCRAPLING_WORKER');
      const newest = workerLog || latestLogs[0];
      const now = Date.now();
      const minutesSinceLastRun = Math.floor(
        (now - new Date(newest.executedAt).getTime()) / (1000 * 60)
      );

      let status: 'LIVE' | 'STALE' | 'BLOCKED' | 'NEVER_RUN' = 'LIVE';
      if (newest.status === 'FAILED' || (newest.recordsIngested === 0 && Boolean(newest.errorMessage))) {
        status = 'BLOCKED';
      } else if (minutesSinceLastRun > 45) {
        status = 'STALE';
      }

      health = {
        status,
        lastRunAt: newest.executedAt ? new Date(newest.executedAt).toISOString() : null,
        lastSource: newest.source,
        recordsIngested: newest.recordsIngested,
        errorMessage: isAdmin ? (newest.errorMessage ?? null) : null,
        minutesSinceLastRun,
      };
    }

    // 2. Subsystem Census
    const [
      trendCount,
      taskCount,
      executionLogCount,
      agentActivityLogCount,
      swarmBrainDecisionCount,
      novaTraceCount,
      autonomousAgentCount,
      web4AgentCount,
      swarmTaskCount,
      assetJobCount,
    ] = await prisma.$transaction([
      prisma.trend.count(),
      prisma.task.count(),
      prisma.executionLog.count(),
      prisma.agentActivityLog.count(),
      prisma.swarmBrainDecision.count(),
      prisma.novaTrace.count(),
      prisma.autonomousAgent.count(),
      prisma.web4Agent.count(),
      prisma.swarmTask.count(),
      prisma.assetJob.count(),
    ]);

    const counts = {
      trend: trendCount,
      task: taskCount,
      executionLog: executionLogCount,
      agentActivityLog: agentActivityLogCount,
      swarmBrainDecision: swarmBrainDecisionCount,
      novaTrace: novaTraceCount,
      autonomousAgent: autonomousAgentCount,
      web4Agent: web4AgentCount,
      swarmTask: swarmTaskCount,
      assetJob: assetJobCount,
    };

    // 3. Autonomous Agents
    const agents = await prisma.autonomousAgent.findMany({
      select: {
        id: true,
        role: true,
        status: true,
        performanceScore: true,
        tasksCompleted: true,
        tasksFailed: true,
        cyclesSinceRevenue: true,
        lastActiveTime: true,
      },
      orderBy: { lastActiveTime: 'desc' },
      take: 20,
    });

    // 4. Web4 Agents
    const web4Agents = await prisma.web4Agent.findMany({
      select: {
        id: true,
        name: true,
        archetype: true,
        status: true,
        walletBalance: true,
        survivalScore: true,
        lastActive: true,
      },
      orderBy: { lastActive: 'desc' },
      take: 10,
    });

    // 5. Species (admin only)
    let species: any[] | undefined = undefined;
    if (isAdmin) {
      species = await prisma.agentSpecies.findMany({
        select: {
          id: true,
          role: true,
          name: true,
          status: true,
          targetHeadcount: true,
          dailyBudgetUsd: true,
          currentSpendUsd: true,
        },
        take: 20,
      });
    }

    // 6. Active Jobs
    const rawJobs = await prisma.assetJob.findMany({
      where: {
        stage: { notIn: ['COMPLETED', 'FAILED'] },
      },
      select: {
        id: true,
        slot: true,
        rarity: true,
        stage: true,
        priority: true,
        attempts: true,
        totalCostUsd: true,
        errorMessage: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const jobs = rawJobs.map((j) => ({
      id: j.id,
      slot: j.slot,
      rarity: j.rarity,
      stage: j.stage,
      priority: j.priority,
      attempts: j.attempts,
      totalCostUsd: isAdmin ? j.totalCostUsd : undefined,
      errorMessage: isAdmin ? j.errorMessage : null,
      createdAt: j.createdAt ? new Date(j.createdAt).toISOString() : null,
    }));

    // 7. Merged Event Log from 4 sources
    const [rawExecLogs, rawActivityLogs, rawDecisions, rawTraces] = await Promise.all([
      prisma.executionLog.findMany({
        select: { id: true, logType: true, actionDescription: true, timestamp: true },
        orderBy: { timestamp: 'desc' },
        take: 40,
      }),
      prisma.agentActivityLog.findMany({
        select: { id: true, agentRole: true, activity: true, actionType: true, cost: true, timestamp: true },
        orderBy: { timestamp: 'desc' },
        take: 40,
      }),
      prisma.swarmBrainDecision.findMany({
        select: { id: true, decisionType: true, reasoning: true, confidenceScore: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 40,
      }),
      prisma.novaTrace.findMany({
        select: { id: true, kind: true, subject: true, summary: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 40,
      }),
    ]);

    interface EventLogItem {
      id: string;
      timestamp: string;
      type: 'EXECUTION' | 'AGENT' | 'DECISION' | 'TRACE';
      label: string;
      text: string;
      cost?: number;
      confidence?: number;
    }

    const events: EventLogItem[] = [];

    for (const l of rawExecLogs) {
      events.push({
        id: l.id,
        timestamp: l.timestamp ? new Date(l.timestamp).toISOString() : new Date().toISOString(),
        type: 'EXECUTION',
        label: l.logType,
        text: l.actionDescription,
      });
    }

    for (const a of rawActivityLogs) {
      const item: EventLogItem = {
        id: a.id,
        timestamp: a.timestamp ? new Date(a.timestamp).toISOString() : new Date().toISOString(),
        type: 'AGENT',
        label: a.agentRole,
        text: a.activity ?? a.actionType ?? '',
      };
      if (isAdmin && typeof a.cost === 'number') {
        item.cost = a.cost;
      }
      events.push(item);
    }

    for (const d of rawDecisions) {
      events.push({
        id: d.id,
        timestamp: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
        type: 'DECISION',
        label: d.decisionType,
        text: d.reasoning,
        confidence: d.confidenceScore,
      });
    }

    for (const t of rawTraces) {
      events.push({
        id: t.id,
        timestamp: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
        type: 'TRACE',
        label: t.kind,
        text: `${t.subject} — ${t.summary}`,
      });
    }

    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const eventLog = events.slice(0, 40);

    const payload: any = {
      success: true,
      health,
      counts,
      agents,
      web4Agents,
      jobs,
      eventLog,
    };

    if (isAdmin && species !== undefined) {
      payload.species = species;
    }

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error('[SWARM_TELEMETRY] Failed to assemble telemetry:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to assemble telemetry' },
      { status: 500 }
    );
  }
}
