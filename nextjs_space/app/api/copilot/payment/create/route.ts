export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { sessionId, amount } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId parameter' }, { status: 400 });
    }

    const copilotSession = await prisma.coPilotSession.findUnique({
      where: { id: sessionId },
    });

    if (!copilotSession || copilotSession.userId !== user.id) {
      return NextResponse.json({ error: 'Session not found or forbidden' }, { status: 403 });
    }

    const requestedAmount = Number(amount) || copilotSession.priceOffer || 450;

    // Hard price floor enforcement
    if (requestedAmount < copilotSession.priceFloor) {
      return NextResponse.json(
        {
          error: `Cannot generate payment link: Amount ($${requestedAmount.toFixed(2)}) is below the agreed price floor of $${copilotSession.priceFloor.toFixed(2)}.`,
          priceFloor: copilotSession.priceFloor,
        },
        { status: 400 }
      );
    }

    const paymentUrl = `https://buy.stripe.com/trendly_sale_${copilotSession.id}_${Math.round(requestedAmount)}`;
    const linkId = `plink_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const paymentLinkSale = await prisma.paymentLinkSale.create({
      data: {
        sessionId: copilotSession.id,
        stripeLinkId: linkId,
        url: paymentUrl,
        amount: requestedAmount,
        status: 'pending',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Payment link generated successfully.',
      paymentLink: paymentLinkSale,
    });
  } catch (error: any) {
    console.error('[CopilotPaymentCreate] Error:', error);
    return NextResponse.json({ error: error.message || 'Payment link generation failed' }, { status: 500 });
  }
}
