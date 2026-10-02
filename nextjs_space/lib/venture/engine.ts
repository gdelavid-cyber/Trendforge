/**
 * Trendly Venture OS — Venture Engine & State Machine
 * 
 * Enforces explicit lifecycle transitions, records all state change evidence,
 * maintains venture memory, and governs the Venture Graveyard.
 */

import { prisma } from '@/lib/prisma';
import {
  VentureLifecycleState,
  VentureBusinessModel,
  AutonomyLevel,
  RiskLevel,
  Prisma,
} from '@prisma/client';
import { instrumentedJevCall } from '@/lib/observability/collector';

export interface CreateVentureInput {
  userId: string;
  name: string;
  description?: string;
  businessModel?: VentureBusinessModel;
  problem: string;
  targetCustomer: string;
  industry: string;
  hypothesis?: string;
  riskLevel?: RiskLevel;
  autonomyLevel?: AutonomyLevel;
  capitalAllocatedCents?: number;
}

export interface TransitionStateInput {
  ventureId: string;
  toState: VentureLifecycleState;
  actor: string; // 'CEO_AGENT' | 'USER' | 'FINANCE_ENGINE' | 'OPS_AGENT'
  reason: string;
  evidence?: Record<string, any>;
  skipValidation?: boolean;
}

/**
 * Valid state transition graph.
 * Only permitted transitions may occur.
 */
const VALID_TRANSITIONS: Record<VentureLifecycleState, VentureLifecycleState[]> = {
  DISCOVERED: [VentureLifecycleState.RESEARCHING, VentureLifecycleState.VALIDATING, VentureLifecycleState.KILLED],
  RESEARCHING: [VentureLifecycleState.VALIDATING, VentureLifecycleState.KILLED, VentureLifecycleState.PAUSED],
  VALIDATING: [VentureLifecycleState.VALIDATED, VentureLifecycleState.KILLED, VentureLifecycleState.PAUSED],
  VALIDATED: [VentureLifecycleState.BUILDING, VentureLifecycleState.READY_TO_SELL, VentureLifecycleState.PAUSED, VentureLifecycleState.KILLED],
  BUILDING: [VentureLifecycleState.READY_TO_SELL, VentureLifecycleState.PAUSED, VentureLifecycleState.KILLED],
  READY_TO_SELL: [VentureLifecycleState.SELLING, VentureLifecycleState.PAUSED, VentureLifecycleState.KILLED],
  SELLING: [VentureLifecycleState.FIRST_REVENUE, VentureLifecycleState.PAUSED, VentureLifecycleState.KILLED],
  FIRST_REVENUE: [VentureLifecycleState.DELIVERING, VentureLifecycleState.PROFITABLE, VentureLifecycleState.SCALING, VentureLifecycleState.PAUSED],
  DELIVERING: [VentureLifecycleState.PROFITABLE, VentureLifecycleState.SELLING, VentureLifecycleState.PAUSED, VentureLifecycleState.KILLED],
  PROFITABLE: [VentureLifecycleState.SCALING, VentureLifecycleState.PAUSED, VentureLifecycleState.KILLED],
  SCALING: [VentureLifecycleState.PROFITABLE, VentureLifecycleState.PAUSED, VentureLifecycleState.KILLED],
  PAUSED: [
    VentureLifecycleState.RESEARCHING,
    VentureLifecycleState.VALIDATING,
    VentureLifecycleState.BUILDING,
    VentureLifecycleState.READY_TO_SELL,
    VentureLifecycleState.SELLING,
    VentureLifecycleState.DELIVERING,
    VentureLifecycleState.SCALING,
    VentureLifecycleState.KILLED,
    VentureLifecycleState.ARCHIVED,
  ],
  KILLED: [VentureLifecycleState.ARCHIVED],
  ARCHIVED: [], // Terminal state
};

/**
 * Creates a unique slug for a venture.
 */
function generateSlug(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${base}-${rand}`;
}

/**
 * Creates a new Venture entity in the DISCOVERED state.
 */
export async function createVenture(input: CreateVentureInput) {
  const slug = generateSlug(input.name);

  const venture = await prisma.venture.create({
    data: {
      userId: input.userId,
      name: input.name,
      slug,
      description: input.description,
      lifecycleState: VentureLifecycleState.DISCOVERED,
      businessModel: input.businessModel ?? VentureBusinessModel.AI_SAAS,
      problem: input.problem,
      targetCustomer: input.targetCustomer,
      industry: input.industry,
      hypothesis: input.hypothesis,
      riskLevel: input.riskLevel ?? RiskLevel.MEDIUM,
      autonomyLevel: input.autonomyLevel ?? AutonomyLevel.LEVEL_3,
      capitalAllocatedCents: input.capitalAllocatedCents ?? 0,
      capitalConsumedCents: 0,
      revenueCents: 0,
      costCents: 0,
      profitCents: 0,
    },
  });

  // Record initial state transition
  await prisma.ventureTransition.create({
    data: {
      ventureId: venture.id,
      fromState: VentureLifecycleState.DISCOVERED,
      toState: VentureLifecycleState.DISCOVERED,
      actor: 'VENTURE_ENGINE',
      reason: 'Venture initialized from market opportunity',
      evidenceJson: { initialProblem: input.problem, targetCustomer: input.targetCustomer },
    },
  });

  return venture;
}

/**
 * Executes a verified lifecycle state machine transition.
 * Validates prerequisite conditions before allowing transition.
 */
export async function transitionVentureState(input: TransitionStateInput) {
  const { ventureId, toState, actor, reason, evidence = {}, skipValidation = false } = input;

  const venture = await prisma.venture.findUnique({
    where: { id: ventureId },
    include: {
      financialRecords: true,
      validations: true,
      offers: true,
    },
  });

  if (!venture) {
    throw new Error(`Venture not found: ${ventureId}`);
  }

  const currentState = venture.lifecycleState;

  // 1. Verify transition graph legality
  if (!skipValidation && currentState !== toState) {
    const allowedTargets = VALID_TRANSITIONS[currentState] || [];
    if (!allowedTargets.includes(toState)) {
      throw new Error(
        `Illegal state transition from ${currentState} to ${toState}. Permitted: ${allowedTargets.join(', ')}`
      );
    }
  }

  // 2. Enforce objective data-backed prerequisites
  if (!skipValidation) {
    if (toState === VentureLifecycleState.VALIDATED) {
      const hasValidation = venture.validations.some((v) => v.recommendation === 'VALIDATE');
      if (!hasValidation) {
        throw new Error(`Cannot transition to VALIDATED: No positive DemandValidationReport recorded.`);
      }
    }

    if (toState === VentureLifecycleState.READY_TO_SELL) {
      if (venture.offers.length === 0) {
        throw new Error(`Cannot transition to READY_TO_SELL: At least one VentureOffer must be created.`);
      }
    }

    if (toState === VentureLifecycleState.FIRST_REVENUE) {
      const verifiedRevenue = venture.financialRecords.filter(
        (f) => f.type === 'REVENUE' && f.provenance === 'VERIFIED'
      );
      if (verifiedRevenue.length === 0) {
        throw new Error(`Cannot transition to FIRST_REVENUE: No VERIFIED financial revenue record exists.`);
      }
    }

    if (toState === VentureLifecycleState.PROFITABLE) {
      const netProfit = venture.revenueCents - venture.costCents;
      if (netProfit <= 0) {
        throw new Error(`Cannot transition to PROFITABLE: Net profit is ${netProfit} cents (must be > 0).`);
      }
    }
  }

  // 3. Jev gating check for autonomous agents
  let decisionLogId: string | undefined;
  if (actor.includes('AGENT')) {
    try {
      const { askJev } = await import('@/lib/intelligence/decision/jev');
      const questions = {
        approve_transition: {
          type: 'choice',
          options: ['allowed', 'blocked'],
          description: `Approve state transition of Venture "${venture.name}" from ${currentState} to ${toState}?`,
        },
      };
      const res = await instrumentedJevCall(
        {
          gateType: 'approval',
          threshold: 0.85,
          state: { ventureId, currentState, toState, reason, evidence },
          questions,
          userId: venture.userId,
        },
        () => askJev({ ventureId, currentState, toState, reason, evidence }, questions)
      );
      decisionLogId = (res as any)?.logId;
      if ((res as any)?.decision?.approve_transition === 'blocked') {
        throw new Error(`State transition blocked by Jev gatekeeper`);
      }
    } catch (err: any) {
      if (err.message?.includes('blocked by Jev')) throw err;
      // non-blocking fallback if Jev offline
    }
  }

  // 4. Atomic update of state & transition log
  const updatedVenture = await prisma.$transaction(async (tx) => {
    const updated = await tx.venture.update({
      where: { id: ventureId },
      data: {
        lifecycleState: toState,
      },
    });

    await tx.ventureTransition.create({
      data: {
        ventureId,
        fromState: currentState,
        toState,
        actor,
        reason,
        evidenceJson: evidence,
        decisionLogId: decisionLogId || null,
      },
    });

    return updated;
  });

  return updatedVenture;
}

/**
 * Retrieves full venture details including economic health, customers, offers, and transition audit history.
 */
export async function getVentureDetails(ventureId: string) {
  const venture = await prisma.venture.findUnique({
    where: { id: ventureId },
    include: {
      transitions: { orderBy: { createdAt: 'desc' }, take: 20 },
      signals: { take: 10 },
      validations: { orderBy: { validatedAt: 'desc' }, take: 5 },
      hypotheses: { take: 5 },
      offers: true,
      customers: { take: 25 },
      leads: { take: 25 },
      proposals: { take: 10 },
      fulfillmentOrders: { take: 10 },
      financialRecords: { orderBy: { createdAt: 'desc' }, take: 50 },
      experiments: true,
      memories: { orderBy: { createdAt: 'desc' }, take: 20 },
      approvalRequests: { where: { status: 'PENDING' } },
      capitalPlans: { take: 1 },
    },
  });

  if (!venture) return null;

  // Reconcile real-time financial stats
  let verifiedRevenueCents = 0;
  let totalCostCents = 0;

  for (const record of venture.financialRecords) {
    if (record.type === 'REVENUE' && record.provenance === 'VERIFIED') {
      verifiedRevenueCents += record.amountCents;
    } else if (record.type !== 'REVENUE') {
      totalCostCents += record.amountCents;
    }
  }

  const netProfitCents = verifiedRevenueCents - totalCostCents;
  const marginPct = verifiedRevenueCents > 0 ? (netProfitCents / verifiedRevenueCents) * 100 : 0;

  return {
    ...venture,
    reconciledMetrics: {
      verifiedRevenueCents,
      totalCostCents,
      netProfitCents,
      marginPct: Math.round(marginPct * 10) / 10,
      activeCustomerCount: venture.customers.filter((c) => c.status === 'ACTIVE').length,
      leadCount: venture.leads.length,
      pendingApprovalCount: venture.approvalRequests.length,
    },
  };
}

/**
 * Venture Graveyard: Fetches killed or archived ventures with retrospective lessons.
 */
export async function getVentureGraveyard(userId?: string) {
  const where: Prisma.VentureWhereInput = {
    lifecycleState: { in: [VentureLifecycleState.KILLED, VentureLifecycleState.ARCHIVED] },
  };
  if (userId) where.userId = userId;

  return prisma.venture.findMany({
    where,
    include: {
      memories: true,
      transitions: { orderBy: { createdAt: 'desc' }, take: 5 },
      financialRecords: true,
    },
    orderBy: { updatedAt: 'desc' },
  });
}
