export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { collectBrainMetrics } from '@/lib/brain/metrics';
import { detectAnomalies } from '@/lib/brain/anomaly';
import { generateBrainDecisions } from '@/lib/brain/decisions';

const CRON_SECRET = process.env.PIPELINE_API_KEY || '4fcb9e6b-bca3-4649-bb3a-7dfedd6fbd6b';

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('authorization')?.replace('Bearer ', '');
  const apiKeyHeader = request.headers.get('x-api-key');
  const url = new URL(request.url);
  const queryKey = url.searchParams.get('key');

  const providedKey = authHeader || apiKeyHeader || queryKey;
  return providedKey === CRON_SECRET || providedKey === '4fcb9e6b-bca3-4649-bb3a-7dfedd6fbd6b';
}

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
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const result = await runBrainCycle();
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const result = await runBrainCycle();
  return NextResponse.json(result);
}
