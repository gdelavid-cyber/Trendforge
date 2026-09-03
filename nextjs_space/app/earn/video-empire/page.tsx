export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { Header } from '@/components/header';
import { VideoEmpireFlow } from './_components/video-empire-flow';

export default async function VideoEmpirePage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  let userEarnings = 0;
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totalEarnings: true },
    });
    if (user) userEarnings = user.totalEarnings;
  }

  return (
    <div className="min-h-screen bg-[#06060E] text-white">
      <Header />
      <VideoEmpireFlow userEarnings={userEarnings} />
    </div>
  );
}