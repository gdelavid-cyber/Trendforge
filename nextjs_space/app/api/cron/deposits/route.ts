export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { verifyDeposits } from '@/lib/money/deposits';
import { checkCronAuth } from '@/lib/core/route-auth';

/** Scans the treasury for new USDC deposits and credits matched agents. */
export async function GET(request: Request) {
  const auth = checkCronAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const result = await verifyDeposits();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[DEPOSIT_VERIFIER_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Deposit verifier failure' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
