export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/core/db';
import { Header } from '@/components/header';
import { StoriesClient } from './_components/stories-client';

export default async function StoriesPage() {
  let stories: any[] = [];
  try {
    stories = await prisma.successStory.findMany({
      where: { isPublished: true, verificationStatus: 'VERIFIED' },
      include: { user: { select: { name: true } }, task: { select: { title: true, category: true } } },
      orderBy: { earningsAmount: 'desc' },
    });
  } catch (e) { console.error(e); }

  return (
    <div className="min-h-screen">
      <Header />
      <StoriesClient stories={stories.map((s: any) => ({
        id: s.id, earningsAmount: s.earningsAmount, description: s.description,
        userName: s.user?.name ?? 'Anonymous', taskTitle: s.task?.title ?? 'Unknown',
        taskCategory: s.task?.category ?? 'OTHER',
        createdAt: s.createdAt?.toISOString() ?? null,
      }))} />
    </div>
  );
}
