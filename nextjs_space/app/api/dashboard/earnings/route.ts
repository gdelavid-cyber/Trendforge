import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';
import { userRealIncomeUsdc } from '@/lib/money/ledger';
import { getSessionUser, unauthorized } from '@/lib/core/route-auth';

// Ledger-backed earnings. Sale rows are claims until escrow release posts
// TRADE_PROCEEDS, so the headline number comes from the ledger; the
// unverified pipeline is reported separately and labeled as such.
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const [realIncomeUsdc, sales] = await Promise.all([
      userRealIncomeUsdc(user.id),
      prisma.sale.findMany({ where: { userId: user.id } }),
    ]);

    const unverifiedCents = sales
      .filter((s) => s.escrowStatus === 'HELD' || s.escrowStatus === 'PENDING')
      .reduce((acc, s) => acc + s.userPayoutCents, 0);
    const completedSalesCount = sales.filter((s) => s.escrowStatus === 'RELEASED').length;
    const pendingSalesCount = sales.filter((s) => s.escrowStatus === 'HELD' || s.escrowStatus === 'PENDING').length;

    return NextResponse.json({
      success: true,
      earnings: {
        realIncomeUsdc,
        unverifiedPipelineCents: unverifiedCents,
        completedSalesCount,
        pendingSalesCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Earnings lookup failed.' }, { status: 500 });
  }
}
