export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { runSurvivalCycle } from '@/lib/swarm/survival-engine';
import { checkCronAuth } from '@/lib/core/route-auth';


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
