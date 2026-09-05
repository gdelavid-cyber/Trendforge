import { NextRequest, NextResponse } from 'next/server';
import { refundEscrowToBuyer } from '@/lib/money/escrow';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const saleId = params.id;
    const body = await req.json().catch(() => ({}));
    const { reason = 'Buyer dispute requested' } = body;

    const sale = await refundEscrowToBuyer(saleId, reason);
    return NextResponse.json({ success: true, sale });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
