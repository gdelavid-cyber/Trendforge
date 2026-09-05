import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const saleId = params.id;
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        task: { select: { title: true, category: true } },
        lead: true,
        user: { select: { name: true, email: true } },
      },
    });

    if (!sale) return NextResponse.json({ success: false, error: 'Sale not found' }, { status: 404 });

    return NextResponse.json({
      success: true,
      escrow: {
        saleId: sale.id,
        status: sale.escrowStatus,
        grossAmountCents: sale.saleAmountCents,
        platformFeeCents: sale.platformFeeCents,
        userPayoutCents: sale.userPayoutCents,
        buyerName: sale.buyerName,
        buyerEmail: sale.buyerEmail,
        deliveredAt: sale.deliveredAt,
        releasedAt: sale.releasedAt,
        proofArtifacts: sale.proofArtifacts,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
