/**
 * Trendly OS — Autonomous Venture Lifecycle Advancer & Governor
 * 
 * Periodically evaluates active ventures against deterministic, data-backed gates.
 * Seamlessly advances ventures through their 16-stage lifecycle when objective
 * prerequisites are met, or pauses them and alerts human operators when limits are breached.
 */

import { prisma } from '@/lib/prisma';
import { Venture, VentureLifecycleState, ApprovalStatus, RiskLevel } from '@prisma/client';
import { transitionStage } from '@/lib/ventures/lifecycle';
import { getVentureEconomics, getVentureBurnRate } from '@/lib/capital/allocation';
import { StarNetOrchestrator } from '@/lib/swarm/orchestrator';

export interface AutonomyEvaluationResult {
  ventureId: string;
  fromState: VentureLifecycleState;
  toState: VentureLifecycleState;
  advanced: boolean;
  reason: string;
  actionsQueued: string[];
}

export interface AutonomyLoopSummary {
  evaluatedCount: number;
  advancedCount: number;
  pausedCount: number;
  results: AutonomyEvaluationResult[];
}

/**
 * Evaluates a single venture and advances its lifecycle if all objective gates pass.
 */
export async function evaluateVentureAutonomy(ventureId: string): Promise<AutonomyEvaluationResult> {
  const venture = await prisma.venture.findUnique({
    where: { id: ventureId },
    include: {
      validations: true,
      offers: true,
      financialRecords: true,
      starNetTasks: true,
    },
  });

  if (!venture) {
    throw new Error(`Venture not found: ${ventureId}`);
  }

  const currentState = venture.lifecycleState;
  const actionsQueued: string[] = [];
  const orchestrator = StarNetOrchestrator.getInstance();

  // 1. SAFETY & CIRCUIT BREAKERS: Check burn rate and total budget
  const [economics, plan] = await Promise.all([
    getVentureEconomics(venture.id),
    prisma.capitalAllocationPlan.findFirst({ where: { ventureId: venture.id } }),
  ]);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todayAgentSpends = await prisma.agentSpend.aggregate({
    where: {
      ventureId: venture.id,
      createdAt: { gte: startOfDay },
    },
    _sum: { costCents: true },
  });

  const totalBurnTodayCents = economics.burnRate + (todayAgentSpends._sum.costCents || 0);
  const maxDailyBurnCents = plan?.maxDailyBurnCents ?? 5000;
  const hardStopThreshold = plan?.hardStopThresholdCents ?? economics.budget;

  const isBreached = totalBurnTodayCents >= maxDailyBurnCents || (economics.spend >= hardStopThreshold && hardStopThreshold > 0);

  if (isBreached) {
    if (currentState !== VentureLifecycleState.PAUSED && currentState !== VentureLifecycleState.KILLED) {
      // Create Human Approval Request
      await prisma.approvalRequest.create({
        data: {
          ventureId: venture.id,
          userId: venture.userId,
          proposedAction: 'CAPITAL_LIMIT_OVERRIDE',
          agentRole: 'GOVERNOR',
          riskLevel: RiskLevel.HIGH,
          estimatedCostCents: totalBurnTodayCents,
          status: ApprovalStatus.PENDING,
          rationale: `Venture reached daily burn cap ($${totalBurnTodayCents / 100}/$${maxDailyBurnCents / 100}) or reached spending threshold ($${economics.spend / 100}/$${hardStopThreshold / 100}). Automatically paused.`,
        },
      });

      const paused = await transitionStage(
        venture.id,
        VentureLifecycleState.PAUSED,
        { burn: totalBurnTodayCents, economics },
        'AUTONOMY_GOVERNOR',
        'Daily burn limit or total budget breached. Paused for human approval.'
      );

      return {
        ventureId: venture.id,
        fromState: currentState,
        toState: paused.lifecycleState,
        advanced: true,
        reason: 'Paused due to capital threshold breach',
        actionsQueued,
      };
    }
  }

  // 2. STAGE-BY-STAGE DETERMINISTIC ADVANCEMENT
  switch (currentState) {
    case VentureLifecycleState.DISCOVERED: {
      // Transition DISCOVERED -> RESEARCHING -> VALIDATING
      await transitionStage(venture.id, VentureLifecycleState.RESEARCHING, {}, 'AUTONOMY_GOVERNOR');
      const advanced = await transitionStage(venture.id, VentureLifecycleState.VALIDATING, {}, 'AUTONOMY_GOVERNOR');
      
      // Ensure ARCHITECT task is queued
      const hasValidationTask = venture.starNetTasks.some((t) => t.taskType === 'DEMAND_VALIDATION');
      if (!hasValidationTask) {
        await orchestrator.queueTask(venture.id, 'ARCHITECT', 'DEMAND_VALIDATION', {
          problem: venture.problem,
          targetCustomer: venture.targetCustomer,
        });
        actionsQueued.push('Queued ARCHITECT DEMAND_VALIDATION task');
      }

      return {
        ventureId: venture.id,
        fromState: currentState,
        toState: advanced.lifecycleState,
        advanced: true,
        reason: 'Advanced to VALIDATING and assigned research task to ARCHITECT',
        actionsQueued,
      };
    }

    case VentureLifecycleState.VALIDATING: {
      const positiveValidation = venture.validations.find((v) => v.recommendation === 'VALIDATE');
      if (positiveValidation) {
        const advanced = await transitionStage(
          venture.id,
          VentureLifecycleState.VALIDATED,
          { reportId: positiveValidation.id },
          'AUTONOMY_GOVERNOR',
          'Demand validated by research evidence.'
        );

        // Queue BUILDER to formulate offer
        await orchestrator.queueTask(venture.id, 'BUILDER', 'OFFER_CREATION', {
          targetCustomer: venture.targetCustomer,
          problem: venture.problem,
        });
        actionsQueued.push('Queued BUILDER OFFER_CREATION task');

        return {
          ventureId: venture.id,
          fromState: currentState,
          toState: advanced.lifecycleState,
          advanced: true,
          reason: 'Demand validated; advanced to VALIDATED and assigned BUILDER',
          actionsQueued,
        };
      }
      return {
        ventureId: venture.id,
        fromState: currentState,
        toState: currentState,
        advanced: false,
        reason: 'Awaiting positive DemandValidationReport',
        actionsQueued,
      };
    }

    case VentureLifecycleState.VALIDATED: {
      // Advance to BUILDING
      const advanced = await transitionStage(
        venture.id,
        VentureLifecycleState.BUILDING,
        {},
        'AUTONOMY_GOVERNOR',
        'Commencing product offering construction.'
      );
      return {
        ventureId: venture.id,
        fromState: currentState,
        toState: advanced.lifecycleState,
        advanced: true,
        reason: 'Advanced to BUILDING',
        actionsQueued,
      };
    }

    case VentureLifecycleState.BUILDING: {
      const activeOffer = venture.offers.find((o) => o.isLive || o.priceCents > 0);
      if (activeOffer) {
        const advanced = await transitionStage(
          venture.id,
          VentureLifecycleState.READY_TO_SELL,
          { offerId: activeOffer.id },
          'AUTONOMY_GOVERNOR',
          'VentureOffer active and pricing ready.'
        );

        // Queue MARKETER and CLOSER
        await orchestrator.queueTask(venture.id, 'MARKETER', 'GTM_OUTREACH', { offerId: activeOffer.id });
        await orchestrator.queueTask(venture.id, 'CLOSER', 'PIPELINE_INITIATION', { offerId: activeOffer.id });
        actionsQueued.push('Queued MARKETER and CLOSER acquisition tasks');

        return {
          ventureId: venture.id,
          fromState: currentState,
          toState: advanced.lifecycleState,
          advanced: true,
          reason: 'Offer ready; advanced to READY_TO_SELL',
          actionsQueued,
        };
      }
      return {
        ventureId: venture.id,
        fromState: currentState,
        toState: currentState,
        advanced: false,
        reason: 'Awaiting active VentureOffer creation',
        actionsQueued,
      };
    }

    case VentureLifecycleState.READY_TO_SELL: {
      const advanced = await transitionStage(
        venture.id,
        VentureLifecycleState.SELLING,
        {},
        'AUTONOMY_GOVERNOR',
        'Activating commercial outbound and sales pipeline.'
      );
      return {
        ventureId: venture.id,
        fromState: currentState,
        toState: advanced.lifecycleState,
        advanced: true,
        reason: 'Advanced to SELLING',
        actionsQueued,
      };
    }

    case VentureLifecycleState.SELLING: {
      const verifiedRevenue = venture.financialRecords.some(
        (f) => f.type === 'REVENUE' && f.provenance === 'VERIFIED'
      );
      if (verifiedRevenue) {
        const advanced = await transitionStage(
          venture.id,
          VentureLifecycleState.FIRST_REVENUE,
          {},
          'AUTONOMY_GOVERNOR',
          'Verified initial customer revenue captured.'
        );
        return {
          ventureId: venture.id,
          fromState: currentState,
          toState: advanced.lifecycleState,
          advanced: true,
          reason: 'Verified customer revenue detected; advanced to FIRST_REVENUE',
          actionsQueued,
        };
      }
      return {
        ventureId: venture.id,
        fromState: currentState,
        toState: currentState,
        advanced: false,
        reason: 'Awaiting verified customer revenue payment',
        actionsQueued,
      };
    }

    case VentureLifecycleState.FIRST_REVENUE: {
      const advanced = await transitionStage(
        venture.id,
        VentureLifecycleState.DELIVERING,
        {},
        'AUTONOMY_GOVERNOR',
        'Fulfilling orders and maintaining client success.'
      );
      return {
        ventureId: venture.id,
        fromState: currentState,
        toState: advanced.lifecycleState,
        advanced: true,
        reason: 'Advanced to DELIVERING',
        actionsQueued,
      };
    }

    case VentureLifecycleState.DELIVERING: {
      if (economics.netProfit > 0) {
        const advanced = await transitionStage(
          venture.id,
          VentureLifecycleState.PROFITABLE,
          { netProfitCents: economics.netProfit },
          'AUTONOMY_GOVERNOR',
          'Venture achieved verified net profitability.'
        );
        return {
          ventureId: venture.id,
          fromState: currentState,
          toState: advanced.lifecycleState,
          advanced: true,
          reason: 'Net profit positive; advanced to PROFITABLE',
          actionsQueued,
        };
      }
      return {
        ventureId: venture.id,
        fromState: currentState,
        toState: currentState,
        advanced: false,
        reason: 'Awaiting positive net profit',
        actionsQueued,
      };
    }

    case VentureLifecycleState.PROFITABLE: {
      if (economics.revenue >= economics.budget * 3 && economics.budget > 0) {
        const advanced = await transitionStage(
          venture.id,
          VentureLifecycleState.SCALING,
          { revenueCents: economics.revenue },
          'AUTONOMY_GOVERNOR',
          'Revenue reached 3x initial budget. Expanding capacity.'
        );
        return {
          ventureId: venture.id,
          fromState: currentState,
          toState: advanced.lifecycleState,
          advanced: true,
          reason: 'Revenue exceeded 3x budget; advanced to SCALING',
          actionsQueued,
        };
      }
      return {
        ventureId: venture.id,
        fromState: currentState,
        toState: currentState,
        advanced: false,
        reason: 'Operating profitably; awaiting 3x budget threshold for SCALING',
        actionsQueued,
      };
    }

    default:
      return {
        ventureId: venture.id,
        fromState: currentState,
        toState: currentState,
        advanced: false,
        reason: `State ${currentState} does not automatically advance`,
        actionsQueued,
      };
  }
}

/**
 * Runs one complete autonomous evaluation sweep across all active ventures.
 */
export async function runAutonomousLoop(limit: number = 20): Promise<AutonomyLoopSummary> {
  const activeVentures = await prisma.venture.findMany({
    where: {
      lifecycleState: {
        notIn: [VentureLifecycleState.PAUSED, VentureLifecycleState.KILLED, VentureLifecycleState.ARCHIVED],
      },
    },
    take: limit,
    orderBy: { updatedAt: 'asc' },
  });

  const results: AutonomyEvaluationResult[] = [];
  let advancedCount = 0;
  let pausedCount = 0;

  for (const v of activeVentures) {
    try {
      const res = await evaluateVentureAutonomy(v.id);
      results.push(res);
      if (res.advanced) {
        if (res.toState === VentureLifecycleState.PAUSED) {
          pausedCount++;
        } else {
          advancedCount++;
        }
      }
    } catch (err: any) {
      console.error(`[AutonomyLoop] Error evaluating venture ${v.id}:`, err?.message);
    }
  }

  return {
    evaluatedCount: activeVentures.length,
    advancedCount,
    pausedCount,
    results,
  };
}
