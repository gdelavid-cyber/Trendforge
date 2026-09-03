import { NextRequest, NextResponse } from 'next/server';
import {
  getPlatformArbitrageMatrix,
  generateMultiPlatformListing,
} from '@/lib/earn/agents';

export async function GET(req: NextRequest) {
  try {
    const matrix = getPlatformArbitrageMatrix();
    const assetTitle = req.nextUrl.searchParams.get('title') || 'HVAC AI Dispatch SOP Master Pack';
    const basePrice = parseFloat(req.nextUrl.searchParams.get('price') || '49');
    const multiListings = generateMultiPlatformListing(assetTitle, basePrice);

    return NextResponse.json({
      ok: true,
      matrix,
      multiListings,
      topPlatform: 'Whop (95% Payout)',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to fetch platform arbitrage' },
      { status: 500 }
    );
  }
}