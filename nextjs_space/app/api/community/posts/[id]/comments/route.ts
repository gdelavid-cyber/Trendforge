export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const comments = await prisma.communityComment.findMany({
      where: { postId: id },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { name: true, email: true, role: true } },
      },
    });

    return NextResponse.json({
      success: true,
      comments: comments.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
        author: c.user.name || c.user.email.split('@')[0],
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const userId = (session.user as any)?.id;
    const { id } = await params;
    const body = await request.json();
    const { content } = body ?? {};

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    const comment = await prisma.communityComment.create({
      data: {
        postId: id,
        userId,
        content: content.trim(),
      },
    });

    // Reward user with 2 points for commenting
    await prisma.user.update({
      where: { id: userId },
      data: { communityPoints: { increment: 2 } },
    });

    return NextResponse.json({ success: true, comment });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to post comment' }, { status: 500 });
  }
}
