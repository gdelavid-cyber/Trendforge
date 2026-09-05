import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateCreditAccount, TIER_CONFIGS } from '@/lib/growth/credits/credit-manager';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId') || 'default-user';
    const account = getOrCreateCreditAccount(userId);
    const tierConfig = TIER_CONFIGS[account.tier];

    return NextResponse.json({
      ok: true,
      balance: account.balance,
      monthlyAllocation: account.monthlyAllocation,
      lifetimeUsed: account.lifetimeUsed,
      tier: account.tier,
      tierName: tierConfig.name,
      history: account.history.slice(0, 10),
      isEmergencyLocked: account.emergencyLock,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}