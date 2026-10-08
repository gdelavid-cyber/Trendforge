import { NextRequest, NextResponse } from 'next/server';
import { getAllPackets, getPendingPacket, registerHmhuPacket, HmhuPacket } from '@/lib/station/hmhu/protocol';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const runId = searchParams.get('runId') || undefined;
    const ventureId = searchParams.get('ventureId') || undefined;

    if (runId) {
      const pending = getPendingPacket(runId);
      return NextResponse.json({
        ok: true,
        pending: pending || null,
        packets: getAllPackets(ventureId).filter((p) => p.runId === runId),
      });
    }

    const packets = getAllPackets(ventureId);
    return NextResponse.json({
      ok: true,
      pending: getPendingPacket(),
      packets,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const packet = await registerHmhuPacket(body as HmhuPacket);
    return NextResponse.json({ ok: true, packet });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
