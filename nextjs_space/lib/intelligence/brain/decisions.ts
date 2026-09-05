import { prisma } from '@/lib/core/db';
import { BrainMetricsSnapshot } from '@/lib/intelligence/brain/metrics';

export interface ProposedDecision {
  type: 'insight' | 'action';
  title: string;
  description: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  parameters: Record<string, any>;
  autoExecutable: boolean;
}

export async function generateBrainDecisions(metrics: BrainMetricsSnapshot): Promise<ProposedDecision[]> {
  const decisions: ProposedDecision[] = [];

  // Decision 1 (LOW RISK): Re-engagement pulse if active users < total users * 0.5
  if (metrics.totalUsers > 5 && metrics.activeUsers7d < metrics.totalUsers * 0.5) {
    decisions.push({
      type: 'action',
      title: 'Dispatch High-Velocity Opportunity Digest',
      description: 'Trigger an automated email digest highlighting the top 3 surging Power Moves to inactive registered operators.',
      riskLevel: 'LOW',
      autoExecutable: process.env.BRAIN_AUTO_ACTION_ENABLED === 'true',
      parameters: {
        actionKey: 'send_reengagement_digest',
        targetAudience: 'inactive_7d_users',
        estimatedImpact: '+18% weekly active sessions',
      },
    });
  }

  // Decision 2 (MEDIUM RISK): Boost featured score for top-performing tasks
  decisions.push({
    type: 'insight',
    title: 'Recalibrate Trending Velocity Weights',
    description: 'Optimize task ranking algorithm by increasing weight on zero-cost AI agents to match current market completion spikes.',
    riskLevel: 'MEDIUM',
    autoExecutable: false, // Requires Admin HITL approval
    parameters: {
      actionKey: 'recalibrate_task_weights',
      targetCategory: 'AI_TOOLS',
      recommendedBoost: '+15%',
    },
  });

  // Decision 3 (HIGH RISK): Pro tier pricing & quota expansion recommendation
  if (metrics.totalAgentRuns >= 20 && metrics.agentSuccessRate > 90) {
    decisions.push({
      type: 'insight',
      title: 'Expand Pro Swarm Quotas to Enterprise Tiers',
      description: 'Demand signals indicate high repeat agent usage. Recommended proposal to add an Enterprise multi-seat agent tier at $99/mo.',
      riskLevel: 'HIGH',
      autoExecutable: false, // Requires explicit human review
      parameters: {
        actionKey: 'create_enterprise_plan',
        proposedPrice: '$99/mo',
        proposedQuota: 'Unlimited + Dedicated Worker Queues',
      },
    });
  }

  // Persist generated decisions into database if not present
  for (const d of decisions) {
    const existing = await prisma.brainDecision.findFirst({
      where: {
        title: d.title,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    if (!existing) {
      await prisma.brainDecision.create({
        data: {
          type: d.type,
          title: d.title,
          description: d.description,
          riskLevel: d.riskLevel,
          parameters: d.parameters as any,
          outcome: 'pending',
        },
      });
    }
  }

  return decisions;
}

/**
 * Execute or Approve a Decision (HITL Admin action)
 */
export async function resolveBrainDecision(decisionId: string, action: 'approved' | 'rejected', adminId: string) {
  const decision = await prisma.brainDecision.findUnique({
    where: { id: decisionId },
  });

  if (!decision) throw new Error('Decision not found');

  const updated = await prisma.brainDecision.update({
    where: { id: decisionId },
    data: {
      outcome: action === 'approved' ? 'executed' : 'rejected',
      executedBy: adminId,
    },
  });

  return updated;
}
