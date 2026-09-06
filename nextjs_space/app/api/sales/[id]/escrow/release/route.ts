import { NextRequest, NextResponse } from 'next/server';
import { releaseEscrowPayout } from '@/lib/money/escrow';
import { forbidden, getSessionUser, isAdminRole, unauthorized } from '@/lib/core/route-auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const saleId = params.id;
    const result = await releaseEscrowPayout(saleId, {
      userId: user.id,
      isAdmin: isAdminRole((user as { role?: unknown }).role),
    });

    if (!result.ok) {
      if (result.error === 'Not your sale.') return forbidden(result.error);
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
    if ((error as { status?: number })?.status === 403) return forbidden(error.message);
    return NextResponse.json({ success: false, error: 'Release failed.' }, { status: 500 });
  }
}
