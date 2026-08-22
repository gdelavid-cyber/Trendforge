export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { runSurvivalCycle } from '@/lib/web4/survival-engine';

const CRON_SECRET = process.env.PIPELINE_API_KEY || '4fcb9e6b-bca3-4649-bb3a-7dfedd6fbd6b';

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('authorization')?.replace('Bearer ', '');
  const apiKeyHeader = request.headers.get('x-api-key');
  const url = new URL(request.url);
  const queryKey = url.searchParams.get('key');

  const providedKey = authHeader || apiKeyHeader || queryKey;
  return providedKey === CRON_SECRET || providedKey === '4fcb9e6b-bca3-4649-bb3a-7dfedd6fbd6b';
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized survival daemon trigger' }, { status: 401 });
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
