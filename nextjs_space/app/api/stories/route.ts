export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const stories = await prisma.successStory.findMany({
      where: { isPublished: true, verificationStatus: 'VERIFIED' },
      include: { user: { select: { name: true } }, task: { select: { title: true, category: true } } },
      orderBy: { earningsAmount: 'desc' },
    });
    return NextResponse.json({ stories });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as any)?.id;
    const { taskId, earningsAmount, description } = await request.json();

    if (!taskId || !earningsAmount || !description) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    }

    const story = await prisma.successStory.create({
      data: { userId, taskId, earningsAmount, description },
    });

    return NextResponse.json({ story });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to submit story' }, { status: 500 });
  }
}
