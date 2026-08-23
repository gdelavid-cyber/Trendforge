export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db';
import { createRedisClient } from '@/lib/redis';

export async function GET(request: Request) {
  const subClient = createRedisClient();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      const pushEvent = (event: string, data: any) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch (e) {
          // Stream might be already closed
        }
      };

      // Push initial top 10 trending tasks
      try {
        const now = new Date();
        const topTrending = await prisma.task.findMany({
          where: {
            isFeatured: true,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: now } }
            ]
          },
          orderBy: { trendScore: 'desc' },
          take: 10,
        });
        
        pushEvent('initial', topTrending.map((t: any) => ({
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
          isTrending: t.isTrending,
          generatedAt: t.generatedAt.toISOString(),
          expiresAt: t.expiresAt?.toISOString() ?? null,
        })));
      } catch (err: any) {
        console.error('SSE initial load error:', err.message);
      }

      // Heartbeat to prevent timeouts
      const keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch {
          clearInterval(keepAliveInterval);
        }
      }, 15000);

      // Subscribe to Redis Pub/Sub channel
      try {
        await subClient.subscribe('trending-tasks');
        subClient.on('message', (channel, message) => {
          if (channel === 'trending-tasks') {
            try {
              const data = JSON.parse(message);
              pushEvent('message', data);
            } catch (err) {
              console.error('Error parsing published redis msg:', err);
            }
          }
        });
      } catch (subErr: any) {
        console.error('Redis subscription error in SSE:', subErr.message);
      }

      // Cleanup
      request.signal.addEventListener('abort', async () => {
        clearInterval(keepAliveInterval);
        try {
          await subClient.unsubscribe('trending-tasks');
          await subClient.disconnect();
        } catch (e) {
          // Ignore close errors
        }
        try {
          controller.close();
        } catch (e) {
          // Ignore close errors
        }
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
