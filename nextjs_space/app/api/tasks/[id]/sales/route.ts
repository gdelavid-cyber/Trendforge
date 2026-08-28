import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { executeDealClosureAndSale } from '@/lib/sales/sales-engine';

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
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id : null;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const taskId = params.id;
    const body = await req.json();
    const { leadId, buyerName, buyerEmail, buyerPlatform, saleAmountCents, proofArtifacts } = body;

    // If existing lead
    if (leadId) {
      const sale = await executeDealClosureAndSale(taskId, userId, leadId, saleAmountCents || 15000, 'user');
      return NextResponse.json({ success: true, sale });
    }

    // Manual custom sale logging
    const platformFeePercentage = 0.10;
    const amount = saleAmountCents || 15000;
    const platformFeeCents = Math.round(amount * platformFeePercentage);
    const userPayoutCents = amount - platformFeeCents;

    const task = await prisma.task.findUnique({ where: { id: taskId } });

    const sale = await prisma.sale.create({
      data: {
        taskId,
        userId,
        buyerName: buyerName || 'Direct Client',
        buyerEmail: buyerEmail || 'client@directclose.com',
        buyerPlatform: buyerPlatform || 'Direct',
        productDelivered: task?.title || 'Deliverable Package',
        saleAmountCents: amount,
        platformFeeCents,
        userPayoutCents,
        paymentMethod: 'stripe',
        escrowStatus: 'RELEASED', // Direct manual sales are immediately credited
        deliveredAt: new Date(),
        releasedAt: new Date(),
        proofArtifacts: proofArtifacts || [],
        loggedBy: 'user',
      },
    });

    // Increment user earnings
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalEarnings: { increment: userPayoutCents / 100 },
      },
    });

    return NextResponse.json({ success: true, sale });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
