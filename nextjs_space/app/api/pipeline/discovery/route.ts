export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validatePipelineKey } from '@/lib/pipeline';

export async function GET(request: Request) {
  const isKeyValid = validatePipelineKey(request);
  if (!isKeyValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const queries = await db.discoveryQuery.findMany({
      where: { status: 'PENDING' },
      take: 20,
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ queries });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const isKeyValid = validatePipelineKey(request);
  if (!isKeyValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { queryId, status = 'COMPLETED', resultCount = 0 } = body;

    if (!queryId) return NextResponse.json({ error: 'queryId required' }, { status: 400 });

    const updated = await db.discoveryQuery.update({
      where: { id: queryId },
      data: {
        status,
        resultCount: Number(resultCount) || 0,
        runAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, query: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
