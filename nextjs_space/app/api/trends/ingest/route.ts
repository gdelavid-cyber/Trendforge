export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';
import { validatePipelineKey } from '@/lib/pipeline';

export async function POST(request: Request) {
  if (!validatePipelineKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { trends, source } = body ?? {};

    if (!Array.isArray(trends)) {
      return NextResponse.json({ error: 'trends must be an array' }, { status: 400 });
    }

    const startTime = Date.now();
    let ingested = 0;

    for (const t of trends) {
      try {
        await prisma.trend.create({
          data: {
            name: t?.name ?? 'Unknown',
            sourcePlatforms: t?.sourcePlatforms ?? [],
            mentionVelocity: t?.mentionVelocity ?? 0,
            sentimentScore: t?.sentimentScore ?? 0,
            confidence: t?.confidence ?? 0,
            category: t?.category ?? 'OTHER',
            detectedAt: new Date(),
            hoursSinceDetection: 0,
          },
        });
        ingested++;
      } catch (e: any) { console.error('Ingest single trend error:', e?.message); }
    }

    await prisma.trendIngestionLog.create({
      data: {
        source: source ?? 'api',
        status: 'SUCCESS',
        recordsIngested: ingested,
        durationMs: Date.now() - startTime,
      },
    });

    return NextResponse.json({ success: true, ingested });
  } catch (error: any) {
    console.error('Ingest error:', error);
    return NextResponse.json({ error: 'Ingestion failed' }, { status: 500 });
  }
}
