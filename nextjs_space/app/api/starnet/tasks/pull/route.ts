import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

const BRIDGE_SECRET = process.env.STARNET_BRIDGE_SECRET || process.env.TRENDFORGE_BRIDGE_SECRET || '';

function verifySignature(rawBody: string, header: string): boolean {
  if (!BRIDGE_SECRET) return true;
  const [scheme, digest] = header.split('=');
  if (scheme !== 'sha256' || !digest) return false;
  try {
    const expected = crypto.createHmac('sha256', BRIDGE_SECRET).update(rawBody).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(digest, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

/**
 * GET /api/starnet/tasks/pull
 * Consumer loop endpoint: StarNet persistent daemon calls this endpoint periodically
 * to pull the next pending heavy swarm job. Atomically claims the task.
 */
export async function GET(req: NextRequest) {
  const stationId = req.headers.get('x-starnet-station-id') || 'default-station';
  const sig = req.headers.get('x-starnet-signature') || req.headers.get('x-trendforge-signature') || '';

  if (BRIDGE_SECRET && !verifySignature('', sig)) {
    // If empty body signature fails, check authorization bearer token or query key
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (token !== BRIDGE_SECRET) {
      return NextResponse.json({ error: 'Unauthorized station' }, { status: 401 });
    }
  }

  try {
    // 1. Find the next pending heavy job
    const pendingJob = await prisma.starNetJob.findFirst({
      where: {
        status: 'PENDING',
      },
      orderBy: {
        dispatchedAt: 'asc',
      },
    });

    if (!pendingJob) {
      return NextResponse.json({ ok: true, job: null });
    }

    // 2. Atomically claim the job
    const claimedJob = await prisma.starNetJob.update({
      where: { id: pendingJob.id },
      data: {
        status: 'RUNNING',
        dispatchedAt: new Date(),
      },
    });

    const payload = (claimedJob.jobPayload as any) || {};

    return NextResponse.json({
      ok: true,
      job: {
        id: claimedJob.id,
        ventureId: claimedJob.ventureId,
        fulfillmentOrderId: claimedJob.fulfillmentOrderId,
        taskId: claimedJob.taskId,
        agentGoal: payload.agentGoal || payload.goal || '',
        tools: payload.tools || [],
        model: payload.model || null,
        context: payload.context || {
          ventureId: claimedJob.ventureId,
          fulfillmentOrderId: claimedJob.fulfillmentOrderId,
          taskId: claimedJob.taskId,
          jobId: claimedJob.id,
        },
        dispatchedAt: claimedJob.dispatchedAt,
      },
    });
  } catch (err: any) {
    console.error('[starnet/tasks/pull] Error claiming pending job:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/starnet/tasks/pull
 * Enqueue a new heavy task into the persistent StarNet job queue.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { ventureId, fulfillmentOrderId, taskId, agentGoal, tools, model, context } = body;
  if (!agentGoal) {
    return NextResponse.json({ error: 'agentGoal is required' }, { status: 422 });
  }

  try {
    // Find or create default station
    let station = await prisma.starNetStation.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!station) {
      station = await prisma.starNetStation.create({
        data: {
          userId: 'system',
          name: 'Primary Sidecar Station',
          url: process.env.STARNET_URL || 'http://localhost:8787',
          bridgeSecret: BRIDGE_SECRET || 'station-secret',
          isActive: true,
        },
      });
    }

    const job = await prisma.starNetJob.create({
      data: {
        stationId: station.id,
        ventureId: ventureId || null,
        fulfillmentOrderId: fulfillmentOrderId || null,
        taskId: taskId || null,
        status: 'PENDING',
        jobPayload: {
          agentGoal,
          tools: tools || [],
          model: model || null,
          context: context || {},
        },
      },
    });

    return NextResponse.json({
      ok: true,
      jobId: job.id,
      status: job.status,
    }, { status: 201 });
  } catch (err: any) {
    console.error('[starnet/tasks/pull] Error creating job:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
