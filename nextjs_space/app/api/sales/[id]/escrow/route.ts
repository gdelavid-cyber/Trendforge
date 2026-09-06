import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';
import { forbidden, getSessionUser, isAdminRole, unauthorized } from '@/lib/core/route-auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
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
    const admin = isAdminRole((user as { role?: unknown }).role);
    if (!admin && sale.userId !== user.id) return forbidden();

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
    return NextResponse.json({ success: false, error: 'Escrow lookup failed.' }, { status: 500 });
  }
}
