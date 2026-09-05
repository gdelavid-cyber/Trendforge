import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const bundle = await prisma.evidenceBundle.findUnique({
      where: { taskId: params.taskId },
    });

    if (!bundle) {
      return NextResponse.json({ success: false, error: 'Evidence bundle not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      bundle,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
