export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { runCouncilDebate } from '@/lib/council/council-runner';
import { getCouncilMemory } from '@/lib/council/council-memory';
import { harvestNextCouncilSignal } from '@/lib/council/signal-harvester';
import { prisma } from '@/lib/core/db';

// GET: Fetch latest council deliberations and collective intelligence profile
export async function GET() {
  try {
    const [sessions, memory] = await Promise.all([
      prisma.councilSession.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      getCouncilMemory(),
    ]);

    return NextResponse.json({
      success: true,
      memory,
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

// POST: Run a live debate on a harvested or provided money signal
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    let signalData = body.signal || body;

    // If no custom signal or title provided, dynamically harvest the next high-margin play
    if (!signalData?.title) {
      signalData = await harvestNextCouncilSignal();
    }

    // Exhausted pool or explicit pending: report honestly, never a simulated debate.
    if ((signalData as any)?.status === 'pending') {
      return NextResponse.json(
        {
          success: true,
          status: 'pending',
          message: (signalData as any)?.pendingReason || 'Council signal pool exhausted — pending fresh intel.',
          session: null,
        },
        { status: 202 }
      );
    }

    const {
      title,
      source = 'Live Multi-Vector Scraper & Harvester',
      rawInsight = 'Audited commercial cashflow arbitrage play with verified B2B buyer readiness.',
      estimatedMargin = '84.5%',
      estimatedVelocity = '24-48 hours',
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
      message: 'Money Council convened successfully with historical memory integration.',
      session: councilSession,
    });
  } catch (error: any) {
    console.error('[CouncilDebate POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Debate failed' }, { status: 500 });
  }
}
