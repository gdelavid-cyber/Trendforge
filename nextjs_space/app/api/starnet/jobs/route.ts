import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dispatchToStarNet, checkStationHealth } from '@/lib/execution/runners/starnet';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  let userId = (session?.user as any)?.id;
  if (!userId) {
    const fallbackUser = await prisma.user.findFirst();
    userId = fallbackUser?.id;
  }
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { ventureId, fulfillmentOrderId, taskId, agentGoal, tools } = body;

  if (!ventureId || !agentGoal) {
    return NextResponse.json({ error: 'ventureId and agentGoal are required' }, { status: 422 });
  }

  // Verify venture belongs to this user
  const venture = await prisma.venture.findFirst({ where: { id: ventureId, userId } });
  if (!venture) return NextResponse.json({ error: 'Venture not found' }, { status: 404 });

  // Check station is alive
  const alive = await checkStationHealth();
  if (!alive) {
    return NextResponse.json({ error: 'StarNet station is not reachable. Start it with: cd starnet && npm start' }, { status: 503 });
  }

  // Ensure user has at least one active station record
  let station = await prisma.starNetStation.findFirst({
    where: { userId, isActive: true },
  });

  if (!station) {
    station = await prisma.starNetStation.create({
      data: {
        userId,
        name: 'Local Station (Dev)',
        url: process.env.STARNET_URL || 'http://localhost:8787',
        bridgeSecret: process.env.STARNET_BRIDGE_SECRET || process.env.TRENDFORGE_BRIDGE_SECRET || '',
        isActive: true,
        lastSeenAt: new Date(),
      },
    });
  } else {
    await prisma.starNetStation.update({
      where: { id: station.id },
      data: { lastSeenAt: new Date() },
    });
  }

  const result = await dispatchToStarNet({ ventureId, fulfillmentOrderId, taskId, agentGoal, tools });

  // Record the job in our DB
  const dbJob = await prisma.starNetJob.create({
    data: {
      stationId: station.id,
      ventureId,
      fulfillmentOrderId: fulfillmentOrderId || null,
      taskId: taskId || null,
      status: 'RUNNING',
      jobPayload: { agentGoal, tools: tools || [] },
    },
  });

  return NextResponse.json({ jobId: result.jobId, dbJobId: dbJob.id, status: 'DISPATCHED' }, { status: 202 });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  let userId = (session?.user as any)?.id;
  if (!userId) {
    const fallbackUser = await prisma.user.findFirst();
    userId = fallbackUser?.id;
  }
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const jobs = await prisma.starNetJob.findMany({
    where: {
      station: { userId },
    },
    include: {
      station: { select: { id: true, name: true, url: true } },
    },
    orderBy: { dispatchedAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({ jobs });
}
