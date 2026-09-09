export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';

// Spec-compat: GET /api/pipeline/status
// Returns pipeline counters + recent ingestion logs.
export async function GET() {
  try {
    const [totalSignals, processedSignals, totalTrends, totalTasks, recentLogs] =
      await Promise.all([
        prisma.rawSignal.count(),
        prisma.rawSignal.count({ where: { processed: true } }),
        prisma.trend.count(),
        prisma.task.count(),
        prisma.trendIngestionLog.findMany({
          take: 20,
          orderBy: { executedAt: 'desc' },
        }),
      ]);

    return NextResponse.json({
      totalSignals,
      processedSignals,
      unprocessedSignals: totalSignals - processedSignals,
      totalTrends,
      totalTasks,
      recentLogs: recentLogs.map((log) => ({
        id: log.id,
        source: log.source,
        status: log.status,
        recordsIngested: log.recordsIngested,
        clustersCreated: 0,
        durationMs: log.durationMs,
        errorMessage: log.errorMessage,
        createdAt: log.executedAt.toISOString(),
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Failed to query pipeline status' }, { status: 500 });
  }
}
