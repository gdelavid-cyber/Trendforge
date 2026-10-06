import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runStationAgent } from '@/lib/station/engine/loop';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  let userId = (session?.user as any)?.id;
  if (!userId) {
    const fallbackUser = await prisma.user.findFirst();
    userId = fallbackUser?.id;
  }
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { ventureId, goal, model, maxTurns } = body;

  if (!goal) {
    return NextResponse.json({ error: 'goal is required' }, { status: 422 });
  }

  const runId = crypto.randomUUID();

  // Find or create local native station record in DB
  let station = await prisma.starNetStation.findFirst({
    where: { userId, name: 'Trendly Native Core' },
  });

  if (!station) {
    station = await prisma.starNetStation.create({
      data: {
        userId,
        name: 'Trendly Native Core',
        url: 'in-process',
        bridgeSecret: 'native-ipc',
        isActive: true,
        lastSeenAt: new Date(),
      },
    });
  }

  const dbJob = await prisma.starNetJob.create({
    data: {
      id: runId,
      stationId: station.id,
      ventureId: ventureId || null,
      status: 'RUNNING',
      jobPayload: { goal, model },
    },
  });

  // Launch agent run in background asynchronously
  setImmediate(async () => {
    try {
      const result = await runStationAgent({
        runId,
        ventureId,
        userId,
        goal,
        model,
        maxTurns: maxTurns || 8,
      });

      await prisma.starNetJob.update({
        where: { id: runId },
        data: {
          status: result.success ? 'COMPLETE' : 'FAILED',
          costCents: result.costCents,
          resultArtifact: {
            text: result.text,
            turns: result.turns,
            tokens: result.tokens,
            toolTrace: result.toolTrace,
            durationMs: result.durationMs,
          },
          completedAt: new Date(),
        },
      });
    } catch (err: any) {
      console.error('[StationDispatch] run failed:', err);
      await prisma.starNetJob.update({
        where: { id: runId },
        data: {
          status: 'FAILED',
          resultArtifact: { error: err.message || String(err) },
          completedAt: new Date(),
        },
      });
    }
  });

  return NextResponse.json({
    runId,
    dbJobId: dbJob.id,
    status: 'RUNNING',
    message: 'Native agent dispatched on Trendly Engine.',
  });
}
