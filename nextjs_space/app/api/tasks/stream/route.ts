export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';
import { redis } from '@/lib/core/redis';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor'); // Format: "val_id"
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20'), 1), 100);
    const difficulty = searchParams.get('difficulty');
    const category = searchParams.get('category');
    const riskLevel = searchParams.get('riskLevel');
    const sort = searchParams.get('sort') || 'newest'; // "newest" | "trending" | "earnings"

    // Caching first page queries with no filters
    const isFirstPage = !cursor;
    const hasFilters = difficulty || category || riskLevel;
    const cacheKey = `tasks:stream:v1:${sort}:${limit}`;

    if (isFirstPage && !hasFilters) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return NextResponse.json(JSON.parse(cached));
        }
      } catch (redisErr: any) {
        console.error('Redis read error:', redisErr.message);
      }
    }

    const now = new Date();

    // Construct where filter
    const where: any = {
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ],
    };

    if (difficulty && difficulty !== 'ALL') where.difficulty = difficulty;
    if (category && category !== 'ALL') where.category = category;
    if (riskLevel && riskLevel !== 'ALL') where.riskLevel = riskLevel;

    // Define cursor parsing and query structures based on sort order
    let orderBy: any = [];
    if (sort === 'trending') {
      orderBy = [
        { trendScore: 'desc' },
        { id: 'desc' }
      ];
      if (cursor) {
        const [scoreStr, cursorId] = cursor.split('_');
        const score = parseFloat(scoreStr || '0');
        where.AND = [
          {
            OR: [
              { trendScore: { lt: score } },
              { trendScore: score, id: { lt: cursorId } }
            ]
          }
        ];
      }
    } else if (sort === 'earnings') {
      orderBy = [
        { estimatedEarningsHigh: 'desc' },
        { id: 'desc' }
      ];
      if (cursor) {
        const [earningsStr, cursorId] = cursor.split('_');
        const earnings = parseFloat(earningsStr || '0');
        where.AND = [
          {
            OR: [
              { estimatedEarningsHigh: { lt: earnings } },
              { estimatedEarningsHigh: earnings, id: { lt: cursorId } }
            ]
          }
        ];
      }
    } else {
      // Default: newest
      orderBy = [
        { generatedAt: 'desc' },
        { id: 'desc' }
      ];
      if (cursor) {
        const [timeStr, cursorId] = cursor.split('_');
        const cursorDate = new Date(parseInt(timeStr || '0'));
        where.AND = [
          {
            OR: [
              { generatedAt: { lt: cursorDate } },
              { generatedAt: cursorDate, id: { lt: cursorId } }
            ]
          }
        ];
      }
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy,
      take: limit + 1, // Fetch limit + 1 to determine next cursor
    });

    const hasMore = tasks.length > limit;
    const items = hasMore ? tasks.slice(0, limit) : tasks;

    let nextCursor: string | null = null;
    if (hasMore && items.length > 0) {
      const lastItem = items[items.length - 1];
      if (sort === 'trending') {
        nextCursor = `${lastItem.trendScore}_${lastItem.id}`;
      } else if (sort === 'earnings') {
        nextCursor = `${lastItem.estimatedEarningsHigh}_${lastItem.id}`;
      } else {
        nextCursor = `${lastItem.generatedAt.getTime()}_${lastItem.id}`;
      }
    }

    const responseData = {
      tasks: items.map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        difficulty: t.difficulty,
        riskLevel: t.riskLevel,
        startupCost: t.startupCost,
        estimatedEarningsLow: t.estimatedEarningsLow,
        estimatedEarningsHigh: t.estimatedEarningsHigh,
        timeToFirstDollar: t.timeToFirstDollar,
        upvotes: t.upvotes,
        downvotes: t.downvotes,
        isFeatured: t.isFeatured,
        isVerified: t.isVerified,
        category: t.category,
        trendScore: t.trendScore,
        isTrending: t.isTrending,
        generatedAt: t.generatedAt.toISOString(),
        expiresAt: t.expiresAt?.toISOString() ?? null,
      })),
      nextCursor,
    };

    // Cache the first page response for 5 minutes
    if (isFirstPage && !hasFilters) {
      try {
        await redis.setex(cacheKey, 300, JSON.stringify(responseData));
      } catch (redisErr: any) {
        console.error('Redis write error:', redisErr.message);
      }
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Stream tasks fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch task stream' }, { status: 500 });
  }
}
