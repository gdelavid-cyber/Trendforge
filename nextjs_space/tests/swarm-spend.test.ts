import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../lib/db';
import { recordSpend } from '../lib/swarm/spend';
import { SpeciesStatus } from '@prisma/client';

// Exercises recordSpend against the real seeded ART_WORKER species row.
// Original state is snapshotted and restored so drills/pulses are unaffected.

const ROLE = 'ART_WORKER';

interface SpeciesSnapshot {
  currentSpendUsd: number;
  dailyBudgetUsd: number;
  status: SpeciesStatus;
}

let snapshot: SpeciesSnapshot;

async function resetSpecies(data: Partial<SpeciesSnapshot>) {
  await prisma.agentSpecies.update({ where: { role: ROLE }, data });
}

beforeAll(async () => {
  const sp = await prisma.agentSpecies.findUniqueOrThrow({ where: { role: ROLE } });
  snapshot = {
    currentSpendUsd: sp.currentSpendUsd,
    dailyBudgetUsd: sp.dailyBudgetUsd,
    status: sp.status,
  };
  await resetSpecies({ currentSpendUsd: 0, dailyBudgetUsd: 6.0, status: SpeciesStatus.ACTIVE });
});

afterAll(async () => {
  await prisma.agentSpecies.update({ where: { role: ROLE }, data: snapshot });
  await prisma.$disconnect();
});

describe('swarm spend ledger', () => {
  it('no-ops and reports state when amount is zero', async () => {
    const before = await prisma.agentSpecies.findUniqueOrThrow({ where: { role: ROLE } });

    const result = await recordSpend(before.id, null, null, 0);

    expect(result.success).toBe(true);
    expect(result.isThrottled).toBe(false);
    expect(result.speciesCurrentSpend).toBe(0);
    expect(result.speciesBudget).toBe(6.0);

    const after = await prisma.agentSpecies.findUniqueOrThrow({ where: { role: ROLE } });
    expect(after.currentSpendUsd).toBe(before.currentSpendUsd);
    expect(after.status).toBe(SpeciesStatus.ACTIVE);
  });

  it('increments species spend atomically without throttling under budget', async () => {
    const sp = await prisma.agentSpecies.findUniqueOrThrow({ where: { role: ROLE } });

    const result = await recordSpend(sp.id, null, null, 1.0);

    expect(result.speciesCurrentSpend).toBeCloseTo(1.0, 6);
    expect(result.isThrottled).toBe(false);

    const after = await prisma.agentSpecies.findUniqueOrThrow({ where: { role: ROLE } });
    expect(after.status).toBe(SpeciesStatus.ACTIVE);
  });

  it('auto-throttles the species when its own daily budget is reached', async () => {
    const sp = await prisma.agentSpecies.findUniqueOrThrow({ where: { role: ROLE } });

    const result = await recordSpend(sp.id, null, null, 5.5);

    expect(result.isThrottled).toBe(true);
    expect(result.speciesCurrentSpend).toBeGreaterThanOrEqual(result.speciesBudget);

    const after = await prisma.agentSpecies.findUniqueOrThrow({ where: { role: ROLE } });
    expect(after.status).toBe(SpeciesStatus.THROTTLED);
  });

  it('throttles at the $15 global cap even when the per-species budget is higher', async () => {
    await resetSpecies({ currentSpendUsd: 0, dailyBudgetUsd: 20.0, status: SpeciesStatus.ACTIVE });
    const sp = await prisma.agentSpecies.findUniqueOrThrow({ where: { role: ROLE } });

    const underCap = await recordSpend(sp.id, null, null, 14.5);
    expect(underCap.isThrottled).toBe(false);

    const overCap = await recordSpend(sp.id, null, null, 0.75);
    expect(overCap.speciesCurrentSpend).toBeGreaterThanOrEqual(15);
    expect(overCap.isThrottled).toBe(true);

    const after = await prisma.agentSpecies.findUniqueOrThrow({ where: { role: ROLE } });
    expect(after.status).toBe(SpeciesStatus.THROTTLED);
  });
});
