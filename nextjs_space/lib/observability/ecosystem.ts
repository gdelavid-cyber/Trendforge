import { prisma } from '@/lib/prisma';
import { ALL_GATE_TYPES } from './metrics';
import { executePredictionArbitrage } from '../agents/prediction-arbitrage';
import { executeRedditScraper } from '../agents/reddit-scraper';

export interface TuningResult {
  gateType: string;
  oldThreshold: number;
  newThreshold: number;
  calibrationError: number;
  reason: string;
}

export interface EcosystemPulseResult {
  timestamp: string;
  autonomousRunsTriggered: number;
  activeThresholdTunings: TuningResult[];
  userActivityDetected: boolean;
  status: string;
}

import { resolveGateThreshold, invalidateGateThresholdCache } from './collector';

export const getDynamicThreshold = resolveGateThreshold;

/**
 * Self-Improving Feedback Loop:
 * Analyzes calibration snapshots per gate.
 * If Jev is overconfident (predicting high prob, but actual outcomes fail) -> raises threshold to tighten safety.
 * If Jev is underconfident (actual accuracy exceeds confidence with low error) -> lowers threshold to capture more volume.
 */
export async function autoTuneGateThresholds(): Promise<TuningResult[]> {
  const results: TuningResult[] = [];
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  for (const gate of ALL_GATE_TYPES) {
    try {
      const snapshots = await prisma.calibrationSnapshot.findMany({
        where: {
          gateType: gate,
          windowStart: { gte: oneWeekAgo },
        },
        orderBy: { windowStart: 'desc' },
      });

      if (snapshots.length === 0) continue;

      let totalDecisions = 0;
      let weightedExpected = 0;
      let weightedActual = 0;
      let avgCalibError = 0;

      for (const s of snapshots) {
        totalDecisions += s.totalDecisions;
        weightedExpected += s.expectedAccuracy * s.totalDecisions;
        weightedActual += s.actualAccuracy * s.totalDecisions;
        avgCalibError += s.calibrationError;
      }

      if (totalDecisions < 10) continue; // Minimum sample threshold before auto-tuning

      const meanExpected = weightedExpected / totalDecisions;
      const meanActual = weightedActual / totalDecisions;
      const meanError = avgCalibError / snapshots.length;
      const overconfidenceBias = meanExpected - meanActual;

      const existingConfig = await prisma.dynamicGateConfig.findUnique({
        where: { gateType: gate },
      });

      const currentThreshold = existingConfig?.currentThreshold ?? 0.85;
      let newThreshold = currentThreshold;
      let reason = 'Threshold calibrated and stable';

      if (overconfidenceBias > 0.08) {
        // Model is overconfident; tighten gate threshold to reject false positives
        const increment = Number(Math.min(0.05, overconfidenceBias * 0.5).toFixed(2));
        newThreshold = Math.min(0.95, Number((currentThreshold + increment).toFixed(2)));
        reason = `Overconfident by ${(overconfidenceBias * 100).toFixed(1)}%. Tightened threshold by +${increment} to block false positives.`;
      } else if (overconfidenceBias < -0.05 && meanActual >= 0.90) {
        // Model is highly accurate and conservative; loosen slightly to expand autonomous throughput
        const decrement = 0.02;
        newThreshold = Math.max(0.70, Number((currentThreshold - decrement).toFixed(2)));
        reason = `High empirical accuracy (${(meanActual * 100).toFixed(1)}%). Loosened threshold by -${decrement} to increase yield.`;
      }

      await prisma.dynamicGateConfig.upsert({
        where: { gateType: gate },
        create: {
          gateType: gate,
          currentThreshold: newThreshold,
          baseThreshold: 0.85,
          calibrationError: Number(meanError.toFixed(4)),
          totalDecisions,
          accuracy: Number(meanActual.toFixed(4)),
          adjustmentReason: reason,
          lastTunedAt: new Date(),
        },
        update: {
          currentThreshold: newThreshold,
          calibrationError: Number(meanError.toFixed(4)),
          totalDecisions,
          accuracy: Number(meanActual.toFixed(4)),
          adjustmentReason: reason,
          lastTunedAt: new Date(),
        },
      });

      // Invalidate cache
      invalidateGateThresholdCache(gate);

      results.push({
        gateType: gate,
        oldThreshold: currentThreshold,
        newThreshold,
        calibrationError: meanError,
        reason,
      });
    } catch (err) {
      console.error(`[Autonomous Ecosystem] Error auto-tuning gate ${gate}:`, err);
    }
  }

  return results;
}

/**
 * Autonomous Growth Engine:
 * When no human users are driving activity, Trendly operates autonomously:
 * 1. Executes autonomous market sweeps and discovery pulses.
 * 2. Exercises decision gates to continuously harvest telemetry.
 * 3. Dynamically re-tunes gate thresholds so accuracy improves on its own.
 */
export async function runAutonomousEcosystemPulse(): Promise<EcosystemPulseResult> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const timestamp = new Date().toISOString();

  // Check for recent user actions
  const recentUserDecisions = await prisma.decisionLog.count({
    where: {
      userId: { not: null },
      createdAt: { gte: oneHourAgo },
    },
  });

  const userActivityDetected = recentUserDecisions > 0;
  let autonomousRunsTriggered = 0;

  // If no user activity detected, autonomous platform worker takes over
  if (!userActivityDetected) {
    console.log('[Autonomous Ecosystem] No user activity detected. Initiating autonomous platform pulse...');

    try {
      // 1. Autonomous Prediction Arbitrage Market Discovery (simulation paper trade)
      await executePredictionArbitrage(
        {
          budget: 0,
          market: 'Polymarket',
          runId: `auto-eco-arb-${Date.now()}`,
        } as any,
        async (msg) => console.log(`[Auto-Eco Arb] ${msg}`)
      );
      autonomousRunsTriggered++;
    } catch (err) {
      console.error('[Autonomous Ecosystem] Error in autonomous arbitrage sweep:', err);
    }

    try {
      // 2. Autonomous Reddit Problem Extraction (topic trend scouting)
      await executeRedditScraper(
        {
          subreddit: 'SaaS',
          topic: 'automated micro-saas',
          maxPosts: 10,
          runId: `auto-eco-reddit-${Date.now()}`,
        } as any,
        async (msg) => console.log(`[Auto-Eco Reddit] ${msg}`)
      );
      autonomousRunsTriggered++;
    } catch (err) {
      console.error('[Autonomous Ecosystem] Error in autonomous scraper sweep:', err);
    }
  }

  // 3. Auto-tune gate thresholds from recent calibration feedback
  const activeThresholdTunings = await autoTuneGateThresholds();

  return {
    timestamp,
    autonomousRunsTriggered,
    activeThresholdTunings,
    userActivityDetected,
    status: 'complete',
  };
}
