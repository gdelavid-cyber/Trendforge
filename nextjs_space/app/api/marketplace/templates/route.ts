export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const templates = await prisma.template.findMany({
      where: { isApproved: true },
      include: { user: { select: { name: true } } },
      orderBy: { downloads: 'desc' },
    });
    return NextResponse.json({ templates });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as any)?.id;
    const { title, description, price, category } = await request.json();

    const template = await prisma.template.create({
      data: { userId, title: title ?? '', description: description ?? '', price: price ?? 0, category: category ?? 'general' },
    });

    return NextResponse.json({ template });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
