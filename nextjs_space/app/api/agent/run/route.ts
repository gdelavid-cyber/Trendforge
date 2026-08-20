export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { launchAgentRun } from '@/lib/agents/orchestrator';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required to launch agent' }, { status: 401 });
    }

    const userId = (session.user as any)?.id;
    const userRole = (session.user as any)?.role || 'FREE';
    const userEmail = session.user.email || undefined;
    const userName = session.user.name || undefined;

    const body = await request.json();
    const { agentType, parameters } = body ?? {};

    if (!agentType) {
      return NextResponse.json({ error: 'Missing agentType parameter' }, { status: 400 });
    }

    const result = await launchAgentRun({
      userId,
      agentType,
      parameters: parameters || {},
      userRole,
      userEmail,
      userName,
    });

    return NextResponse.json({
      success: true,
      runId: result.runId,
      status: result.status,
    });
  } catch (error: any) {
    console.error('Launch agent run error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to start agent run' }, { status: 500 });
  }
}
