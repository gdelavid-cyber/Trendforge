import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';

export async function GET(req: NextRequest) {
  try {
    const isStream = req.nextUrl.searchParams.get('stream') === 'true';

    if (isStream) {
      const responseStream = new TransformStream();
      const writer = responseStream.writable.getWriter();
      const encoder = new TextEncoder();

      const sendActivity = async () => {
        try {
          const logs = await prisma.executionLog.findMany({
            orderBy: { timestamp: 'desc' },
            take: 25,
          });
          const data = `data: ${JSON.stringify(logs)}\n\n`;
          await writer.write(encoder.encode(data));
        } catch (e) {}
      };

      await sendActivity();
      const interval = setInterval(sendActivity, 4000);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        writer.close().catch(() => {});
      });

      return new Response(responseStream.readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      });
    }

    const logs = await prisma.executionLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 40,
    });

    return NextResponse.json({ success: true, activity: logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
