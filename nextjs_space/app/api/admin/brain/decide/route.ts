export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { resolveBrainDecision } from '@/lib/intelligence/brain/decisions';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }

    const adminId = (session.user as any)?.id || 'admin';
    const body = await request.json();
    const { decisionId, action } = body ?? {};

    if (!decisionId || !action || !['approved', 'rejected'].includes(action)) {
      return NextResponse.json({ error: 'Missing or invalid decisionId/action parameter' }, { status: 400 });
    }

    const updated = await resolveBrainDecision(decisionId, action as 'approved' | 'rejected', adminId);

    return NextResponse.json({
      success: true,
      decision: updated,
    });
  } catch (error: any) {
    console.error('Brain decision action error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update decision' }, { status: 500 });
  }
}
