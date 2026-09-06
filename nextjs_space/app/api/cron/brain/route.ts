export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { collectBrainMetrics } from '@/lib/intelligence/brain/metrics';
import { detectAnomalies } from '@/lib/intelligence/brain/anomaly';
import { generateBrainDecisions } from '@/lib/intelligence/brain/decisions';
import { checkCronAuth } from '@/lib/core/route-auth';


async function runBrainCycle() {
  const startTime = Date.now();
  const metrics = await collectBrainMetrics();
  const anomalies = await detectAnomalies(metrics);
  const decisions = await generateBrainDecisions(metrics);

  return {
    success: true,
    timestamp: new Date().toISOString(),
    metricsCollected: Object.keys(metrics).length,
    anomaliesCount: anomalies.length,
    decisionsGenerated: decisions.length,
    durationMs: Date.now() - startTime,
  };
}

export async function GET(request: Request) {
  const auth = checkCronAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const result = await runBrainCycle();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Brain cron cycle failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = checkCronAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const result = await runBrainCycle();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Brain cron cycle failed' }, { status: 500 });
  }
}
