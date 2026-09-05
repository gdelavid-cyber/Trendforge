export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { isUserAdmin } from '@/lib/council/config';
import { runCouncilDebate } from '@/lib/council/council-runner';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isUserAdmin(session.user as any)) {
    return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const signalData = body.signal || body;

    const {
      title = 'Autonomous Emergency Call Answering & Dispatch for Service SMBs',
      source = 'Reddit r/smallbusiness + Google Trends',
      rawInsight = 'Service contractors miss 40% of night calls; hiring an overnight dispatcher costs $3,000/mo.',
      estimatedMargin,
      estimatedVelocity,
    } = signalData;

    const councilSession = await runCouncilDebate({
      title,
      source,
      rawInsight,
      estimatedMargin,
      estimatedVelocity,
    });

    return NextResponse.json({
      success: true,
      message: 'AI Money Council debate initialized and analyzed.',
      sessionId: councilSession.id,
      session: councilSession,
    });
  } catch (error: any) {
    console.error('[CouncilTrigger] Error:', error);
    return NextResponse.json({ error: error.message || 'Trigger failed' }, { status: 500 });
  }
}
