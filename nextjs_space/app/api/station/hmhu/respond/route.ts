import { NextRequest, NextResponse } from 'next/server';
import { resolveHmhuPacket } from '@/lib/station/hmhu/protocol';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { packetId, selectedOption, customInput } = body;

    if (!packetId) {
      return NextResponse.json({ ok: false, error: 'packetId is required' }, { status: 400 });
    }

    if (!selectedOption && !customInput) {
      return NextResponse.json({ ok: false, error: 'selectedOption or customInput is required' }, { status: 400 });
    }

    const resolved = await resolveHmhuPacket(packetId, {
      selectedOption,
      customInput,
    });

    return NextResponse.json({
      ok: true,
      packetId,
      resolvedPacket: resolved,
      message: 'Commander directive processed. Autonomous agent loop unblocked.',
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
