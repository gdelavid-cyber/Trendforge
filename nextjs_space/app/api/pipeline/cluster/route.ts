export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';
import { validatePipelineKey, fingerprint, isDuplicate } from '@/lib/pipeline';
import { getSessionUser, requireAdminUser } from '@/lib/core/route-auth';

const MIN_SUPPORT = 3; // a theme needs 3+ posts to count as a trend

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

  const unprocessed = await prisma.rawSignal.findMany({
    where: { processed: false },
    orderBy: { createdAt: 'desc' },
    take: 120,
  });

  if (unprocessed.length === 0) {
    return NextResponse.json({ success: true, summary: 'No unprocessed signals.', trendsCreated: 0 });
  }

  const { callLLM } = await import('@/lib/pipeline');

  const list = unprocessed
    .map((s, i) => `${i}. [${s.source}] ${s.title}`)
    .join('\n');

  const raw = await callLLM(
    [
      {
        role: 'system',
        content:
          'You cluster forum posts into recurring commercial themes. Output JSON only: {"themes":[{"name":string,"supportIndices":number[],"category":"AI_TOOLS"|"LOCAL_SERVICES"|"CRYPTO_FINANCE"|"ECOMMERCE"|"AI_CONTENT"|"AGENT_ECONOMY"|"DATA_SCIENCE"|"OTHER","isMonetizable":boolean,"rationale":string}]}. Only emit a theme if 3 or more posts genuinely support it. Do not invent themes to fill quota. An empty themes array is a valid answer.',
      },
      { role: 'user', content: `Posts:\n${list}\n\nJSON only.` },
    ],
    true
  );

  if (!raw) {
    // LLM unavailable → mark nothing, report PENDING honestly
    await prisma.trendIngestionLog.create({
      data: {
        source: 'CLUSTER_PASS',
        status: 'FAILED',
        recordsIngested: 0,
        errorMessage: 'LLM unavailable — clustering PENDING, no trends invented.',
        durationMs: Date.now() - startTime,
      },
    });
    return NextResponse.json(
      {
        success: false,
        pending: true,
        error: 'Classifier unavailable. Signals retained, nothing fabricated.',
      },
      { status: 503 }
    );
  }

  let themes: any[] = [];
  try {
    themes = JSON.parse(raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim())?.themes ?? [];
  } catch {
    return NextResponse.json({ success: false, error: 'Unparseable classifier output.' }, { status: 502 });
  }

  const existing = await prisma.trend.findMany({ select: { name: true } });
  const existingNames = new Set(existing.map((t) => t.name.toLowerCase()));

  let trendsCreated = 0;
  const usedIndices = new Set<number>();

  for (const theme of themes) {
    const support: number[] = Array.isArray(theme.supportIndices) ? theme.supportIndices : [];
    if (support.length < MIN_SUPPORT) continue;

    const name = (theme.name || '').trim();
    if (!name) continue;
    if (isDuplicate(name, existingNames, 0.45)) continue;

    const backing = support.map((i) => unprocessed[i]).filter(Boolean);
    if (backing.length < MIN_SUPPORT) continue;

    // measured: total engagement per hour across supporting posts
    const velocity = Number(
      (backing.reduce((sum, s) => sum + s.velocity, 0) / backing.length).toFixed(2)
    );
    const platforms = [...new Set(backing.map((s) => s.source))];

    const trend = await prisma.trend.create({
      data: {
        name,
        fingerprint: fingerprint(name),
        sourcePlatforms: platforms,
        mentionVelocity: velocity,
        sentimentScore: 0,
        confidence: 0.85,
        monetizationScore: theme.isMonetizable ? 0.85 : 0.4,
        category: theme.category ?? 'OTHER',
        status: 'ACTIVE',
        isMonetizable: Boolean(theme.isMonetizable),
        monetizationRationale: theme.rationale ?? null,
        newsSummary: `${backing.length} posts across ${platforms.join(', ')} reference this theme.`,
        newsSourceUrl: backing[0]?.url ?? null,
      },
    });

    await prisma.rawSignal.updateMany({
      where: { id: { in: backing.map((b) => b.id) } },
      data: { themeId: trend.id, processed: true },
    });

    support.forEach((idx) => usedIndices.add(idx));
    existingNames.add(name.toLowerCase());
    trendsCreated++;
  }

  // signals that supported no theme are still processed — they just weren't trends
  const leftover = unprocessed.filter((_, i) => !usedIndices.has(i)).map((s) => s.id);
  if (leftover.length) {
    await prisma.rawSignal.updateMany({ where: { id: { in: leftover } }, data: { processed: true } });
  }

  const durationMs = Date.now() - startTime;

  await prisma.trendIngestionLog.create({
    data: {
      source: 'CLUSTER_PASS',
      status: 'SUCCESS',
      recordsIngested: trendsCreated,
      errorMessage: null,
      durationMs,
    },
  });

  return NextResponse.json({
    success: true,
    summary: `${unprocessed.length} signals → ${trendsCreated} trends (min support ${MIN_SUPPORT}).`,
    signalsExamined: unprocessed.length,
    trendsCreated,
    durationMs,
  });
}
