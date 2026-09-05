import { prisma } from '@/lib/core/db';

// Guide/tour persistence on OnboardingProgress. tourDone gates the one-time
// auto spotlight; guideSeenAt records that the /guide hub was opened.

export interface GuideStatus {
  tourDone: boolean;
  guideSeenAt: Date | null;
}

async function getOrCreateProgress(userId: string) {
  const existing = await prisma.onboardingProgress.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.onboardingProgress.create({ data: { userId } });
}

export async function getGuideStatus(userId: string): Promise<GuideStatus> {
  const progress = await getOrCreateProgress(userId);
  return { tourDone: progress.tourDone, guideSeenAt: progress.guideSeenAt };
}

export async function markGuideSeen(userId: string): Promise<GuideStatus> {
  await getOrCreateProgress(userId);
  const progress = await prisma.onboardingProgress.update({
    where: { userId },
    data: { guideSeenAt: new Date() },
  });
  return { tourDone: progress.tourDone, guideSeenAt: progress.guideSeenAt };
}

export async function markTourDone(userId: string): Promise<GuideStatus> {
  await getOrCreateProgress(userId);
  const progress = await prisma.onboardingProgress.update({
    where: { userId },
    data: { tourDone: true },
  });
  return { tourDone: progress.tourDone, guideSeenAt: progress.guideSeenAt };
}
