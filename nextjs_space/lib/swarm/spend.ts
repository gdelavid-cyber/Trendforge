import { prisma } from '@/lib/db';
import { SpeciesStatus } from '@prisma/client';
import { GLOBAL_DAILY_BUDGET_CAP_USD } from './gatekeeper';

export interface SpendRecordResult {
  success: boolean;
  speciesCurrentSpend: number;
  speciesBudget: number;
  isThrottled: boolean;
}

/**
 * Atomically updates spend on species, instance, and asset job via Prisma $transaction.
 */
export async function recordSpend(
  speciesId: string,
  instanceId?: string | null,
  jobId?: string | null,
  amountUsd: number = 0.0
): Promise<SpendRecordResult> {
  if (amountUsd <= 0) {
    const sp = await prisma.agentSpecies.findUnique({ where: { id: speciesId } });
    return {
      success: true,
      speciesCurrentSpend: sp?.currentSpendUsd || 0,
      speciesBudget: sp?.dailyBudgetUsd || 0,
      isThrottled: sp?.status === SpeciesStatus.THROTTLED,
    };
  }

  const [updatedSpecies] = await prisma.$transaction([
    prisma.agentSpecies.update({
      where: { id: speciesId },
      data: {
        currentSpendUsd: { increment: amountUsd },
      },
    }),
    ...(instanceId
      ? [
          prisma.agentInstance.update({
            where: { id: instanceId },
            data: {
              spendToDateUsd: { increment: amountUsd },
              totalRuns: { increment: 1 },
              heartbeatAt: new Date(),
            },
          }),
        ]
      : []),
    ...(jobId
      ? [
          prisma.assetJob.update({
            where: { id: jobId },
            data: {
              totalCostUsd: { increment: amountUsd },
            },
          }),
        ]
      : []),
  ]);

  const isThrottled =
    (updatedSpecies.dailyBudgetUsd > 0 &&
      updatedSpecies.currentSpendUsd >= updatedSpecies.dailyBudgetUsd) ||
    updatedSpecies.currentSpendUsd >= GLOBAL_DAILY_BUDGET_CAP_USD;

  if (isThrottled && updatedSpecies.status === SpeciesStatus.ACTIVE) {
    await prisma.agentSpecies.update({
      where: { id: speciesId },
      data: { status: SpeciesStatus.THROTTLED },
    });
  }

  return {
    success: true,
    speciesCurrentSpend: updatedSpecies.currentSpendUsd,
    speciesBudget: updatedSpecies.dailyBudgetUsd,
    isThrottled,
  };
}
