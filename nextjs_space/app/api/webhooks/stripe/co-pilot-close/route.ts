export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { broadcastCopilotEvent } from '@/lib/copilot/realtime';

export async function POST(request: Request) {
  try {
    // This endpoint flips deal state and books revenue figures. It is NOT a
    // Stripe-signed webhook (no signature exists on this payload), so it
    // requires the session owner's identity instead — and the session must
    // belong to the caller. Amounts stay capped by the recorded price offer.
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const { sessionId, linkId, amount, currency = 'usd' } = body;

    if (!sessionId && !linkId) {
      return NextResponse.json({ error: 'Missing session or link identifier' }, { status: 400 });
    }

    // Locate session via ID or payment link
    let copilotSession = null;
    let paymentLink = null;

    if (sessionId) {
      copilotSession = await prisma.coPilotSession.findUnique({
        where: { id: sessionId },
        include: { lead: true, user: true },
      });
      paymentLink = await prisma.paymentLinkSale.findFirst({
        where: { sessionId },
        orderBy: { createdAt: 'desc' },
      });
    } else if (linkId) {
      paymentLink = await prisma.paymentLinkSale.findFirst({
        where: { OR: [{ id: linkId }, { stripeLinkId: linkId }] },
      });
      if (paymentLink) {
        copilotSession = await prisma.coPilotSession.findUnique({
          where: { id: paymentLink.sessionId },
          include: { lead: true, user: true },
        });
      }
    }

    if (!copilotSession) {
      return NextResponse.json({ error: 'Matching sales session not found' }, { status: 404 });
    }
    if (copilotSession.userId !== user.id) {
      return NextResponse.json({ error: 'Not your sales session.' }, { status: 403 });
    }

    // Amounts are claims, not money: cap at the recorded offer and never
    // invent revenue above what the session agreed.
    const claimed = Number(amount);
    const cap = paymentLink?.amount ?? copilotSession.priceOffer ?? 450;
    const paidAmount = Number.isFinite(claimed) && claimed > 0 ? Math.min(claimed, cap) : cap;

    // 1. Flip session status to closed_won
    const updatedSession = await prisma.coPilotSession.update({
      where: { id: copilotSession.id },
      data: {
        status: 'closed_won',
      },
    });

    // 2. Mark payment link paid
    if (paymentLink) {
      await prisma.paymentLinkSale.update({
        where: { id: paymentLink.id },
        data: { status: 'paid' },
      });
    }

    // 3. Update Lead status to WON
    if (copilotSession.leadId) {
      await prisma.lead.update({
        where: { id: copilotSession.leadId },
        data: {
          status: 'WON',
          statedBudgetCents: Math.round(paidAmount * 100),
        },
      });
    }

    // 4. Update ExecutionPlan if linked
    if (copilotSession.executionId) {
      const plan = await prisma.executionPlan.findUnique({
        where: { id: copilotSession.executionId },
      });
      if (plan) {
        await prisma.executionPlan.update({
          where: { id: plan.id },
          data: {
            status: 'COMPLETED',
            progress: 100,
            metadata: {
              ...(typeof plan.metadata === 'object' && plan.metadata ? plan.metadata : {}),
              dealClosed: true,
              amountWon: paidAmount,
              closedAt: new Date().toISOString(),
            },
          },
        });
      }
    }

    // 5. Broadcast DEAL_WON realtime event
    broadcastCopilotEvent({
      type: 'DEAL_WON',
      sessionId: copilotSession.id,
      userId: copilotSession.userId,
      payload: {
        status: 'closed_won',
        amountWon: paidAmount,
        currency,
        buyerName: copilotSession.lead.buyerName,
      },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Sale successfully confirmed for $${paidAmount.toFixed(2)}. Status flipped to closed_won.`,
      sessionId: copilotSession.id,
      amountWon: paidAmount,
    });
  } catch (error: any) {
    console.error('[StripeCopilotCloseWebhook] Error:', error);
    return NextResponse.json({ error: error.message || 'Webhook failed' }, { status: 500 });
  }
}
