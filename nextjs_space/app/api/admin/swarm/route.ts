export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { isGlobalKillSwitchActive, setGlobalKillSwitch } from '@/lib/swarm/gatekeeper';
import { ensureSpeciesSeeded, reconcileInstances } from '@/lib/swarm/registry';
import { SpeciesStatus } from '@prisma/client';

async function checkAdminAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || (user.role !== 'ADMIN' && user.role !== 'PRO')) {
    return null;
  }
  return user;
}

export async function GET() {
  const admin = await checkAdminAuth();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await ensureSpeciesSeeded();
  await reconcileInstances();

  const [speciesList, killSwitchActive, activeJobs, recentReviews] = await Promise.all([
    prisma.agentSpecies.findMany({
      include: { instances: true },
      orderBy: { role: 'asc' },
    }),
    isGlobalKillSwitchActive(),
    prisma.assetJob.findMany({
      take: 20,
      orderBy: { updatedAt: 'desc' },
      include: { qaReviews: true },
    }),
    prisma.qAReview.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: { job: true },
    }),
  ]);

  const totalSpendToday = speciesList.reduce((acc, s) => acc + (s.currentSpendUsd || 0), 0);

  return NextResponse.json({
    success: true,
    killSwitchActive,
    totalSpendToday,
    speciesList,
    activeJobs,
    recentReviews,
  });
}

export async function POST(request: Request) {
  const admin = await checkAdminAuth();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, speciesId, status, targetHeadcount, killSwitch } = body;

    if (action === 'TOGGLE_KILLSWITCH') {
      await setGlobalKillSwitch(Boolean(killSwitch));
      return NextResponse.json({ success: true, killSwitch: Boolean(killSwitch) });
    }

    if (action === 'UPDATE_SPECIES' && speciesId) {
      const dataToUpdate: any = {};
      if (status && Object.values(SpeciesStatus).includes(status)) {
        dataToUpdate.status = status;
      }
      if (typeof targetHeadcount === 'number' && targetHeadcount >= 0) {
        dataToUpdate.targetHeadcount = targetHeadcount;
      }

      const updated = await prisma.agentSpecies.update({
        where: { id: speciesId },
        data: dataToUpdate,
      });

      await reconcileInstances();
      return NextResponse.json({ success: true, species: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Admin action failed' }, { status: 500 });
  }
}
