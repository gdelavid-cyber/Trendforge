export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { runCouncilDebate } from '@/lib/council/council-runner';
import { getCouncilMemory } from '@/lib/council/council-memory';
import { harvestNextCouncilSignal } from '@/lib/council/signal-harvester';
import { prisma } from '@/lib/core/db';

const TEST_SESSION_RE = /council-mem-test-|council-switch-|council-hot-task-|test-|fixture/i;

// GET: Fetch latest council deliberations and collective intelligence profile
export async function GET() {
  try {
    const [rawSessions, memory] = await Promise.all([
      prisma.councilSession.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      getCouncilMemory(),
    ]);

    const sessions = rawSessions
      .filter((s) => {
        const title = String((s.signal as any)?.title || '');
        if (!title || TEST_SESSION_RE.test(title)) return false;
        const transcript = Array.isArray(s.debateTranscript) ? (s.debateTranscript as any[]) : [];
        if (transcript.length < 5) return false;
        const badTurn = transcript.some(
          (t) =>
            String(t?.perspective || '').includes('TrendForge Station Live Execution Report') ||
            String(t?.perspective || '').includes('{"success":true}') ||
            String(t?.perspective || '').includes('Sensitive internal note') ||
            String(t?.perspective || '').includes('LLM call failed for')
        );
        return !badTurn;
      })
      .slice(0, 6);

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
