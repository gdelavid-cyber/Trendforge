export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { Header } from '@/components/header';
import { TrendsClient } from './_components/trends-client';

export default async function TrendsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/signin');

  let trends: any[] = [];
  try {
    trends = await prisma.trend.findMany({
      orderBy: { detectedAt: 'desc' },
      take: 50,
      include: { _count: { select: { tasks: true } } },
    });
  } catch (e) { console.error(e); }

  return (
    <div className="min-h-screen">
      <Header />
      <TrendsClient trends={trends.map((t: any) => ({
        id: t.id, name: t.name, sourcePlatforms: t.sourcePlatforms, mentionVelocity: t.mentionVelocity,
        sentimentScore: t.sentimentScore, confidence: t.confidence, category: t.category,
        status: t.status, hoursSinceDetection: t.hoursSinceDetection,
        detectedAt: t.detectedAt?.toISOString() ?? null, taskCount: t._count?.tasks ?? 0,
      }))} />
    </div>
  );
}
