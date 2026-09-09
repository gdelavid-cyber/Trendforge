import { NextRequest, NextResponse } from 'next/server';
import { startPitchSession } from '@/lib/coach/pitch-engine';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const userId = (session?.user as any)?.id || body.userId;

    const result = await startPitchSession({
      userId,
      executionId: body.executionId,
      leadId: body.leadId,
      scenario: body.scenario,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API /api/coach/start] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to start pitch session' }, { status: 500 });
  }
}
