import { NextRequest, NextResponse } from 'next/server';
import { createEscrowForSale } from '@/lib/money/escrow';
import { forbidden, getSessionUser, isAdminRole, unauthorized } from '@/lib/core/route-auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const saleId = params.id;
    const body = await req.json().catch(() => ({}));
    const { stripePaymentIntentId } = body;

    const sale = await createEscrowForSale(saleId, stripePaymentIntentId, {
      userId: user.id,
      isAdmin: isAdminRole((user as { role?: unknown }).role),
    });
    return NextResponse.json({ success: true, sale });
  } catch (error: any) {
    if ((error as { status?: number })?.status === 403) return forbidden(error.message);
    return NextResponse.json({ success: false, error: 'Escrow creation failed.' }, { status: 500 });
  }
}
