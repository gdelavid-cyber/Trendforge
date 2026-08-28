import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id : null;

    const sales = await prisma.sale.findMany({
      where: userId ? { userId } : {},
    });

    const totalSalesGross = sales.reduce((acc, s) => acc + s.saleAmountCents, 0);
    const totalPlatformFees = sales.reduce((acc, s) => acc + s.platformFeeCents, 0);
    const totalNetPayouts = sales
      .filter((s) => s.escrowStatus === 'RELEASED')
      .reduce((acc, s) => acc + s.userPayoutCents, 0);
    const totalHeldInEscrow = sales
      .filter((s) => s.escrowStatus === 'HELD' || s.escrowStatus === 'PENDING')
      .reduce((acc, s) => acc + s.userPayoutCents, 0);

    const completedSalesCount = sales.filter((s) => s.escrowStatus === 'RELEASED').length;
    const pendingSalesCount = sales.filter((s) => s.escrowStatus === 'HELD' || s.escrowStatus === 'PENDING').length;

    return NextResponse.json({
      success: true,
      earnings: {
        totalSalesGrossCents: totalSalesGross,
        totalPlatformFeesCents: totalPlatformFees,
        totalNetPayoutsCents: totalNetPayouts,
        totalHeldInEscrowCents: totalHeldInEscrow,
        completedSalesCount,
        pendingSalesCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
