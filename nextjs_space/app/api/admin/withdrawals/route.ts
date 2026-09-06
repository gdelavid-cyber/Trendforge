export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { postEntry } from '@/lib/money/ledger';

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

    // Atomic claim: exactly one approver can take a PENDING request.
    // Crash after the debit below still leaves an APPROVED row with the
    // ledger entry posted — consistent, and retries 409 instead of double-paying.
    const claimed = await prisma.withdrawalRequest.updateMany({
      where: { id, status: 'PENDING' },
      data: { status: 'APPROVED', reviewedBy: (session.user as any).id ?? 'admin' },
    });
    if (claimed.count === 0) {
      const current = await prisma.withdrawalRequest.findUnique({ where: { id }, select: { status: true } });
      return NextResponse.json({ error: `Already reviewed (${current?.status ?? 'unknown'}).` }, { status: 409 });
    }

    const agent = await prisma.web4Agent.findUnique({ where: { id: wr.agentId } });
    if (!agent || agent.walletBalance < wr.amountUsdc) {
      await prisma.withdrawalRequest.update({ where: { id }, data: { status: 'PENDING', reviewedBy: null } });
      return NextResponse.json({
        error: `Agent balance $${(agent?.walletBalance ?? 0).toFixed(2)} cannot cover $${wr.amountUsdc.toFixed(2)}. Claim released — request is PENDING again.`,
      }, { status: 409 });
    }

    if (decision === 'REJECTED') {
      const updated = await prisma.withdrawalRequest.update({
        where: { id },
        data: { status: 'REJECTED' },
      });
      return NextResponse.json({ success: true, request: { id: updated.id, status: updated.status } });
    }

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

    // Bound the request-creation race: any other PENDING for this agent
    // is now stale — close it so only one payout per agent survives.
    await prisma.withdrawalRequest.updateMany({
      where: { agentId: wr.agentId, status: 'PENDING', id: { not: wr.id } },
      data: { status: 'REJECTED', reviewedBy: (session.user as any).id ?? 'admin' },
    });

    const updated = await prisma.withdrawalRequest.findUnique({ where: { id } });
    return NextResponse.json({ success: true, request: { id: updated!.id, status: updated!.status } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Review failed' }, { status: 500 });
  }
}
