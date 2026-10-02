export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { ingestMarketSignal, clusterMarketSignals, validateDemand } from '@/lib/opportunity/intelligence';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const industry = searchParams.get('industry') || undefined;

    const clusters = await clusterMarketSignals(industry);
    return NextResponse.json({ success: true, clusters });
  } catch (error: any) {
    console.error('[API_SIGNALS_GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = 'ingest', signalData, validationData } = body;

    if (action === 'validate') {
      const result = await validateDemand(validationData);
      return NextResponse.json({ success: true, validation: result });
    }

    const result = await ingestMarketSignal(signalData);
    return NextResponse.json({ success: true, signal: result.signal, isDuplicate: result.isDuplicate });
  } catch (error: any) {
    console.error('[API_SIGNALS_POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process signal' }, { status: 500 });
  }
}
