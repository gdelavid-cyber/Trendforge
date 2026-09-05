export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { AGENT_CONFIGS, getUserQuota } from '@/lib/agents/quota';
import { getCircuitState } from '@/lib/agents/circuit-breaker';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id || 'anonymous';
    const userRole = (session?.user as any)?.role || 'FREE';

    const agentsList = await Promise.all(
      Object.entries(AGENT_CONFIGS).map(async ([type, config]) => {
        const quota = session?.user ? await getUserQuota(userId, type, userRole) : null;
        const circuit = getCircuitState(type);

        return {
          type,
          name: config.name,
          description: config.description,
          category: config.category,
          costCents: config.costCents,
          estimatedDuration: config.estimatedDuration,
          circuitState: circuit.state,
          isAvailable: circuit.state !== 'OPEN',
          quota: quota
            ? {
                runsUsed: quota.runsUsed,
                runsLimit: quota.runsLimit,
                remaining: quota.remaining,
                hasQuota: quota.hasQuota,
                isPro: quota.isPro,
              }
            : {
                runsUsed: 0,
                runsLimit: config.freeLimit,
                remaining: config.freeLimit,
                hasQuota: true,
                isPro: false,
              },
        };
      })
    );

    return NextResponse.json({
      success: true,
      agents: agentsList,
      isAuthenticated: !!session?.user,
    });
  } catch (error: any) {
    console.error('List agents error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to list agents' }, { status: 500 });
  }
}
