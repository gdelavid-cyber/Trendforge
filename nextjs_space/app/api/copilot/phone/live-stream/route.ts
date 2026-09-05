export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId') || 'default_session';

  // Legal requirement: Two-party consent disclosure audio greeting played before transcription
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">This conversation may be monitored and transcribed to improve the experience.</Say>
    <Connect>
        <Stream url="wss://trendly.io/api/copilot/phone/stream-connect?sessionId=${encodeURIComponent(sessionId)}" />
    </Connect>
</Response>`;

  return new NextResponse(twiml, {
    status: 200,
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}
