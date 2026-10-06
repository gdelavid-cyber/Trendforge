import { NextRequest } from 'next/server';
import { stationBus, StationEvent } from '@/lib/station/bus';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const runId = searchParams.get('runId');

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send initial heartbeat
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`));

      const listener = (event: StationEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          // Stream might be closed
        }
      };

      let unsubscribe: () => void;
      if (runId) {
        unsubscribe = stationBus.subscribeRun(runId, listener);
      } else {
        unsubscribe = stationBus.subscribeGlobal(listener);
      }

      req.signal.addEventListener('abort', () => {
        unsubscribe();
        try {
          controller.close();
        } catch {}
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
