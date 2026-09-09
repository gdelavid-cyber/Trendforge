import { NextRequest, NextResponse } from 'next/server';
import { endPitchSession } from '@/lib/coach/pitch-engine';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();
    const result = await endPitchSession(sessionId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API /api/coach/finish] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to finish session' }, { status: 500 });
  }
}
