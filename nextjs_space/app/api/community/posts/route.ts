export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');

    const where: any = {};
    if (category && category !== 'ALL') {
      where.category = category;
    }

    const posts = await prisma.communityPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 40,
      include: {
        user: { select: { name: true, email: true, role: true, communityPoints: true } },
        _count: { select: { comments: true } },
      },
    });

    return NextResponse.json({
      success: true,
      posts: posts.map((p) => ({
        id: p.id,
        title: p.title,
        content: p.content,
        category: p.category,
        upvotes: p.upvotes,
        createdAt: p.createdAt.toISOString(),
        author: {
          name: p.user.name || p.user.email.split('@')[0],
          role: p.user.role,
          communityPoints: p.user.communityPoints,
        },
        commentsCount: p._count.comments,
      })),
    });
  } catch (error: any) {
    console.error('Fetch community posts error:', error);
    return NextResponse.json({ error: 'Failed to fetch community discussions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = (session.user as any)?.id;
    const body = await request.json();
    const { title, content, category = 'GENERAL' } = body ?? {};

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const post = await prisma.communityPost.create({
      data: {
        userId,
        title: title.trim(),
        content: content.trim(),
        category,
      },
    });

    // Reward user with 10 Community Points for creating a post
    await prisma.user.update({
      where: { id: userId },
      data: {
        communityPoints: { increment: 10 },
      },
    });

    return NextResponse.json({
      success: true,
      post,
      communityPointsAwarded: 10,
    });
  } catch (error: any) {
    console.error('Create community post error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create post' }, { status: 500 });
  }
}
