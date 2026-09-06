import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';
import { executeDealClosureAndSale } from '@/lib/money/sales/sales-engine';
import { getSessionUser, unauthorized } from '@/lib/core/route-auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id;
    const sales = await prisma.sale.findMany({
      where: { taskId },
      include: { lead: true, user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, sales });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const userId = user.id;

    const taskId = params.id;
    const body = await req.json();
    const { leadId, buyerName, buyerEmail, buyerPlatform, saleAmountCents, proofArtifacts } = body;

    // If existing lead
    if (leadId) {
      const sale = await executeDealClosureAndSale(taskId, userId, leadId, saleAmountCents || 15000, 'user');
      return NextResponse.json({ success: true, sale });
    }

    // Manual custom sale logging. Self-reported claims are NEVER income:
    // they enter as PENDING and credit nothing until escrow release posts
    // TRADE_PROCEEDS to the ledger.
    const platformFeePercentage = 0.10;
    const amount = saleAmountCents || 15000;
    const platformFeeCents = Math.round(amount * platformFeePercentage);
    const userPayoutCents = amount - platformFeeCents;

    const task = await prisma.task.findUnique({ where: { id: taskId } });

    const sale = await prisma.sale.create({
      data: {
        taskId,
        userId,
        buyerName: buyerName || 'Unverified buyer',
        buyerEmail: buyerEmail || 'unverified@local',
        buyerPlatform: buyerPlatform || 'Direct',
        productDelivered: task?.title || 'Deliverable Package',
        saleAmountCents: amount,
        platformFeeCents,
        userPayoutCents,
        paymentMethod: 'stripe',
        escrowStatus: 'PENDING',
        proofArtifacts: proofArtifacts || [],
        loggedBy: 'user',
      },
    });

    return NextResponse.json({ success: true, sale });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
