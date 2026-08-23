export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { executeSwarmPulse } from '@/lib/swarm/controller';

const CRON_SECRET = process.env.PIPELINE_API_KEY;

function checkCronAuth(request: Request): { authorized: boolean; error?: string; status?: number } {
  if (!CRON_SECRET) {
    return { authorized: false, error: 'CRON auth not configured', status: 500 };
  }

  const authHeader = request.headers.get('authorization')?.replace('Bearer ', '');
  const apiKeyHeader = request.headers.get('x-api-key');

  const providedKey = authHeader || apiKeyHeader;
  if (providedKey !== CRON_SECRET) {
    return { authorized: false, error: 'Unauthorized', status: 401 };
  }

  return { authorized: true };
}


export async function GET(request: Request) {
  const auth = checkCronAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get('dry') === '1';

  try {
    const result = await executeSwarmPulse(dryRun);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Swarm cron cycle failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = checkCronAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get('dry') === '1';

  try {
    const result = await executeSwarmPulse(dryRun);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Swarm cron cycle failed' },
      { status: 500 }
    );
  }
}
