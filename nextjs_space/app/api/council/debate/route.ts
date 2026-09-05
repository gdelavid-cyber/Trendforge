export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { runCouncilDebate } from '@/lib/council/council-runner';
import { prisma } from '@/lib/core/db';

// GET: Fetch latest council deliberations
export async function GET() {
  try {
    const sessions = await prisma.councilSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    return NextResponse.json({
      success: true,
      sessions: sessions.map((s) => ({
        id: s.id,
        status: s.status,
        signal: s.signal,
        debateTranscript: s.debateTranscript,
        gatekeeperVerdict: s.gatekeeperVerdict,
        conclusion: s.conclusion,
        createdAt: s.createdAt.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('[CouncilDebate GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch sessions' }, { status: 500 });
  }
}

// POST: Run a live debate on a money signal
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const signalData = body.signal || body;

    const {
      title = 'Autonomous B2B Emergency Voice Dispatch for Contractors',
      source = 'Reddit r/smallbusiness + Commercial Google Trends',
      rawInsight = 'Contractors miss 40% of after-hours calls; willing to pay $450 setup + $150/mo retainer.',
      estimatedMargin = '82.5%',
      estimatedVelocity = '24-48 hours to launch',
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
      message: 'Money Council convened successfully.',
      session: councilSession,
    });
  } catch (error: any) {
    console.error('[CouncilDebate POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Debate failed' }, { status: 500 });
  }
}
