import { prisma } from '@/lib/core/db';

// One owned identity per user. Lazily forged on first touch so existing
// users never need a migration step.

const DEFAULT_CONFIG = {
  baseModel: 'cyber-humanoid',
  body: { proportions: 'athletic', stance: 'confident' },
  skin: { primary: '#00F0FF', secondary: '#0A0A14', pattern: 'metallic' },
};

const DEFAULT_PERSONALITY = {
  traits: ['friendly', 'analytical', 'witty'],
  bio: 'Forged in the Trendly plaza. Here to make money moves with you.',
};

export async function getOrCreatePrimary(userId: string) {
  const existing = await prisma.companion.findFirst({
    where: { userId },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
  });
  if (existing) return existing;

  const agent = await prisma.web4Agent.findFirst({
    where: { userId },
    orderBy: { profit: 'desc' },
    select: { name: true },
  });

  // Only one primary per user (v1 single-companion).
  const count = await prisma.companion.count({ where: { userId } });

  return prisma.companion.create({
    data: {
      userId,
      name: agent?.name?.trim() || 'Nova',
      isPrimary: count === 0,
      config: DEFAULT_CONFIG as any,
      personality: DEFAULT_PERSONALITY as any,
      skills: [],
    },
  });
}

/** Level rule: every 5 completed tasks = +1 level. */
export function levelFor(tasksCompleted: number): number {
  return Math.floor(Math.max(tasksCompleted, 0) / 5) + 1;
}

export async function recordTaskCompleted(companionId: string) {
  const c = await prisma.companion.findUnique({ where: { id: companionId } });
  if (!c) return null;
  const tasksCompleted = c.tasksCompleted + 1;
  return prisma.companion.update({
    where: { id: companionId },
    data: { tasksCompleted, level: levelFor(tasksCompleted) },
  });
}
