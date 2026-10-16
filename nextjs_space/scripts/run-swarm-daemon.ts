/**
 * Trendly OS — Continuous Swarm & Autonomous Lifecycle Daemon
 * 
 * Unattended background runner that autonomously drives:
 * 1. Market Opportunity Ingestion (VentureFactory)
 * 2. Swarm Agent Task Processing (StarNetOrchestrator)
 * 3. Autonomous Stage Advancement & Circuit Breaker Governance (AutonomyGovernor)
 * 
 * Usage:
 *   npx tsx scripts/run-swarm-daemon.ts          # Continuous loop (default 60s cycle)
 *   npx tsx scripts/run-swarm-daemon.ts --once   # Single evaluation sweep
 *   npx tsx scripts/run-swarm-daemon.ts --interval 30
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { batchProcessMarketSignals } from '@/lib/ventures/factory';
import { StarNetOrchestrator } from '@/lib/swarm/orchestrator';
import { runAutonomousLoop } from '@/lib/ventures/autonomy';

const args = process.argv.slice(2);
const isOnce = args.includes('--once');
const intervalIdx = args.indexOf('--interval');
const intervalSeconds = intervalIdx !== -1 && args[intervalIdx + 1] ? parseInt(args[intervalIdx + 1], 10) : 60;

let isRunning = true;
process.on('SIGINT', () => {
  console.log('\n[Daemon] Received SIGINT. Shutting down cleanly...');
  isRunning = false;
});
process.on('SIGTERM', () => {
  console.log('\n[Daemon] Received SIGTERM. Shutting down cleanly...');
  isRunning = false;
});

async function runCycle(cycleNumber: number) {
  const startTime = Date.now();
  console.log(`\n======================================================`);
  console.log(`[Daemon] Cycle #${cycleNumber} started at ${new Date().toISOString()}`);
  console.log(`======================================================`);

  const orchestrator = StarNetOrchestrator.getInstance();

  // 1. Process Market Signals into DISCOVERED ventures
  console.log(`[1/3] Scanning active market signals...`);
  try {
    const factoryResult = await batchProcessMarketSignals(2);
    console.log(`      Spawned ${factoryResult.processedCount} new ventures from signals.`);
  } catch (err: any) {
    console.error(`      Factory error:`, err?.message);
  }

  // 2. Drain pending StarNet tasks (up to 5 per cycle)
  console.log(`[2/3] Processing pending StarNet tasks...`);
  let tasksExecuted = 0;
  for (let i = 0; i < 5; i++) {
    try {
      const taskResult = await orchestrator.processNextPendingTask();
      if (!taskResult) break;
      tasksExecuted++;
      console.log(`      Task executed: [${taskResult.agentRole}] ${taskResult.taskId} (success: ${taskResult.success}, latency: ${taskResult.latencyMs}ms)`);
    } catch (err: any) {
      console.error(`      Task execution error:`, err?.message);
    }
  }
  console.log(`      Total swarm tasks executed in cycle: ${tasksExecuted}`);

  // 3. Autonomous Stage Advancement & Governance Loop
  console.log(`[3/3] Running autonomous lifecycle evaluation sweep...`);
  try {
    const loopSummary = await runAutonomousLoop(20);
    console.log(`      Evaluated ${loopSummary.evaluatedCount} ventures: ${loopSummary.advancedCount} advanced, ${loopSummary.pausedCount} paused.`);
    for (const res of loopSummary.results.filter((r) => r.advanced)) {
      console.log(`      -> Venture ${res.ventureId.slice(-6)}: ${res.fromState} => ${res.toState} (${res.reason})`);
    }
  } catch (err: any) {
    console.error(`      Autonomy evaluation error:`, err?.message);
  }

  const durationMs = Date.now() - startTime;
  console.log(`[Daemon] Cycle #${cycleNumber} completed in ${(durationMs / 1000).toFixed(2)}s`);
}

async function main() {
  console.log(`Trendly OS Autonomous Swarm Daemon initialized.`);
  console.log(`Mode: ${isOnce ? 'ONE-SHOT' : `CONTINUOUS (${intervalSeconds}s interval)`}`);

  let cycle = 1;

  if (isOnce) {
    await runCycle(cycle);
    console.log('[Daemon] One-shot execution complete. Exiting.');
    process.exit(0);
  }

  while (isRunning) {
    await runCycle(cycle++);
    if (!isRunning) break;
    console.log(`[Daemon] Sleeping for ${intervalSeconds}s before next cycle...`);
    await new Promise((resolve) => setTimeout(resolve, intervalSeconds * 1000));
  }

  console.log('[Daemon] Stopped.');
  process.exit(0);
}

main().catch((err) => {
  console.error('[Daemon] Fatal error:', err);
  process.exit(1);
});
