export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { runSurvivalCycle } from '@/lib/web4/survival-engine';

// Accepts the platform key or Vercel's CRON_SECRET (sent automatically as
// Bearer auth when the schedule fires).
const CRON_SECRET = process.env.PIPELINE_API_KEY ?? process.env.CRON_SECRET;

function checkCronAuth(request: Request): { authorized: boolean; error?: string; status?: number } {
  if (!CRON_SECRET) {
    return { authorized: false, error: 'CRON auth not configured', status: 500 };
  }

  const authHeader = request.headers.get('authorization')?.replace('Bearer ', '');
  const apiKeyHeader = request.headers.get('x-api-key');

  const providedKey = authHeader || apiKeyHeader;
  if (providedKey !== CRON_SECRET) {
    return { authorized: false, error: 'Unauthorized survival daemon trigger', status: 401 };
  }

  return { authorized: true };
}


export async function GET(request: Request) {
  const auth = checkCronAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const result = await runSurvivalCycle();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[SURVIVAL_DAEMON_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Survival daemon failure' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
