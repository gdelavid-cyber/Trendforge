export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
export async function GET(_req: NextRequest) {
  try {
    return NextResponse.json({ success: true, brief: null });
  } catch (error: any) {
    console.error('[API_CEO_PORTFOLIO_BRIEF] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate CEO brief' }, { status: 500 });
  }
}
