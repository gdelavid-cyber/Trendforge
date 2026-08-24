export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { verifyDeposits } from '@/lib/web4/deposits';

const CRON_SECRET = process.env.PIPELINE_API_KEY;

function checkCronAuth(request: Request): { authorized: boolean; error?: string; status?: number } {
  if (!CRON_SECRET) {
    return { authorized: false, error: 'CRON auth not configured', status: 500 };
  }

  const authHeader = request.headers.get('authorization')?.replace('Bearer ', '');
  const apiKeyHeader = request.headers.get('x-api-key');

  const providedKey = authHeader || apiKeyHeader;
  if (providedKey !== CRON_SECRET) {
    return { authorized: false, error: 'Unauthorized deposit verifier trigger', status: 401 };
  }

  return { authorized: true };
}

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
