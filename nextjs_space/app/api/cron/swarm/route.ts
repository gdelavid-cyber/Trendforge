export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { executeSwarmPulse } from '@/lib/swarm/controller';
import { checkCronAuth } from '@/lib/core/route-auth';


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
