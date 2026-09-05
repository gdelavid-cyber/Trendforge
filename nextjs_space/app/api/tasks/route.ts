export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') ?? '1');
    const limit = parseInt(url.searchParams.get('limit') ?? '20');
    const difficulty = url.searchParams.get('difficulty');
    const risk = url.searchParams.get('risk');
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');

    const where: any = {};
    if (difficulty && difficulty !== 'ALL') where.difficulty = difficulty;
    if (risk && risk !== 'ALL') where.riskLevel = risk;
    if (category && category !== 'ALL') where.category = category;
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { qualityScore: 'desc' },
      }),
      prisma.task.count({ where }),
    ]);

    return NextResponse.json({ tasks, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    console.error('Tasks API error:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}
