import { prisma } from '@/lib/core/db';

export interface BrainMetricsSnapshot {
  timestamp: string;
  totalUsers: number;
  activeUsers7d: number;
  totalTasksCompleted: number;
  totalRevenueUsd: number;
  totalAgentRuns: number;
  agentSuccessRate: number;
  estimatedLlmCostMonth: number;
  systemErrorRatePercent: number;
}

/**
 * Collects and records system-wide telemetry snapshot
 */
export async function collectBrainMetrics(): Promise<BrainMetricsSnapshot> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // 1. Database metrics queries
  const [totalUsers, activeUsers7d, completedUserTasks, paidUsers, agentRuns] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { updatedAt: { gte: sevenDaysAgo } } }),
    prisma.userTask.count({ where: { status: 'COMPLETED' } }),
    prisma.user.count({ where: { role: { in: ['PRO', 'ELITE'] } } }),
    prisma.agentRun.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { status: true, costCents: true },
    }),
  ]);

  // Calculate Agent metrics
  const totalAgentRuns = agentRuns.length;
  const successfulRuns = agentRuns.filter((r) => r.status === 'completed').length;
  const failedRuns = agentRuns.filter((r) => r.status === 'failed').length;
  const agentSuccessRate = totalAgentRuns > 0 ? +( (successfulRuns / totalAgentRuns) * 100 ).toFixed(1) : 100;
  const systemErrorRatePercent = totalAgentRuns > 0 ? +( (failedRuns / totalAgentRuns) * 100 ).toFixed(1) : 0;

  // Estimated monthly costs
  const totalCostCents = agentRuns.reduce((acc, r) => acc + (r.costCents || 10), 0);
  const estimatedLlmCostMonth = +(totalCostCents / 100).toFixed(2);

  // Estimated Monthly Recurring Revenue (MRR)
  const estimatedMonthlyRevenue = paidUsers * 19.0;

  // Store in BrainMetric table for audit & charts
  const metricsToStore = [
    { metricName: 'active_users_7d', value: activeUsers7d, source: 'database' },
    { metricName: 'total_users', value: totalUsers, source: 'database' },
    { metricName: 'tasks_completed', value: completedUserTasks, source: 'database' },
    { metricName: 'agent_runs_30d', value: totalAgentRuns, source: 'database' },
    { metricName: 'agent_success_rate', value: agentSuccessRate, source: 'database' },
    { metricName: 'llm_cost_monthly_usd', value: estimatedLlmCostMonth, source: 'database' },
    { metricName: 'estimated_mrr_usd', value: estimatedMonthlyRevenue, source: 'stripe' },
    { metricName: 'system_error_rate', value: systemErrorRatePercent, source: 'vercel' },
  ];

  for (const m of metricsToStore) {
    try {
      await prisma.brainMetric.create({
        data: {
          metricName: m.metricName,
          value: m.value,
          source: m.source,
          tags: { environment: process.env.NODE_ENV || 'production', region: 'us-east' },
        },
      });
    } catch (_) {}
  }

  return {
    timestamp: now.toISOString(),
    totalUsers,
    activeUsers7d,
    totalTasksCompleted: completedUserTasks,
    totalRevenueUsd: estimatedMonthlyRevenue,
    totalAgentRuns,
    agentSuccessRate,
    estimatedLlmCostMonth,
    systemErrorRatePercent,
  };
}
