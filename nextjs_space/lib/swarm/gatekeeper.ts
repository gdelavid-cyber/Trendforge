import { prisma } from '@/lib/core/db';
import { recordTrace } from '@/lib/growth/nova/traces';
import { AgentSpecies, SpeciesStatus } from '@prisma/client';
import { canExecute, recordFailure, recordSuccess } from '@/lib/agents/circuit-breaker';

export const GLOBAL_DAILY_BUDGET_CAP_USD = 15.0;
const CONTROL_ROW_ID = 'global';

/**
 * Kill-switch state is persisted in the DB (SwarmControl singleton) so it is
 * shared across all processes: cron routes, admin API, scripts and serverless
 * instances. Redis is intentionally not used here — a safety switch must not
 * depend on optional infrastructure.
 */
export async function setGlobalKillSwitch(enabled: boolean): Promise<void> {
  await prisma.swarmControl.upsert({
    where: { id: CONTROL_ROW_ID },
    update: { killSwitch: enabled },
    create: { id: CONTROL_ROW_ID, killSwitch: enabled },
  });
}

export async function isGlobalKillSwitchActive(): Promise<boolean> {
  const control = await prisma.swarmControl.findUnique({
    where: { id: CONTROL_ROW_ID },
    select: { killSwitch: true },
  });
  return control?.killSwitch ?? false;
}

/**
 * Checks and resets daily spend at 00:00 UTC if spendResetAt is from a previous day.
 */
export async function checkDailySpendReset(species: AgentSpecies): Promise<AgentSpecies> {
  const now = new Date();
  const lastReset = new Date(species.spendResetAt);

  const isNewDay =
    now.getUTCFullYear() !== lastReset.getUTCFullYear() ||
    now.getUTCMonth() !== lastReset.getUTCMonth() ||
    now.getUTCDate() !== lastReset.getUTCDate();

  if (isNewDay) {
    const updated = await prisma.agentSpecies.update({
      where: { id: species.id },
      data: {
        currentSpendUsd: 0.0,
        spendResetAt: now,
        status: species.status === SpeciesStatus.THROTTLED ? SpeciesStatus.ACTIVE : species.status,
      },
    });
    return updated;
  }

  return species;
}

/**
 * Evaluates gatekeeper rules before allowing a species worker to execute.
 */
export async function checkGate(
  species: AgentSpecies
): Promise<{ allowed: boolean; reason?: string }> {
  // N3: every denial emits a platform why-trace (no user context at this layer).
  const deny = (reason: string) => {
    void recordTrace({ userId: null, kind: 'GATE', subject: species.name ?? 'species', summary: 'Swarm gate denied execution.', reasons: [reason] });
    return { allowed: false, reason };
  };
  // 1. Global Kill-Switch Check
  const killSwitchActive = await isGlobalKillSwitchActive();
  if (killSwitchActive) {
    return deny('Global swarm kill-switch is active. All worker executions halted.');
  }

  // 2. Daily Spend Reset Check
  const currentSpecies = await checkDailySpendReset(species);

  // 3. Species Status Check
  if (currentSpecies.status !== SpeciesStatus.ACTIVE) {
    return deny(`Species ${currentSpecies.name} status is ${currentSpecies.status}. Execution blocked.`);
  }

  // 4. Per-Species Daily Budget Ceiling Check
  if (currentSpecies.dailyBudgetUsd > 0 && currentSpecies.currentSpendUsd >= currentSpecies.dailyBudgetUsd) {
    // Auto-throttle species
    await prisma.agentSpecies.update({
      where: { id: currentSpecies.id },
      data: { status: SpeciesStatus.THROTTLED },
    });
    return deny(`Species ${currentSpecies.name} exceeded daily budget ($${currentSpecies.currentSpendUsd.toFixed(2)} / $${currentSpecies.dailyBudgetUsd.toFixed(2)}). Auto-throttled.`);
  }

  // 5. Global Swarm Daily Budget Cap Check ($15.00/day)
  const allSpecies = await prisma.agentSpecies.findMany({
    select: { currentSpendUsd: true },
  });
  const totalSpendToday = allSpecies.reduce((acc, s) => acc + (s.currentSpendUsd || 0), 0);
  if (totalSpendToday >= GLOBAL_DAILY_BUDGET_CAP_USD) {
    return deny(`Global swarm daily spend cap reached ($${totalSpendToday.toFixed(2)} / $${GLOBAL_DAILY_BUDGET_CAP_USD.toFixed(2)}).`);
  }

  // 6. Parameterized Circuit Breaker Check per Species Role
  const circuit = canExecute(`species_${currentSpecies.role.toLowerCase()}`);
  if (!circuit.allowed) {
    return deny(circuit.reason || `Circuit breaker OPEN for ${currentSpecies.name}.`);
  }

  return { allowed: true };
}

export function recordSpeciesSuccess(role: string): void {
  recordSuccess(`species_${role.toLowerCase()}`);
}

export function recordSpeciesFailure(role: string): void {
  recordFailure(`species_${role.toLowerCase()}`);
}
