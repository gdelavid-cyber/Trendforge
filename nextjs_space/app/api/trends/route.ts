export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') ?? '1');
    const limit = parseInt(url.searchParams.get('limit') ?? '20');

    const [trends, total] = await Promise.all([
      prisma.trend.findMany({
        skip: (page - 1) * limit, take: limit,
        orderBy: { detectedAt: 'desc' },
        include: { _count: { select: { tasks: true } } },
      }),
      prisma.trend.count(),
    ]);

    return NextResponse.json({ trends, total });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch trends' }, { status: 500 });
  }
}
