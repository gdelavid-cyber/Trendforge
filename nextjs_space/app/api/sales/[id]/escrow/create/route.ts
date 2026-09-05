import { NextRequest, NextResponse } from 'next/server';
import { createEscrowForSale } from '@/lib/money/escrow';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const saleId = params.id;
    const body = await req.json().catch(() => ({}));
    const { stripePaymentIntentId } = body;

    const sale = await createEscrowForSale(saleId, stripePaymentIntentId);
    return NextResponse.json({ success: true, sale });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
