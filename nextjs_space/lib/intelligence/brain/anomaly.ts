import { BrainMetricsSnapshot } from '@/lib/intelligence/brain/metrics';
import { prisma } from '@/lib/core/db';

export interface AnomalyReport {
  id: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  description: string;
  recommendedAction: string;
  metric: string;
  currentValue: number;
  threshold: number;
}

const MONTHLY_BUDGET_CAP_USD = Number(process.env.BRAIN_LLM_COST_BUDGET) || 200;

export async function detectAnomalies(metrics: BrainMetricsSnapshot): Promise<AnomalyReport[]> {
  const anomalies: AnomalyReport[] = [];

  // 1. LLM Cost Budget Cap Alert (> $200 / month)
  if (metrics.estimatedLlmCostMonth >= MONTHLY_BUDGET_CAP_USD * 0.8) {
    const isCritical = metrics.estimatedLlmCostMonth >= MONTHLY_BUDGET_CAP_USD;
    anomalies.push({
      id: 'anomaly_llm_cost_budget',
      severity: isCritical ? 'CRITICAL' : 'WARNING',
      title: isCritical ? 'LLM Monthly Cost Budget Exceeded' : 'LLM Cost Approaching $200 Cap',
      description: `Current month LLM cost is $${metrics.estimatedLlmCostMonth} vs. configured budget cap of $${MONTHLY_BUDGET_CAP_USD}.`,
      recommendedAction: 'Throttle non-essential agent background runs or switch to quantized mini models.',
      metric: 'llm_cost_monthly_usd',
      currentValue: metrics.estimatedLlmCostMonth,
      threshold: MONTHLY_BUDGET_CAP_USD,
    });
  }

  // 2. High Agent Error Rate (> 10%)
  if (metrics.totalAgentRuns >= 5 && metrics.systemErrorRatePercent > 10) {
    anomalies.push({
      id: 'anomaly_agent_error_rate',
      severity: 'CRITICAL',
      title: 'Agent Error Rate Spike Detected',
      description: `Swarm failure rate reached ${metrics.systemErrorRatePercent}% across ${metrics.totalAgentRuns} recent runs.`,
      recommendedAction: 'Inspect circuit breaker status and verify external Reddit/Polymarket API gateway availability.',
      metric: 'system_error_rate',
      currentValue: metrics.systemErrorRatePercent,
      threshold: 10,
    });
  }

  // 3. Low Active User Engagement (< 20% 7-day retention)
  if (metrics.totalUsers >= 10 && (metrics.activeUsers7d / metrics.totalUsers) < 0.25) {
    anomalies.push({
      id: 'anomaly_user_engagement_drop',
      severity: 'WARNING',
      title: 'User Retention Below Target',
      description: `7-day active user count is ${metrics.activeUsers7d} (${Math.round((metrics.activeUsers7d / metrics.totalUsers) * 100)}% of total users).`,
      recommendedAction: 'Schedule weekly trending opportunity digest email dispatch to re-engage registered operators.',
      metric: 'active_users_7d',
      currentValue: metrics.activeUsers7d,
      threshold: Math.ceil(metrics.totalUsers * 0.25),
    });
  }

  // Record detected anomalies as pending decisions if not already recorded today
  for (const a of anomalies) {
    const existing = await prisma.brainDecision.findFirst({
      where: {
        type: 'anomaly',
        title: a.title,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    if (!existing) {
      await prisma.brainDecision.create({
        data: {
          type: 'anomaly',
          title: a.title,
          description: a.description,
          riskLevel: a.severity === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
          parameters: a as any,
          outcome: 'pending',
        },
      });
    }
  }

  return anomalies;
}
