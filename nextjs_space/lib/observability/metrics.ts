import { prisma } from '@/lib/prisma';

export const ALL_GATE_TYPES = [
  'trade_execution',
  'lead_qualification',
  'approval',
  'completion',
  'ledger_verification',
  'tool_routing',
  'model_routing',
] as const;

export type GateType = (typeof ALL_GATE_TYPES)[number] | (string & {});

export interface CalibrationBucketResult {
  gateType: string;
  bucket: number;
  totalDecisions: number;
  correctDecisions: number;
  actualAccuracy: number;
  expectedAccuracy: number;
  calibrationError: number;
}

export interface GuardEffectivenessResult {
  primaryPattern: string;
  runs: number;
  avgActions: number;
  avgBlocked: number;
  blockRate: number;
  avgCost: number;
  avgDurationMs: number;
  avgValueScore: number | null;
}

/**
 * Computes calibration metrics for a gate type across confidence buckets (0.0 to 1.0 in 0.1 intervals).
 */
export async function computeCalibration(
  gateType: string,
  windowStart: Date,
  windowEnd: Date
): Promise<CalibrationBucketResult[]> {
  const decisions = await prisma.decisionLog.findMany({
    where: {
      gateType,
      primitive: 'noul',
      createdAt: {
        gte: windowStart,
        lte: windowEnd,
      },
      outcome: {
        isNot: null,
      },
    },
    include: {
      outcome: true,
    },
  });

  // 10 equal 10% bins: 0.0, 0.1, 0.2, ..., 0.9 (where 0.9 covers [0.9, 1.0])
  interface BucketAccumulator {
    totalDecisions: number;
    correctDecisions: number;
    probSum: number;
  }

  const buckets: Record<string, BucketAccumulator> = {};
  for (let i = 0; i < 10; i++) {
    const key = (i / 10).toFixed(1);
    buckets[key] = { totalDecisions: 0, correctDecisions: 0, probSum: 0 };
  }

  for (const d of decisions) {
    const answer = d.answer as any;
    const prob = answer?.probability;
    if (typeof prob !== 'number' || isNaN(prob)) continue;

    const clampedProb = Math.max(0, Math.min(1, prob));
    // Bin [0.9, 1.0] into 0.9 to preserve symmetric 10% bin widths
    const bucketNum = Math.min(0.9, Math.floor(clampedProb * 10) / 10);
    const bucketKey = bucketNum.toFixed(1);

    buckets[bucketKey].totalDecisions++;
    buckets[bucketKey].probSum += clampedProb;

    if (d.outcome?.wasCorrect === true) {
      buckets[bucketKey].correctDecisions++;
    }
  }

  const results: CalibrationBucketResult[] = [];

  for (const [key, b] of Object.entries(buckets)) {
    const bucketVal = parseFloat(key);
    if (b.totalDecisions === 0) continue; // Only return buckets that have decisions

    const actualAccuracy = b.correctDecisions / b.totalDecisions;
    const expectedAccuracy = b.probSum / b.totalDecisions;
    const calibrationError = Math.abs(actualAccuracy - expectedAccuracy);

    results.push({
      gateType,
      bucket: bucketVal,
      totalDecisions: b.totalDecisions,
      correctDecisions: b.correctDecisions,
      actualAccuracy: Number(actualAccuracy.toFixed(4)),
      expectedAccuracy: Number(expectedAccuracy.toFixed(4)),
      calibrationError: Number(calibrationError.toFixed(4)),
    });
  }

  return results;
}

/**
 * Snapshots calibration across all 7 gates for the last 7 days window.
 * Saves/upserts into CalibrationSnapshot and returns count of saved rows.
 */
export async function snapshotCalibration(): Promise<number> {
  const windowEnd = new Date();
  const windowStart = new Date(windowEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
  let savedCount = 0;

  for (const gate of ALL_GATE_TYPES) {
    try {
      const bucketMetrics = await computeCalibration(gate, windowStart, windowEnd);

      for (const m of bucketMetrics) {
        await prisma.calibrationSnapshot.upsert({
          where: {
            gateType_confidenceBucket_windowStart: {
              gateType: gate,
              confidenceBucket: m.bucket,
              windowStart,
            },
          },
          create: {
            gateType: gate,
            confidenceBucket: m.bucket,
            windowStart,
            windowEnd,
            totalDecisions: m.totalDecisions,
            correctDecisions: m.correctDecisions,
            actualAccuracy: m.actualAccuracy,
            expectedAccuracy: m.expectedAccuracy,
            calibrationError: m.calibrationError,
          },
          update: {
            windowEnd,
            totalDecisions: m.totalDecisions,
            correctDecisions: m.correctDecisions,
            actualAccuracy: m.actualAccuracy,
            expectedAccuracy: m.expectedAccuracy,
            calibrationError: m.calibrationError,
          },
        });
        savedCount++;
      }
    } catch (err) {
      console.error(`[Observability] Error computing calibration for gate ${gate}:`, err);
    }
  }

  return savedCount;
}

/**
 * Aggregates AgentRunMetrics by primaryPattern over a window in days.
 */
export async function getGuardEffectiveness(
  windowDays = 30
): Promise<GuardEffectivenessResult[]> {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  const metrics = await prisma.agentRunMetrics.findMany({
    where: {
      createdAt: {
        gte: since,
      },
    },
  });

  const groups: Record<
    string,
    {
      runs: number;
      totalActions: number;
      blockedActions: number;
      costUsd: number;
      durationMs: number;
      valueScores: number[];
    }
  > = {};

  for (const m of metrics) {
    const pattern = m.primaryPattern || 'unknown';
    if (!groups[pattern]) {
      groups[pattern] = {
        runs: 0,
        totalActions: 0,
        blockedActions: 0,
        costUsd: 0,
        durationMs: 0,
        valueScores: [],
      };
    }
    const g = groups[pattern];
    g.runs++;
    g.totalActions += m.totalActions;
    g.blockedActions += m.blockedActions;
    g.costUsd += m.costUsd;
    g.durationMs += m.durationMs;
    if (typeof m.valueScore === 'number' && !isNaN(m.valueScore)) {
      g.valueScores.push(m.valueScore);
    }
  }

  return Object.entries(groups).map(([pattern, g]) => {
    const avgActions = g.runs > 0 ? Number((g.totalActions / g.runs).toFixed(2)) : 0;
    const avgBlocked = g.runs > 0 ? Number((g.blockedActions / g.runs).toFixed(2)) : 0;
    const blockRate =
      g.totalActions > 0 ? Number((g.blockedActions / g.totalActions).toFixed(4)) : 0;
    const avgCost = g.runs > 0 ? Number((g.costUsd / g.runs).toFixed(6)) : 0;
    const avgDurationMs = g.runs > 0 ? Math.round(g.durationMs / g.runs) : 0;
    const avgValueScore =
      g.valueScores.length > 0
        ? Number(
            (
              g.valueScores.reduce((a, b) => a + b, 0) / g.valueScores.length
            ).toFixed(2)
          )
        : null;

    return {
      primaryPattern: pattern,
      runs: g.runs,
      avgActions,
      avgBlocked,
      blockRate,
      avgCost,
      avgDurationMs,
      avgValueScore,
    };
  });
}
