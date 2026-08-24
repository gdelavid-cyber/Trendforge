export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

const SOL_ADDRESS_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const MIN_WITHDRAWAL = 1;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const requests = await prisma.withdrawalRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 25,
    include: { agent: { select: { name: true } } },
  });

  return NextResponse.json({
    success: true,
    requests: requests.map((r) => ({
      id: r.id,
      agentName: r.agent.name,
      amountUsdc: r.amountUsdc,
      destination: r.destination,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

/**
 * Request a withdrawal of real ledger balance. v1 honesty boundary: this
 * queues an admin review — it does NOT move money. The WITHDRAWAL debit
 * happens only when an admin approves, idempotently on the request id.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  try {
    const body = await request.json();
    const { agentId, amountUsdc, destination } = body;

    const amount = Number(amountUsdc);
    if (!Number.isFinite(amount) || amount < MIN_WITHDRAWAL) {
      return NextResponse.json({ error: `Minimum withdrawal is $${MIN_WITHDRAWAL} USDC.` }, { status: 400 });
    }
    if (typeof destination !== 'string' || !SOL_ADDRESS_RE.test(destination.trim())) {
      return NextResponse.json({ error: 'Destination must be a valid Solana address.' }, { status: 400 });
    }

    const agent = await prisma.web4Agent.findUnique({ where: { id: agentId } });
    if (!agent || agent.userId !== user.id) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    if (agent.walletBalance < amount) {
      return NextResponse.json({
        error: `Insufficient balance: wallet holds $${agent.walletBalance.toFixed(2)} USDC.`,
      }, { status: 400 });
    }

    const pendingCount = await prisma.withdrawalRequest.count({
      where: { agentId: agent.id, status: 'PENDING' },
    });
    if (pendingCount > 0) {
      return NextResponse.json({ error: 'This agent already has a pending withdrawal under review.' }, { status: 409 });
    }

    const created = await prisma.withdrawalRequest.create({
      data: {
        userId: user.id,
        agentId: agent.id,
        amountUsdc: Math.round(amount * 1e6) / 1e6,
        destination: destination.trim(),
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true, request: { id: created.id, status: created.status } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Withdrawal request failed' }, { status: 500 });
  }
}
