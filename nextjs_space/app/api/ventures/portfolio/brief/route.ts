export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { generateCeoPortfolioBrief } from '@/lib/council/orchestration/venture-hierarchy';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    const brief = await generateCeoPortfolioBrief(userId);
    return NextResponse.json({ success: true, brief });
  } catch (error: any) {
    console.error('[API_CEO_PORTFOLIO_BRIEF] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate CEO brief' }, { status: 500 });
  }
}
