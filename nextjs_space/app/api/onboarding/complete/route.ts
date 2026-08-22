export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { step, isCompleted } = body;

    const progress = await prisma.onboardingProgress.upsert({
      where: { userId: user.id },
      update: {
        step: typeof step === 'number' ? step : undefined,
        isCompleted: isCompleted ?? undefined,
        completedAt: isCompleted ? new Date() : undefined,
      },
      create: {
        userId: user.id,
        step: typeof step === 'number' ? step : 5,
        isCompleted: isCompleted ?? true,
        completedAt: isCompleted ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, progress });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update onboarding' }, { status: 500 });
  }
}
