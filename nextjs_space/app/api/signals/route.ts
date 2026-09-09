export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';

// Spec-compat: GET /api/signals?source=&processed=&limit=&offset=
// Lists RawSignal rows (harvested web signals).
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const source = url.searchParams.get('source');
    const processedParam = url.searchParams.get('processed');
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10) || 50, 200);
    const offset = parseInt(url.searchParams.get('offset') ?? '0', 10) || 0;

    const where: Record<string, unknown> = {};
    if (source) where.source = source;
    if (processedParam !== null && processedParam !== '') {
      where.processed = processedParam === 'true';
    }

    const [signals, total] = await Promise.all([
      prisma.rawSignal.findMany({
        where: where as never,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.rawSignal.count({ where: where as never }),
    ]);

    return NextResponse.json({
      signals: signals.map((s) => ({
        id: s.id,
        source: s.source,
        externalId: s.externalId,
        title: s.title,
        url: s.url,
        body: s.body?.slice(0, 500) ?? null,
        upvotes: s.score,
        comments: s.comments,
        processed: s.processed,
        trendId: s.themeId,
        createdAt: s.createdAt.toISOString(),
      })),
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Failed to fetch signals' }, { status: 500 });
  }
}
