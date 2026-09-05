export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { collectBrainMetrics } from '@/lib/intelligence/brain/metrics';
import { detectAnomalies } from '@/lib/intelligence/brain/anomaly';
import { generateBrainDecisions } from '@/lib/intelligence/brain/decisions';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }

    // Collect latest snapshot
    const currentMetrics = await collectBrainMetrics();
    const anomalies = await detectAnomalies(currentMetrics);
    const proposedDecisions = await generateBrainDecisions(currentMetrics);

    // Fetch historical decisions & metrics from DB
    const [recentDecisions, historicalMetrics, recentAgentRuns] = await Promise.all([
      prisma.brainDecision.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.brainMetric.findMany({
        orderBy: { timestamp: 'desc' },
        take: 60,
      }),
      prisma.agentRun.findMany({
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
    ]);

    return NextResponse.json({
      success: true,
      currentMetrics,
      anomalies,
      proposedDecisions,
      recentDecisions,
      historicalMetrics,
      recentAgentRuns,
    });
  } catch (error: any) {
    console.error('Admin Brain metrics error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch Brain telemetry' }, { status: 500 });
  }
}
