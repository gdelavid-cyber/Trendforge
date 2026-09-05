export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';

export async function GET() {
  try {
    const trends = await prisma.trend.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { detectedAt: 'desc' },
      take: 20,
    });
    return NextResponse.json({ trends });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch latest trends' }, { status: 500 });
  }
}
