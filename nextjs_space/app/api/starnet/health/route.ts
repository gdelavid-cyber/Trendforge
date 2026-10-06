import { NextResponse } from 'next/server';
import { checkStationHealth } from '@/lib/execution/runners/starnet';

export async function GET() {
  const alive = await checkStationHealth();
  return NextResponse.json({ station: alive ? 'reachable' : 'unreachable', ts: new Date().toISOString() });
}
