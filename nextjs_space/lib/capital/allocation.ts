/**
 * Trendly Venture OS — Capital Allocation Engine
 * 
 * Enforces hard spending limits, daily burn caps, and automated profit reinvestment.
 * Never exceeds user-defined capital constraints.
 */

import { prisma } from '@/lib/prisma';
import { calculateVentureEconomics } from '@/lib/finance/ledger';

export interface SetCapitalPlanInput {
  ventureId: string;
  allocatedCents: number;
  maxDailyBurnCents?: number;
  hardStopThresholdCents?: number;
  reinvestmentPercentage?: number;
}

export interface SpendAuthorizationRequest {
  ventureId: string;
  amountCents: number;
  spendCategory: 'AI_COMPUTE' | 'INFRA' | 'MARKETING' | 'TOOL_API' | 'OTHER';
  description: string;
}

export interface SpendAuthorizationResponse {
  authorized: boolean;
  reason: string;
  currentConsumedCents: number;
  remainingAllocatedCents: number;
  dailyBurnCents: number;
}

/**
 * Configures or updates the capital allocation plan for a venture.
 */
export async function setCapitalAllocationPlan(input: SetCapitalPlanInput) {
  const existing = await prisma.capitalAllocationPlan.findFirst({
    where: { ventureId: input.ventureId },
  });

  if (existing) {
    return prisma.capitalAllocationPlan.update({
      where: { id: existing.id },
      data: {
        allocatedCents: input.allocatedCents,
        maxDailyBurnCents: input.maxDailyBurnCents ?? existing.maxDailyBurnCents,
        hardStopThresholdCents: input.hardStopThresholdCents ?? existing.hardStopThresholdCents,
        reinvestmentPercentage: input.reinvestmentPercentage ?? existing.reinvestmentPercentage,
      },
    });
  }

  return prisma.capitalAllocationPlan.create({
    data: {
      ventureId: input.ventureId,
      allocatedCents: input.allocatedCents,
      consumedCents: 0,
      maxDailyBurnCents: input.maxDailyBurnCents ?? 5000, // $50/day default
      hardStopThresholdCents: input.hardStopThresholdCents ?? 50000, // $500 hard stop default
      reinvestmentPercentage: input.reinvestmentPercentage ?? 20, // 20% reinvestment default
    },
  });
}

/**
 * Authorizes or rejects an autonomous spend request against capital controls.
 */
export async function authorizeSpend(input: SpendAuthorizationRequest): Promise<SpendAuthorizationResponse> {
  const { ventureId, amountCents, spendCategory, description } = input;

  const plan = await prisma.capitalAllocationPlan.findFirst({
    where: { ventureId },
  });

  const defaultAllocated = 10000; // $100 baseline
  const maxDaily = plan?.maxDailyBurnCents ?? 5000;
  const hardStop = plan?.hardStopThresholdCents ?? 50000;
  const currentConsumed = plan?.consumedCents ?? 0;
  const totalAllocated = plan?.allocatedCents ?? defaultAllocated;

  // 1. Calculate today's burn from financial records
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todayRecords = await prisma.financialRecord.findMany({
    where: {
      ventureId,
      createdAt: { gte: startOfDay },
      type: { not: 'REVENUE' },
    },
  });

  const todayBurnCents = todayRecords.reduce((acc, r) => acc + r.amountCents, 0);

  // 2. Check Daily Burn Limit
  if (todayBurnCents + amountCents > maxDaily) {
    return {
      authorized: false,
      reason: `Daily burn limit exceeded. Attempted $${((todayBurnCents + amountCents) / 100).toFixed(2)}, max allowed: $${(maxDaily / 100).toFixed(2)}/day.`,
      currentConsumedCents: currentConsumed,
      remainingAllocatedCents: Math.max(0, totalAllocated - currentConsumed),
      dailyBurnCents: todayBurnCents,
    };
  }

  // 3. Check Hard Stop Threshold
  if (currentConsumed + amountCents > hardStop) {
    return {
      authorized: false,
      reason: `Hard-stop threshold reached. Total consumed $${((currentConsumed + amountCents) / 100).toFixed(2)} exceeds cap $${(hardStop / 100).toFixed(2)}.`,
      currentConsumedCents: currentConsumed,
      remainingAllocatedCents: 0,
      dailyBurnCents: todayBurnCents,
    };
  }

  // 4. Update consumed counter if plan exists
  if (plan) {
    await prisma.capitalAllocationPlan.update({
      where: { id: plan.id },
      data: {
        consumedCents: { increment: amountCents },
      },
    });
  }

  return {
    authorized: true,
    reason: `Spend authorized for ${spendCategory}: "${description}".`,
    currentConsumedCents: currentConsumed + amountCents,
    remainingAllocatedCents: Math.max(0, totalAllocated - (currentConsumed + amountCents)),
    dailyBurnCents: todayBurnCents + amountCents,
  };
}

/**
 * Calculates reinvestment budget from verified net profit and updates the allocation pool.
 */
export async function executeProfitReinvestment(ventureId: string) {
  const plan = await prisma.capitalAllocationPlan.findFirst({
    where: { ventureId },
  });

  if (!plan) return null;

  const economics = await calculateVentureEconomics(ventureId);
  if (economics.netProfitCents <= 0) {
    return { reinvestedCents: 0, reason: 'No net profit available for reinvestment.' };
  }

  const reinvestmentAmountCents = Math.round((economics.netProfitCents * plan.reinvestmentPercentage) / 100);

  if (reinvestmentAmountCents > 0) {
    await prisma.capitalAllocationPlan.update({
      where: { id: plan.id },
      data: {
        allocatedCents: { increment: reinvestmentAmountCents },
      },
    });

    // Also update Venture capitalAllocated counter
    await prisma.venture.update({
      where: { id: ventureId },
      data: {
        capitalAllocatedCents: { increment: reinvestmentAmountCents },
      },
    });
  }

  return {
    reinvestedCents: reinvestmentAmountCents,
    newAllocatedCents: plan.allocatedCents + reinvestmentAmountCents,
    reinvestmentPercentage: plan.reinvestmentPercentage,
  };
}
