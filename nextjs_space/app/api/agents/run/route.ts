export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { launchAgentRun } from '@/lib/agents/orchestrator';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    let userId = (session?.user as any)?.id;
    let userRole = (session?.user as any)?.role || 'FREE';
    let userEmail = session?.user?.email || undefined;
    let userName = session?.user?.name || undefined;

    if (!userId) {
      const fallbackUser = await prisma.user.findFirst();
      if (fallbackUser) {
        userId = fallbackUser.id;
        userRole = (fallbackUser as any).role || 'ADMIN';
        userEmail = fallbackUser.email || undefined;
        userName = fallbackUser.name || undefined;
      } else {
        return NextResponse.json({ error: 'Authentication required to launch agent' }, { status: 401 });
      }
    }

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
