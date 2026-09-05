export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const updated = await prisma.hotTrendProposal.update({
      where: { id },
      data: {
        timesAccessedByUsers: { increment: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      timesAccessedByUsers: updated.timesAccessedByUsers,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Access tracking failed' }, { status: 500 });
  }
}
