export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';
import { broadcastCopilotEvent } from '@/lib/copilot/realtime';

export async function POST(request: Request) {
  try {
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

    const paidAmount = Number(amount) || paymentLink?.amount || copilotSession.priceOffer || 450;

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
