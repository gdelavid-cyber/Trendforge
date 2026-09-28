import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function isAuthorized(req: NextRequest): boolean {
  if (process.env.NODE_ENV === 'development') return true;
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const apiKey = req.headers.get('x-api-key') || '';
  const validSecret =
    process.env.OBSERVABILITY_API_KEY ||
    process.env.CRON_SECRET ||
    process.env.NEXTAUTH_SECRET;
  if (!validSecret) return true;
  return token === validSecret || apiKey === validSecret;
}

export async function GET(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const gate = searchParams.get('gate');
    const daysParam = searchParams.get('days');
    const days = daysParam ? parseInt(daysParam, 10) : 7;

    const since = new Date(Date.now() - (isNaN(days) ? 7 : days) * 24 * 60 * 60 * 1000);

    const snapshots = await prisma.calibrationSnapshot.findMany({
      where: {
        ...(gate ? { gateType: gate } : {}),
        createdAt: {
          gte: since,
        },
      },
      orderBy: [
        { windowStart: 'desc' },
        { gateType: 'asc' },
        { confidenceBucket: 'asc' },
      ],
      take: 1000,
    });

    return NextResponse.json({
      success: true,
      count: snapshots.length,
      gate: gate || 'all',
      days: isNaN(days) ? 7 : days,
      snapshots,
    });
  } catch (err: any) {
    console.error('[Observability API] Error fetching calibration snapshots:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
