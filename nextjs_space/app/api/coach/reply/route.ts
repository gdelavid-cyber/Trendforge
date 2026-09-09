import { NextRequest, NextResponse } from 'next/server';
import { userSpeaks } from '@/lib/coach/pitch-engine';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { sessionId, message } = await req.json();
    const result = await userSpeaks(sessionId, message);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API /api/coach/reply] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process turn' }, { status: 500 });
  }
}
