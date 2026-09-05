export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { id } = await params;

    const updated = await prisma.communityPost.update({
      where: { id },
      data: {
        upvotes: { increment: 1 },
      },
    });

    return NextResponse.json({ success: true, upvotes: updated.upvotes });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to upvote' }, { status: 500 });
  }
}
