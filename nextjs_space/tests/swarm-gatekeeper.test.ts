import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../lib/core/db';
import {
  checkGate,
  isGlobalKillSwitchActive,
  recordSpeciesFailure,
  recordSpeciesSuccess,
  setGlobalKillSwitch,
} from '../lib/swarm/gatekeeper';
import { GLOBAL_DAILY_BUDGET_CAP_USD } from '../lib/swarm/gatekeeper';
import { SpeciesRole, SpeciesStatus } from '@prisma/client';

// Integration tests for the swarm gatekeeper against the dev database.
// All species rows and the kill-switch are snapshotted and restored.

interface SpeciesSnapshot {
  id: string;
  currentSpendUsd: number;
  dailyBudgetUsd: number;
  status: SpeciesStatus;
  spendResetAt: Date;
}

let speciesSnapshot: SpeciesSnapshot[];
let killSwitchSnapshot: boolean;

async function normalizeTarget(role: SpeciesRole) {
  return prisma.agentSpecies.update({
    where: { role },
    data: {
      currentSpendUsd: 0,
      dailyBudgetUsd: 6.0,
      status: SpeciesStatus.ACTIVE,
      spendResetAt: new Date(),
    },
  });
}

beforeAll(async () => {
  speciesSnapshot = await prisma.agentSpecies.findMany();
  killSwitchSnapshot = await isGlobalKillSwitchActive();
});

afterEach(async () => {
  await setGlobalKillSwitch(false);
  await prisma.agentSpecies.updateMany({
    data: { status: SpeciesStatus.ACTIVE, currentSpendUsd: 0 },
  });
});

afterAll(async () => {
  for (const sp of speciesSnapshot) {
    await prisma.agentSpecies.update({
      where: { id: sp.id },
      data: {
        currentSpendUsd: sp.currentSpendUsd,
        dailyBudgetUsd: sp.dailyBudgetUsd,
        status: sp.status,
        spendResetAt: sp.spendResetAt,
      },
    });
  }
  await setGlobalKillSwitch(killSwitchSnapshot);
  await prisma.$disconnect();
});

describe('swarm gatekeeper', () => {
  describe('global kill switch (DB-backed)', () => {
    it('persists across reads and blocks every species while active', async () => {
      const designer = await normalizeTarget(SpeciesRole.DESIGNER);

      await setGlobalKillSwitch(true);
      expect(await isGlobalKillSwitchActive()).toBe(true);

      const gate = await checkGate(designer);
      expect(gate.allowed).toBe(false);
      expect(gate.reason).toContain('kill-switch');
    });

    it('allows execution again once deactivated', async () => {
      const designer = await normalizeTarget(SpeciesRole.DESIGNER);

      await setGlobalKillSwitch(true);
      await setGlobalKillSwitch(false);

      expect(await isGlobalKillSwitchActive()).toBe(false);
      const gate = await checkGate(designer);
      expect(gate.allowed).toBe(true);
    });
  });

  describe('daily spend reset', () => {
    it('resets stale spend from a previous UTC day without blocking', async () => {
      const yesterday = new Date(Date.now() - 26 * 60 * 60 * 1000);
      const modeler = await prisma.agentSpecies.update({
        where: { role: SpeciesRole.MODELER },
        data: { currentSpendUsd: 3.25, spendResetAt: yesterday, status: SpeciesStatus.ACTIVE },
      });

      const gate = await checkGate(modeler);
      expect(gate.allowed).toBe(true);

      const after = await prisma.agentSpecies.findUniqueOrThrow({ where: { id: modeler.id } });
      expect(after.currentSpendUsd).toBe(0);
    });

    it('keeps same-day spend untouched', async () => {
      const scout = await prisma.agentSpecies.update({
        where: { role: SpeciesRole.SCOUT },
        data: { currentSpendUsd: 1.1, spendResetAt: new Date(), status: SpeciesStatus.ACTIVE },
      });

      await checkGate(scout);

      const after = await prisma.agentSpecies.findUniqueOrThrow({ where: { id: scout.id } });
      expect(after.currentSpendUsd).toBeCloseTo(1.1, 6);
    });
  });

  describe('species status gate', () => {
    it('blocks non-ACTIVE species', async () => {
      const artWorker = await prisma.agentSpecies.update({
        where: { role: SpeciesRole.ART_WORKER },
        data: { status: SpeciesStatus.THROTTLED, currentSpendUsd: 0, spendResetAt: new Date() },
      });

      const gate = await checkGate(artWorker);
      expect(gate.allowed).toBe(false);
      expect(gate.reason).toContain('THROTTLED');
    });
  });

  describe('per-species budget ceiling', () => {
    it('blocks and auto-throttles when daily spend reaches the ceiling', async () => {
      const publisher = await prisma.agentSpecies.update({
        where: { role: SpeciesRole.PUBLISHER },
        data: { currentSpendUsd: 6.0, dailyBudgetUsd: 6.0, status: SpeciesStatus.ACTIVE, spendResetAt: new Date() },
      });

      const gate = await checkGate(publisher);
      expect(gate.allowed).toBe(false);
      expect(gate.reason).toContain('exceeded daily budget');

      const after = await prisma.agentSpecies.findUniqueOrThrow({ where: { id: publisher.id } });
      expect(after.status).toBe(SpeciesStatus.THROTTLED);
    });
  });

  describe('global daily cap', () => {
    it(`blocks every species once swarm-wide spend hits $${GLOBAL_DAILY_BUDGET_CAP_USD}`, async () => {
      // Isolate the cap: everything at zero except one species at the cap.
      await prisma.agentSpecies.updateMany({ data: { currentSpendUsd: 0 } });
      const designer = await prisma.agentSpecies.update({
        where: { role: SpeciesRole.DESIGNER },
        data: {
          currentSpendUsd: GLOBAL_DAILY_BUDGET_CAP_USD,
          dailyBudgetUsd: 50.0,
          status: SpeciesStatus.ACTIVE,
          spendResetAt: new Date(),
        },
      });

      const gate = await checkGate(designer);
      expect(gate.allowed).toBe(false);
      expect(gate.reason).toContain('Global swarm daily spend cap');
    });
  });

  describe('circuit breaker integration', () => {
    it('opens after repeated failures and recovers on success', async () => {
      const qa = await normalizeTarget(SpeciesRole.QA_INSPECTOR);

      recordSpeciesFailure(SpeciesRole.QA_INSPECTOR);
      recordSpeciesFailure(SpeciesRole.QA_INSPECTOR);
      expect((await checkGate(qa)).allowed).toBe(true);

      recordSpeciesFailure(SpeciesRole.QA_INSPECTOR);
      const open = await checkGate(qa);
      expect(open.allowed).toBe(false);
      expect(open.reason).toContain('Circuit breaker OPEN');

      recordSpeciesSuccess(SpeciesRole.QA_INSPECTOR);
      expect((await checkGate(qa)).allowed).toBe(true);
    });
  });
});
