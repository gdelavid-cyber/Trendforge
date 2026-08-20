export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any)?.id;
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        referralCode: true,
        bonusAgentRuns: true,
        referralsMade: {
          orderBy: { signedUpAt: 'desc' },
          select: {
            id: true,
            referredEmail: true,
            signedUpAt: true,
            upgradedAt: true,
            commissionEarned: true,
            status: true,
          },
        },
      },
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Generate referral code if user doesn't have one
    if (!user.referralCode) {
      const newCode = `TF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      await prisma.user.update({
        where: { id: userId },
        data: { referralCode: newCode },
      });
      user.referralCode = newCode;
    }

    const totalReferrals = user.referralsMade.length;
    const totalCommissions = user.referralsMade.reduce((acc, r) => acc + (r.commissionEarned || 0), 0);

    return NextResponse.json({
      success: true,
      referralCode: user.referralCode,
      referralUrl: `https://trendforge-chi.vercel.app/ref/${user.referralCode}`,
      bonusAgentRuns: user.bonusAgentRuns,
      totalReferrals,
      totalCommissions,
      referrals: user.referralsMade,
    });
  } catch (error: any) {
    console.error('Referral API error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch referrals' }, { status: 500 });
  }
}
