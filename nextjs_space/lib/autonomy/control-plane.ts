/**
 * Trendly Venture OS — Autonomy Control Plane & Human Approval Center
 * 
 * Enforces execution policies across Autonomy Levels 0 to 5.
 * Strictly gates irreversible actions, high financial commitments, and external communications.
 */

import { prisma } from '@/lib/prisma';
import {
  AutonomyLevel,
  ApprovalStatus,
  RiskLevel,
} from '@prisma/client';
import { authorizeSpend } from '@/lib/capital/allocation';

export interface ActionProposalInput {
  ventureId: string;
  userId: string;
  proposedAction: string;
  agentRole: string; // 'CEO' | 'CFO' | 'CTO' | 'SALES' | 'OPS' | 'GROWTH'
  toolName?: string;
  riskLevel: RiskLevel;
  estimatedCostCents?: number;
  rationale: string;
  evidence?: Record<string, any>;
  isIrreversible?: boolean;
}

export interface GateExecutionDecision {
  canExecuteAutonomously: boolean;
  requiresHumanApproval: boolean;
  approvalRequestId?: string;
  reason: string;
}

/**
 * Evaluates whether an agent action can execute autonomously or must wait for human approval.
 */
export async function gateAgentAction(input: ActionProposalInput): Promise<GateExecutionDecision> {
  const { ventureId, userId, proposedAction, agentRole, toolName, riskLevel, estimatedCostCents = 0, rationale, evidence = {}, isIrreversible = false } = input;

  const venture = await prisma.venture.findUnique({
    where: { id: ventureId },
  });

  if (!venture) {
    throw new Error(`Venture not found: ${ventureId}`);
  }

  const level = venture.autonomyLevel;

  // 1. Level 0 & Level 1: Zero autonomous execution allowed
  if (level === AutonomyLevel.LEVEL_0 || level === AutonomyLevel.LEVEL_1) {
    const req = await createApprovalRequest(input);
    return {
      canExecuteAutonomously: false,
      requiresHumanApproval: true,
      approvalRequestId: req.id,
      reason: `Autonomy level ${level} requires human confirmation for all actions.`,
    };
  }

  // 2. Irreversible actions always require approval regardless of autonomy level
  if (isIrreversible) {
    const req = await createApprovalRequest({ ...input, riskLevel: RiskLevel.HIGH });
    return {
      canExecuteAutonomously: false,
      requiresHumanApproval: true,
      approvalRequestId: req.id,
      reason: `Action "${proposedAction}" is marked IRREVERSIBLE and requires human operator sign-off.`,
    };
  }

  // 3. Level 2: Staged actions require explicit approval before execution
  if (level === AutonomyLevel.LEVEL_2) {
    const req = await createApprovalRequest(input);
    return {
      canExecuteAutonomously: false,
      requiresHumanApproval: true,
      approvalRequestId: req.id,
      reason: `Autonomy Level 2 stages actions for review.`,
    };
  }

  // 4. Level 3: Auto-execute LOW risk actions only; MEDIUM & HIGH require approval
  if (level === AutonomyLevel.LEVEL_3 && riskLevel !== RiskLevel.LOW) {
    const req = await createApprovalRequest(input);
    return {
      canExecuteAutonomously: false,
      requiresHumanApproval: true,
      approvalRequestId: req.id,
      reason: `Autonomy Level 3 permits only LOW risk autonomous execution. Current action risk: ${riskLevel}.`,
    };
  }

  // 5. Level 4 & 5: Check Capital & Spend Boundaries
  if (estimatedCostCents > 0) {
    const spendAuth = await authorizeSpend({
      ventureId,
      amountCents: estimatedCostCents,
      spendCategory: 'AI_COMPUTE',
      description: proposedAction,
    });

    if (!spendAuth.authorized) {
      const req = await createApprovalRequest({
        ...input,
        riskLevel: RiskLevel.HIGH,
        rationale: `${rationale} — Spend cap warning: ${spendAuth.reason}`,
      });
      return {
        canExecuteAutonomously: false,
        requiresHumanApproval: true,
        approvalRequestId: req.id,
        reason: spendAuth.reason,
      };
    }
  }

  // 6. Action cleared for autonomous execution
  return {
    canExecuteAutonomously: true,
    requiresHumanApproval: false,
    reason: `Cleared under Autonomy Level ${level} (Risk: ${riskLevel}).`,
  };
}

/**
 * Creates an entry in the Human Approval Center.
 */
async function createApprovalRequest(input: ActionProposalInput) {
  return prisma.humanApprovalRequest.create({
    data: {
      ventureId: input.ventureId,
      userId: input.userId,
      proposedAction: input.proposedAction,
      agentRole: input.agentRole,
      toolName: input.toolName || null,
      riskLevel: input.riskLevel,
      estimatedCostCents: input.estimatedCostCents ?? 0,
      rationale: input.rationale,
      evidenceJson: input.evidence || {},
      status: ApprovalStatus.PENDING,
    },
  });
}

/**
 * Resolves a human approval request (Approve, Reject, Always Allow, Never Allow).
 */
export async function resolveApprovalRequest(input: {
  requestId: string;
  reviewerUserId: string;
  status: ApprovalStatus;
  reviewNotes?: string;
}) {
  const req = await prisma.humanApprovalRequest.findUnique({
    where: { id: input.requestId },
  });

  if (!req) {
    throw new Error(`Approval request not found: ${input.requestId}`);
  }

  return prisma.humanApprovalRequest.update({
    where: { id: input.requestId },
    data: {
      status: input.status,
      reviewNotes: input.reviewNotes || null,
      reviewedByUserId: input.reviewerUserId,
      resolvedAt: new Date(),
    },
  });
}

/**
 * Fetches pending approval queue for a user/venture.
 */
export async function getPendingApprovals(userId: string, ventureId?: string) {
  const where: any = { userId, status: ApprovalStatus.PENDING };
  if (ventureId) where.ventureId = ventureId;

  return prisma.humanApprovalRequest.findMany({
    where,
    include: {
      venture: {
        select: { id: true, name: true, slug: true, lifecycleState: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}
