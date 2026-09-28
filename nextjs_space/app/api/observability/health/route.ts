import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [totalDecisions, totalOutcomes, avgCalib, lastRun, gateConfigs] = await Promise.all([
      prisma.decisionLog.count(),
      prisma.decisionOutcome.count(),
      prisma.calibrationSnapshot.aggregate({
        _avg: {
          calibrationError: true,
        },
      }),
      prisma.observabilityRun.findFirst({
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.dynamicGateConfig.findMany({
        orderBy: { gateType: 'asc' },
      }),
    ]);

    const calibrationCoveragePct =
      totalDecisions > 0
        ? Number(((totalOutcomes / totalDecisions) * 100).toFixed(2))
        : 0;

    const avgCalibrationError =
      avgCalib._avg.calibrationError !== null
        ? Number(avgCalib._avg.calibrationError.toFixed(4))
        : 0;

    return NextResponse.json({
      status: 'ok',
      totalDecisions,
      totalOutcomes,
      calibrationCoveragePct,
      avgCalibrationError,
      lastRun,
      dynamicGateConfigs: gateConfigs,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Observability API] Error in health check:', err);
    return NextResponse.json(
      { status: 'error', error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
