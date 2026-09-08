export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';
import { validatePipelineKey } from '@/lib/pipeline';
import { getSessionUser, requireAdminUser } from '@/lib/core/route-auth';

export async function POST(request: Request) {
  const isKeyValid = validatePipelineKey(request);

  if (!isKeyValid) {
    const adminUser = await requireAdminUser();
    if (!adminUser) {
      const user = await getSessionUser();
      if (user) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
  }

  const startTime = Date.now();
  const body = await request.json().catch(() => ({}));
  const rawSignals: any[] = Array.isArray(body.signals) ? body.signals : [];
  const signals = rawSignals.slice(0, 100);

  let stored = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const s of signals) {
    const title = (s.title || s.name || '').trim();
    const externalId = (s.externalId || s.id || '').toString().trim();
    if (!title || !externalId) {
      skipped++;
      continue;
    }

    const source = s.source || (Array.isArray(s.sourcePlatforms) ? s.sourcePlatforms[0] : 'Unknown');

    try {
      await prisma.rawSignal.create({
        data: {
          source,
          externalId,
          title,
          url: s.url || null,
          body: (s.body || s.description || '').slice(0, 2000) || null,
          score: Number(s.score) || 0,
          comments: Number(s.comments || s.num_comments) || 0,
          velocity: Number(s.mentionVelocity || s.velocity) || 0,
        },
      });
      stored++;
    } catch (e: any) {
      if (e?.code === 'P2002') {
        skipped++;
        continue;
      }
      errors.push(`${title.slice(0, 60)}: ${e.message}`);
    }
  }

  const durationMs = Date.now() - startTime;

  try {
    await prisma.trendIngestionLog.create({
      data: {
        source: 'SCRAPLING_WORKER',
        status: errors.length > 0 && stored === 0 ? 'FAILED' : 'SUCCESS',
        recordsIngested: stored,
        errorMessage: errors.length ? errors.slice(0, 5).join('; ') : null,
        durationMs,
      },
    });
  } catch (logErr: any) {
    console.warn('[INGEST] Failed to write ingestion log:', logErr.message);
  }

  return NextResponse.json({
    success: true,
    summary: `Stored ${stored} new signals, skipped ${skipped} duplicates.`,
    stored,
    skipped,
    durationMs,
    errors: errors.slice(0, 5),
  });
}
