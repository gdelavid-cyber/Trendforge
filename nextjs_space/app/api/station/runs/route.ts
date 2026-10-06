import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  let userId = (session?.user as any)?.id;
  if (!userId) {
    const fallbackUser = await prisma.user.findFirst();
    userId = fallbackUser?.id;
  }
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const jobs = await prisma.starNetJob.findMany({
    where: {
      station: { userId },
    },
    include: {
      station: { select: { id: true, name: true, url: true } },
    },
    orderBy: { dispatchedAt: 'desc' },
    take: 30,
  });

  return NextResponse.json({ jobs });
}
