import { NextRequest, NextResponse } from 'next/server';
import { runAutonomousLoop, evaluateVentureAutonomy } from '@/lib/ventures/autonomy';

/**
 * POST /api/ventures/autonomy
 * Triggers autonomous evaluation sweep across active ventures or a single venture.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { ventureId, limit } = body;

    if (ventureId) {
      const result = await evaluateVentureAutonomy(ventureId);
      return NextResponse.json({ ok: true, mode: 'single', result });
    }

    const summary = await runAutonomousLoop(limit || 20);
    return NextResponse.json({ ok: true, mode: 'batch', summary });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Autonomy evaluation failed' },
      { status: 500 }
    );
  }
}
