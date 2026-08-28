import { NextRequest, NextResponse } from 'next/server';
import { releaseEscrowPayout } from '@/lib/payments/escrow';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const saleId = params.id;
    const result = await releaseEscrowPayout(saleId);

    if (!result.ok) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          kycRequired: result.kycRequired,
        },
        { status: result.kycRequired ? 403 : 400 }
      );
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
