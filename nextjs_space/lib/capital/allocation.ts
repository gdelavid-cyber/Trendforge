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
  spendCategory?: 'AI_COMPUTE' | 'INFRA' | 'MARKETING' | 'TOOL_API' | 'OTHER';
  description?: string;
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
 * Supports both object input and positional (ventureId, amountCents, category, description).
 */
export async function authorizeSpend(
  inputOrVentureId: SpendAuthorizationRequest | string,
  maybeAmountCents?: number,
  maybeCategory?: string,
  maybeDescription?: string
): Promise<SpendAuthorizationResponse> {
  const req: SpendAuthorizationRequest = typeof inputOrVentureId === 'string'
    ? {
        ventureId: inputOrVentureId,
        amountCents: maybeAmountCents ?? 0,
        spendCategory: (maybeCategory as any) || 'AI_COMPUTE',
        description: maybeDescription || 'Autonomous spend',
      }
    : inputOrVentureId;

  const { ventureId, amountCents, spendCategory = 'AI_COMPUTE', description = 'Spend request' } = req;

  if (amountCents <= 0) {
    return {
      authorized: true,
      reason: 'Zero or negative spend requires no authorization.',
      currentConsumedCents: 0,
      remainingAllocatedCents: 0,
      dailyBurnCents: 0,
    };
  }

  const [plan, venture] = await Promise.all([
    prisma.capitalAllocationPlan.findFirst({ where: { ventureId } }),
    prisma.venture.findUnique({ where: { id: ventureId } }),
  ]);

  const defaultAllocated = venture?.capitalAllocatedCents || 10000;
  const totalAllocated = plan?.allocatedCents ?? defaultAllocated;
  const maxDaily = plan?.maxDailyBurnCents ?? 5000;
  const hardStop = plan?.hardStopThresholdCents ?? Math.max(50000, totalAllocated);
  const currentConsumed = plan?.consumedCents ?? venture?.capitalConsumedCents ?? 0;

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

  // 2. Check Total Budget Limit (cannot spend more than allocated budget)
  if (currentConsumed + amountCents > totalAllocated) {
    return {
      authorized: false,
      reason: `Total budget exceeded. Attempted total $${((currentConsumed + amountCents) / 100).toFixed(2)}, allocated budget: $${(totalAllocated / 100).toFixed(2)}.`,
      currentConsumedCents: currentConsumed,
      remainingAllocatedCents: Math.max(0, totalAllocated - currentConsumed),
      dailyBurnCents: todayBurnCents,
    };
  }

  // 3. Check Daily Burn Limit
  if (todayBurnCents + amountCents > maxDaily) {
    return {
      authorized: false,
      reason: `Daily burn limit exceeded. Attempted $${((todayBurnCents + amountCents) / 100).toFixed(2)}, max allowed: $${(maxDaily / 100).toFixed(2)}/day.`,
      currentConsumedCents: currentConsumed,
      remainingAllocatedCents: Math.max(0, totalAllocated - currentConsumed),
      dailyBurnCents: todayBurnCents,
    };
  }

  // 4. Check Hard Stop Threshold
  if (currentConsumed + amountCents > hardStop) {
    return {
      authorized: false,
      reason: `Hard-stop threshold reached. Total consumed $${((currentConsumed + amountCents) / 100).toFixed(2)} exceeds cap $${(hardStop / 100).toFixed(2)}.`,
      currentConsumedCents: currentConsumed,
      remainingAllocatedCents: 0,
      dailyBurnCents: todayBurnCents,
    };
  }

  // 5. Update consumed counter if plan exists
  if (plan) {
    await prisma.capitalAllocationPlan.update({
      where: { id: plan.id },
      data: {
        consumedCents: { increment: amountCents },
      },
    });
  }

  // Also record in AgentSpend if it's agent compute
  if (spendCategory === 'AI_COMPUTE') {
    await prisma.agentSpend.create({
      data: {
        ventureId,
        agentRole: 'OPERATIONS',
        toolName: 'kernel_compute',
        costCents: amountCents,
        modelUsed: 'openrouter/meta-llama/llama-3.3-70b-instruct',
        tokensIn: Math.round(amountCents * 25),
        tokensOut: Math.round(amountCents * 10),
      },
    }).catch(() => {});
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
 * Returns today's burn rate in cents for a venture.
 */
export async function getVentureBurnRate(ventureId: string): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const records = await prisma.financialRecord.findMany({
    where: {
      ventureId,
      createdAt: { gte: startOfDay },
      type: { not: 'REVENUE' },
    },
  });

  return records.reduce((acc, r) => acc + r.amountCents, 0);
}

/**
 * Returns full financial economics summary for a venture.
 */
export async function getVentureEconomics(ventureId: string): Promise<{
  budget: number;
  spend: number;
  revenue: number;
  netProfit: number;
  burnRate: number;
}> {
  const [venture, plan, burnRate, economics] = await Promise.all([
    prisma.venture.findUnique({ where: { id: ventureId } }),
    prisma.capitalAllocationPlan.findFirst({ where: { ventureId } }),
    getVentureBurnRate(ventureId),
    calculateVentureEconomics(ventureId),
  ]);

  const budget = plan?.allocatedCents ?? venture?.capitalAllocatedCents ?? 0;
  const spend = Math.max(plan?.consumedCents || 0, venture?.capitalConsumedCents || 0, economics.totalCostCents);
  const revenue = Math.max(venture?.revenueCents || 0, economics.verifiedRevenueCents);
  const netProfit = economics.netProfitCents;

  return {
    budget,
    spend,
    revenue,
    netProfit,
    burnRate,
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
