import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';
import { forbidden, getSessionUser, isAdminRole, unauthorized } from '@/lib/core/route-auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const saleId = params.id;
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { task: true },
    });

    if (!sale) return NextResponse.json({ success: false, error: 'Sale not found' }, { status: 404 });
    const admin = isAdminRole((user as { role?: unknown }).role);
    if (!admin && sale.userId !== user.id) return forbidden();

    const paymentLink = `https://checkout.trendly.io/pay/${sale.id}`;

    return NextResponse.json({
      success: true,
      paymentRequest: {
        saleId: sale.id,
        amountFormatted: `$${(sale.saleAmountCents / 100).toFixed(2)}`,
        amountCents: sale.saleAmountCents,
        buyerName: sale.buyerName,
        buyerEmail: sale.buyerEmail,
        productName: sale.productDelivered,
        paymentLink,
        status: sale.escrowStatus,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Payment request failed.' }, { status: 500 });
  }
}
