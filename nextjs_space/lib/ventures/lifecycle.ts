/**
 * Trendly OS — Venture Lifecycle & State Machine Governor
 * 
 * Enforces the deterministic 16-stage economic lifecycle:
 * DISCOVERED -> RESEARCHING -> VALIDATING -> VALIDATED -> BUILDING ->
 * READY_TO_SELL -> SELLING -> FIRST_REVENUE -> DELIVERING -> PROFITABLE -> SCALING
 * with branching to PAUSED, KILLED, and ARCHIVED.
 * 
 * Strictly validates data prerequisites at each stage:
 * - VALIDATED requires verified demand validation report
 * - READY_TO_SELL requires configured venture offer
 * - FIRST_REVENUE requires VERIFIED financial record with real revenue
 * - PROFITABLE requires positive net profit
 */

import { prisma } from '@/lib/prisma';
import { VentureLifecycleState, Venture } from '@prisma/client';
import {
  transitionVentureState,
  createVenture,
  getVentureDetails,
  CreateVentureInput,
  TransitionStateInput,
} from '@/lib/venture/engine';

export {
  VentureLifecycleState,
  createVenture,
  getVentureDetails,
};

export type { CreateVentureInput, TransitionStateInput };

/**
 * Valid state transition graph.
 */
export const LIFECYCLE_STAGES: VentureLifecycleState[] = [
  VentureLifecycleState.DISCOVERED,
  VentureLifecycleState.RESEARCHING,
  VentureLifecycleState.VALIDATING,
  VentureLifecycleState.VALIDATED,
  VentureLifecycleState.BUILDING,
  VentureLifecycleState.READY_TO_SELL,
  VentureLifecycleState.SELLING,
  VentureLifecycleState.FIRST_REVENUE,
  VentureLifecycleState.DELIVERING,
  VentureLifecycleState.PROFITABLE,
  VentureLifecycleState.SCALING,
  VentureLifecycleState.PAUSED,
  VentureLifecycleState.KILLED,
  VentureLifecycleState.ARCHIVED,
];

/**
 * Returns allowed next stages for a given lifecycle state.
 */
export function getPermittedNextStages(currentState: VentureLifecycleState): VentureLifecycleState[] {
  const transitions: Record<VentureLifecycleState, VentureLifecycleState[]> = {
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
    ARCHIVED: [],
  };

  return transitions[currentState] || [];
}

/**
 * Transitions a venture to the requested next lifecycle stage.
 * Validates prerequisites and state machine legality.
 */
export async function transitionStage(
  ventureId: string,
  nextStage: VentureLifecycleState,
  evidence: Record<string, any> = {},
  actor: string = 'VENTURE_GOVERNOR',
  reason?: string
): Promise<Venture> {
  const defaultReason = reason || `Transitioning venture to ${nextStage}`;

  const updated = await transitionVentureState({
    ventureId,
    toState: nextStage,
    actor,
    reason: defaultReason,
    evidence,
  });

  return updated;
}

/**
 * Returns current lifecycle stage and details for a venture.
 */
export async function getVentureStage(ventureId: string): Promise<{
  stage: VentureLifecycleState;
  permittedNextStages: VentureLifecycleState[];
  venture: Venture | null;
}> {
  const venture = await prisma.venture.findUnique({
    where: { id: ventureId },
  });

  if (!venture) {
    throw new Error(`Venture not found: ${ventureId}`);
  }

  return {
    stage: venture.lifecycleState,
    permittedNextStages: getPermittedNextStages(venture.lifecycleState),
    venture,
  };
}
