import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

function categoryToArchetype(category?: string): string {
  const c = (category || '').toUpperCase();
  if (c.includes('CONTENT') || c.includes('VIDEO') || c.includes('SOCIAL')) return 'cosmic_entity';
  if (c.includes('DEFI') || c.includes('CRYPTO') || c.includes('FINANCE')) return 'wall_street_titan';
  if (c.includes('PREDICT') || c.includes('ARBITRAGE') || c.includes('DATA')) return 'quantum_android';
  return 'cyber_humanoid';
}

function parseSteps(steps: unknown): string[] {
  try {
    if (typeof steps === 'string') return JSON.parse(steps);
    if (Array.isArray(steps)) return steps as string[];
  } catch {
    /* fallthrough */
  }
  return [];
}

/** Live run status for the signed-in user's companion — drives the widget rig. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ working: false });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return NextResponse.json({ working: false });

  const active = await prisma.userTask.findFirst({
    where: { userId: user.id, status: 'IN_PROGRESS' },
    orderBy: { launchedAt: 'desc' },
    include: { task: { select: { title: true, steps: true, category: true } } },
  });

  if (!active) return NextResponse.json({ working: false });

  const steps = parseSteps(active.task?.steps);
  const total = steps.length;
  const done = active.stepsCompleted ?? 0;
  const progress = total > 0 ? Math.min(done / total, 1) : undefined;
  const label =
    total > 0
      ? steps[Math.min(done, total - 1)]
      : active.task?.title || 'Executing task';

  return NextResponse.json({
    working: true,
    label,
    progress,
    archetype: categoryToArchetype(active.task?.category),
    taskTitle: active.task?.title ?? null,
  });
}
