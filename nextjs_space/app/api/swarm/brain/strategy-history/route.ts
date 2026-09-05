import { NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const history = await prisma.strategyUpdate.findMany({
      orderBy: { appliedAt: 'desc' },
      take: 50,
    });
    return NextResponse.json({ success: true, history });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
