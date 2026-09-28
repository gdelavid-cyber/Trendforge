import { prisma } from '../lib/prisma';
import { backfillTradeOutcomes, backfillLeadOutcomes } from '../lib/observability/outcome';
import { snapshotCalibration } from '../lib/observability/metrics';

export interface ObservabilityCycleResult {
  tradesBackfilled: number;
  leadsBackfilled: number;
  snapshotsComputed: number;
  durationMs: number;
  error?: string | null;
}

/**
 * Runs a single cycle of the observability engine:
 * 1. Backfills trade outcomes from settled ledger entries (1-24h window)
 * 2. Backfills lead outcomes from converted buyer leads (7-14d window)
 * 3. Computes calibration snapshots across all 7 gates for the last 7 days
 * 4. Logs the cycle to ObservabilityRun
 */
export async function runObservabilityCycle(): Promise<ObservabilityCycleResult> {
  const startTime = Date.now();
  console.log(`[Observability Worker] Starting cycle at ${new Date().toISOString()}...`);

  let tradesBackfilled = 0;
  let leadsBackfilled = 0;
  let snapshotsComputed = 0;
  let cycleError: string | null = null;

  try {
    tradesBackfilled = await backfillTradeOutcomes();
    leadsBackfilled = await backfillLeadOutcomes();
    snapshotsComputed = await snapshotCalibration();
  } catch (err: any) {
    cycleError = err?.message || String(err);
    console.error('[Observability Worker] Error during cycle execution:', err);
  }

  const durationMs = Date.now() - startTime;

  try {
    await prisma.observabilityRun.create({
      data: {
        tradesBackfilled,
        leadsBackfilled,
        snapshotsComputed,
        durationMs,
        error: cycleError,
      },
    });
    console.log(
      `[Observability Worker] Cycle completed in ${durationMs}ms: ` +
        `Trades=${tradesBackfilled}, Leads=${leadsBackfilled}, Snapshots=${snapshotsComputed}` +
        (cycleError ? ` (Error: ${cycleError})` : '')
    );
  } catch (logErr) {
    console.error('[Observability Worker] Failed to persist ObservabilityRun record:', logErr);
  }

  return {
    tradesBackfilled,
    leadsBackfilled,
    snapshotsComputed,
    durationMs,
    error: cycleError,
  };
}

// Hourly cycle execution via setInterval if run directly
const CYCLE_MS = parseInt(process.env.OBSERVABILITY_CYCLE_MS || '3600000', 10);

import { runAutonomousEcosystemPulse } from '../lib/observability/ecosystem';

async function runWorkerPulse() {
  await runObservabilityCycle();
  try {
    await runAutonomousEcosystemPulse();
  } catch (ecoErr) {
    console.error('[Observability Worker] Ecosystem pulse error:', ecoErr);
  }
}

if (require.main === module || process.argv.includes('--run')) {
  console.log(`[Observability Worker] Daemon initializing. Interval: ${CYCLE_MS}ms`);

  // Run immediately on boot
  runWorkerPulse().catch((err) => {
    console.error('[Observability Worker] Boot pulse failed:', err);
  });

  // Hourly recurring loop
  setInterval(() => {
    runWorkerPulse().catch((err) => {
      console.error('[Observability Worker] Scheduled pulse failed:', err);
    });
  }, CYCLE_MS);
}
