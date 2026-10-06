import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const BRIDGE_SECRET = process.env.STARNET_BRIDGE_SECRET || process.env.TRENDFORGE_BRIDGE_SECRET || '';

function verifySignature(rawBody: string, header: string): boolean {
  if (!BRIDGE_SECRET) return true;
  const [scheme, digest] = header.split('=');
  if (scheme !== 'sha256' || !digest) return false;
  try {
    const expected = crypto.createHmac('sha256', BRIDGE_SECRET).update(rawBody).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(digest, 'hex'), Buffer.from(expected, 'hex'));
  } catch { return false; }
}

/**
 * POST /api/starnet/progress
 * Called by the trendforge_update tool mid-run.
 * Records a VentureMemory observation without advancing fulfillment state.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get('x-starnet-signature') || '';
  if (!verifySignature(rawBody, sig)) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });

  let data: any;
  try { data = JSON.parse(rawBody); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  console.log('[starnet/progress]', JSON.stringify(data));
  // TODO: write to VentureMemory table once schema is available
  return NextResponse.json({ ok: true, received: data.status });
}
