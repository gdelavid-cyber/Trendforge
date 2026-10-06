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
  } catch { return false; }
}

/**
 * POST /api/starnet/complete
 * Called by StarNet station when a job finishes.
 * Records verified artifact + AI cost as FinancialRecord.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get('x-starnet-signature') || '';

  if (!verifySignature(rawBody, sig)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let data: any;
  try { data = JSON.parse(rawBody); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { jobId, ventureId, fulfillmentOrderId, starnetRunId, status, costCents, artifact, completedAt } = data;

  if (!ventureId || !status) {
    return NextResponse.json({ error: 'ventureId and status required' }, { status: 422 });
  }

  // Update StarNetJob record in database
  try {
    const jobRecord = await prisma.starNetJob.findFirst({
      where: {
        OR: [
          ...(jobId ? [{ id: jobId }] : []),
          ...(starnetRunId ? [{ runId: starnetRunId }] : []),
          { ventureId, status: 'RUNNING' },
        ],
      },
      orderBy: { dispatchedAt: 'desc' },
    });

    if (jobRecord) {
      await prisma.starNetJob.update({
        where: { id: jobRecord.id },
        data: {
          status: status === 'COMPLETE' ? 'COMPLETE' : 'FAILED',
          runId: starnetRunId || jobRecord.runId,
          costCents: costCents || null,
          resultArtifact: artifact || null,
          completedAt: completedAt ? new Date(completedAt) : new Date(),
        },
      });
    }
  } catch (err) {
    console.error('[starnet/complete] failed to update StarNetJob record:', err);
  }

  // Record verified AI compute cost in financial ledger
  if (costCents && costCents > 0 && ventureId) {
    try {
      await prisma.financialRecord.create({
        data: {
          ventureId,
          type:           'AI_COMPUTE_COST',
          amountCents:    -Math.abs(costCents),
          currency:       'USD',
          provenance:     'ACTUAL',
          description:    `StarNet agent run: ${starnetRunId || jobId}`,
          metadata:       { referenceId: starnetRunId || jobId },
        },
      });
    } catch (err) {
      console.error('[starnet/complete] failed to record cost:', err);
    }
  }

  // Advance fulfillment order if provided
  if (fulfillmentOrderId && status === 'COMPLETE') {
    try {
      await prisma.fulfillmentOrder.update({
        where: { id: fulfillmentOrderId },
        data: {
          status:            'QA_VERIFICATION',
          deliveryArtifacts: artifact || {},
          verificationNotes: JSON.stringify({ starnetRunId, completedAt, costCents }),
        },
      });
    } catch (err) {
      console.error('[starnet/complete] failed to advance fulfillment:', err);
    }
  }

  return NextResponse.json({ ok: true });
}
