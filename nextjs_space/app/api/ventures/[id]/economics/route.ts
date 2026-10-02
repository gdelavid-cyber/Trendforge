export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { calculateVentureEconomics } from '@/lib/finance/ledger';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const economics = await calculateVentureEconomics(id);
    return NextResponse.json({ success: true, economics });
  } catch (error: any) {
    console.error('[API_VENTURE_ECONOMICS_GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to calculate economics' }, { status: 500 });
  }
}
