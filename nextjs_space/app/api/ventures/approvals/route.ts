export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { getPendingApprovals, resolveApprovalRequest } from '@/lib/autonomy/control-plane';
import { prisma } from '@/lib/core/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let userId = (session?.user as any)?.id;

    if (!userId) {
      const fallbackUser = await prisma.user.findFirst();
      if (!fallbackUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      userId = fallbackUser.id;
    }

    const { searchParams } = new URL(req.url);
    const ventureId = searchParams.get('ventureId') || undefined;

    const approvals = await getPendingApprovals(userId, ventureId);
    return NextResponse.json({ success: true, approvals });
  } catch (error: any) {
    console.error('[API_APPROVALS_GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let userId = (session?.user as any)?.id;

    if (!userId) {
      const fallbackUser = await prisma.user.findFirst();
      if (!fallbackUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      userId = fallbackUser.id;
    }

    const body = await req.json();
    const { requestId, status, reviewNotes } = body;

    if (!requestId || !status) {
      return NextResponse.json({ error: 'Missing requestId or status' }, { status: 400 });
    }

    const resolved = await resolveApprovalRequest({
      requestId,
      reviewerUserId: userId,
      status,
      reviewNotes,
    });

    return NextResponse.json({ success: true, approval: resolved });
  } catch (error: any) {
    console.error('[API_APPROVALS_POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to resolve approval' }, { status: 500 });
  }
}
