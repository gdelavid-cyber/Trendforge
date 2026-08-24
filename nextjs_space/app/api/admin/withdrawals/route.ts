export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { postEntry } from '@/lib/web4/ledger';

/**
 * Admin review of withdrawal requests. Approval debits the agent's ledger
 * (WITHDRAWAL, idempotent on the request id) and marks the request APPROVED;
 * rejection just closes the queue item. v1 pays out manually off-platform.
 */
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, decision } = body;
    if (!id || !['APPROVED', 'REJECTED'].includes(decision)) {
      return NextResponse.json({ error: 'id and decision (APPROVED|REJECTED) required' }, { status: 400 });
    }

    const wr = await prisma.withdrawalRequest.findUnique({ where: { id }, include: { agent: true } });
    if (!wr) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    if (wr.status !== 'PENDING') {
      return NextResponse.json({ error: `Already reviewed (${wr.status})` }, { status: 409 });
    }
    if (decision === 'APPROVED' && wr.agent.walletBalance < wr.amountUsdc) {
      return NextResponse.json({
        error: `Agent balance dropped to $${wr.agent.walletBalance.toFixed(2)} — cannot approve $${wr.amountUsdc.toFixed(2)}.`,
      }, { status: 409 });
    }

    if (decision === 'APPROVED') {
      const move = await postEntry({
        agentId: wr.agentId,
        userId: wr.userId,
        type: 'WITHDRAWAL',
        amountUsdc: -wr.amountUsdc,
        ref: `withdrawal-${wr.id}`,
        note: `Admin-approved withdrawal to ${wr.destination.slice(0, 8)}…`,
      });
      if (!move.ok && move.reason === 'duplicate') {
        return NextResponse.json({ error: 'Withdrawal already settled.' }, { status: 409 });
      }
    }

    const updated = await prisma.withdrawalRequest.update({
      where: { id },
      data: { status: decision, reviewedBy: (session.user as any).id ?? 'admin' },
    });

    return NextResponse.json({ success: true, request: { id: updated.id, status: updated.status } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Review failed' }, { status: 500 });
  }
}
