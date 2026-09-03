import { NextRequest, NextResponse } from 'next/server';
import { verifyAndDeductCredits, CreditAction } from '@/lib/credits/credit-manager';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId = 'default-user', action, description } = body as {
      userId?: string;
      action: CreditAction;
      description?: string;
    };

    if (!action) {
      return NextResponse.json({ ok: false, error: 'Missing action parameter' }, { status: 400 });
    }

    const result = verifyAndDeductCredits(userId, action, description);
    if (!result.success) {
      return NextResponse.json({ ok: false, error: result.error, remainingBalance: result.remainingBalance }, { status: 402 });
    }

    return NextResponse.json({
      ok: true,
      remainingBalance: result.remainingBalance,
      cost: result.cost,
      warning: result.warning,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}