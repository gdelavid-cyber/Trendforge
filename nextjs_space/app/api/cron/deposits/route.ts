export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { verifyDeposits } from '@/lib/web4/deposits';

// Accepts either platform key (manual triggers send x-api-key) or Vercel's
// CRON_SECRET (sent automatically as Bearer when the schedule fires).
// Query-param keys are honored for legacy external schedulers (?key= / ?api_key=).
const CRON_SECRETS = [process.env.PIPELINE_API_KEY, process.env.CRON_SECRET]
  .filter((v): v is string => Boolean(v));

function checkCronAuth(request: Request): { authorized: boolean; error?: string; status?: number } {
  if (CRON_SECRETS.length === 0) {
    return { authorized: false, error: 'CRON auth not configured', status: 500 };
  }

  const url = new URL(request.url);
  const presented = [
    request.headers.get('authorization')?.replace('Bearer ', ''),
    request.headers.get('x-api-key'),
    url.searchParams.get('key'),
    url.searchParams.get('api_key'),
  ].filter((v): v is string => Boolean(v));

  if (!presented.some((k) => CRON_SECRETS.includes(k))) {
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
