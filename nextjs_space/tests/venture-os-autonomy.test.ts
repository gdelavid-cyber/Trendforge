import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { createVenture } from '@/lib/venture/engine';
import { gateAgentAction, resolveApprovalRequest, getPendingApprovals } from '@/lib/autonomy/control-plane';
import { AutonomyLevel, RiskLevel, ApprovalStatus } from '@prisma/client';

describe('Trendly Venture OS — Autonomy Control Plane & Human Approval Center', () => {
  let testUserId: string;
  let ventureId: string;

  beforeEach(async () => {
    const user = await prisma.user.findFirst();
    testUserId = user?.id || 'test_user_id';

    const venture = await createVenture({
      userId: testUserId,
      name: 'Autonomy Policy Test Venture',
      problem: 'Recruiters spend 20 hours filtering resume PDFs.',
      targetCustomer: 'Staffing agencies',
      industry: 'HR Tech',
      autonomyLevel: AutonomyLevel.LEVEL_3,
    });
    ventureId = venture.id;
  });

  it('allows autonomous execution for LOW risk actions under Level 3 autonomy', async () => {
    const decision = await gateAgentAction({
      ventureId,
      userId: testUserId,
      proposedAction: 'Scrape publicly available Reddit posts for resume pain points',
      agentRole: 'RESEARCH',
      riskLevel: RiskLevel.LOW,
      rationale: 'Passive market signal scan with no external writes',
    });

    expect(decision.canExecuteAutonomously).toBe(true);
    expect(decision.requiresHumanApproval).toBe(false);
  });

  it('routes HIGH risk actions to Human Approval Center under Level 3 autonomy', async () => {
    const decision = await gateAgentAction({
      ventureId,
      userId: testUserId,
      proposedAction: 'Deploy new smart contract payment escrow on mainnet',
      agentRole: 'CTO',
      riskLevel: RiskLevel.HIGH,
      estimatedCostCents: 1500,
      rationale: 'Financial rail setup requires operator review',
    });

    expect(decision.canExecuteAutonomously).toBe(false);
    expect(decision.requiresHumanApproval).toBe(true);
    expect(decision.approvalRequestId).toBeDefined();

    const pending = await getPendingApprovals(testUserId, ventureId);
    expect(pending.length).toBeGreaterThanOrEqual(1);
    expect(pending[0].proposedAction).toContain('Deploy new smart contract');
  });

  it('strictly requires human approval for IRREVERSIBLE actions even under Level 5', async () => {
    // Elevate venture to Level 5 (Highest Autonomy)
    await prisma.venture.update({
      where: { id: ventureId },
      data: { autonomyLevel: AutonomyLevel.LEVEL_5 },
    });

    const decision = await gateAgentAction({
      ventureId,
      userId: testUserId,
      proposedAction: 'Drop and re-seed production customer database partition',
      agentRole: 'CTO',
      riskLevel: RiskLevel.HIGH,
      rationale: 'Schema clean-up',
      isIrreversible: true, // Irreversible flag
    });

    expect(decision.canExecuteAutonomously).toBe(false);
    expect(decision.requiresHumanApproval).toBe(true);
    expect(decision.reason).toContain('IRREVERSIBLE');
  });

  it('resolves approval requests via operator review (APPROVED / REJECTED)', async () => {
    const decision = await gateAgentAction({
      ventureId,
      userId: testUserId,
      proposedAction: 'Launch $50/day targeted outreach campaign',
      agentRole: 'GROWTH',
      riskLevel: RiskLevel.MEDIUM,
      estimatedCostCents: 5000,
      rationale: 'Outreach to 100 qualified prospects',
    });

    const requestId = decision.approvalRequestId!;

    // Resolve as APPROVED
    const resolved = await resolveApprovalRequest({
      requestId,
      reviewerUserId: testUserId,
      status: ApprovalStatus.APPROVED,
      reviewNotes: 'Verified campaign budget and messaging compliance.',
    });

    expect(resolved.status).toBe(ApprovalStatus.APPROVED);
    expect(resolved.reviewNotes).toContain('Verified campaign budget');

    const pendingAfter = await getPendingApprovals(testUserId, ventureId);
    expect(pendingAfter.find((p) => p.id === requestId)).toBeUndefined();
  });
});
