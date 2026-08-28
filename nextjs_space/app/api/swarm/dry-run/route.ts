import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const brainState = await prisma.swarmBrainState.findUnique({ where: { id: 'global' } });
  return NextResponse.json({
    dryRun: brainState?.dryRun ?? false,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const brainState = await prisma.swarmBrainState.findUnique({ where: { id: 'global' } });
    const newDryRun = typeof body.enabled === 'boolean' ? body.enabled : !(brainState?.dryRun ?? false);

    const updated = await prisma.swarmBrainState.update({
      where: { id: 'global' },
      data: { dryRun: newDryRun },
    });

    return NextResponse.json({
      success: true,
      dryRun: updated.dryRun,
      message: `Dry-run mode ${updated.dryRun ? 'ENABLED (real outreach & charges paused)' : 'DISABLED (live execution active)'}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
