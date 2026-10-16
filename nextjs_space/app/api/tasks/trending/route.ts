export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';
import { createRedisClient } from '@/lib/core/redis';

export async function GET(request: Request) {
  const acceptHeader = request.headers.get('accept') || '';
  const now = new Date();

  // If client doesn't explicitly want SSE, return JSON directly
  if (!acceptHeader.includes('text/event-stream')) {
    try {
      const topTrending = await prisma.task.findMany({
        where: {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: now } },
          ],
        },
        orderBy: [{ isFeatured: 'desc' }, { trendScore: 'desc' }],
        take: 10,
      });

      return NextResponse.json(
        topTrending.map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          difficulty: t.difficulty,
          riskLevel: t.riskLevel,
          startupCost: t.startupCost,
          estimatedEarningsLow: t.estimatedEarningsLow,
          estimatedEarningsHigh: t.estimatedEarningsHigh,
          timeToFirstDollar: t.timeToFirstDollar,
          category: t.category,
          trendScore: t.trendScore,
          isTrending: (t.trendScore ?? 0) >= 80,
          generatedAt: t.generatedAt.toISOString(),
          expiresAt: t.expiresAt?.toISOString() ?? null,
        }))
      );
    } catch (err: any) {
      console.error('Trending tasks JSON fetch error:', err.message);
      return NextResponse.json([], { status: 500 });
    }
  }

  // SSE Stream
  const subClient = createRedisClient();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const pushEvent = (event: string, data: any) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Stream might be closed
        }
      };

      try {
        const topTrending = await prisma.task.findMany({
          where: {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: now } },
            ],
          },
          orderBy: [{ isFeatured: 'desc' }, { trendScore: 'desc' }],
          take: 10,
        });

        pushEvent(
          'initial',
          topTrending.map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            difficulty: t.difficulty,
            riskLevel: t.riskLevel,
            startupCost: t.startupCost,
            estimatedEarningsLow: t.estimatedEarningsLow,
            estimatedEarningsHigh: t.estimatedEarningsHigh,
            timeToFirstDollar: t.timeToFirstDollar,
            category: t.category,
            trendScore: t.trendScore,
            isTrending: (t.trendScore ?? 0) >= 80,
            generatedAt: t.generatedAt.toISOString(),
            expiresAt: t.expiresAt?.toISOString() ?? null,
          }))
        );
      } catch (err: any) {
        console.error('SSE initial load error:', err.message);
      }

      const keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch {
          clearInterval(keepAliveInterval);
        }
      }, 15000);

      try {
        if (subClient?.subscribe) {
          await subClient.subscribe('trending-tasks');
          subClient.on('message', (channel: string, message: string) => {
            if (channel === 'trending-tasks') {
              try {
                const data = JSON.parse(message);
                pushEvent('message', data);
              } catch (err) {
                console.error('Error parsing published redis msg:', err);
              }
            }
          });
        }
      } catch (subErr: any) {
        // Redis optional
      }

      request.signal.addEventListener('abort', async () => {
        clearInterval(keepAliveInterval);
        try {
          if (subClient?.unsubscribe) await subClient.unsubscribe('trending-tasks');
          if (subClient?.disconnect) await subClient.disconnect();
        } catch {
          // Safe ignore
        }
        try {
          controller.close();
        } catch {
          // Safe ignore
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
