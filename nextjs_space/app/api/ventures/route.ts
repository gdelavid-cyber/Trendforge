export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { createVenture } from '@/lib/venture/engine';
import { VentureLifecycleState } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    const { searchParams } = new URL(req.url);
    const state = searchParams.get('state') as VentureLifecycleState | null;
    const industry = searchParams.get('industry');

    const where: any = {};
    if (userId) where.userId = userId;
    if (state) where.lifecycleState = state;
    if (industry) where.industry = industry;

    const ventures = await prisma.venture.findMany({
      where,
      include: {
        offers: { select: { id: true, title: true, priceCents: true, isLive: true } },
        customers: { select: { id: true, name: true, status: true } },
        leads: { select: { id: true, pipelineStage: true } },
        approvalRequests: { where: { status: 'PENDING' } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, ventures });
  } catch (error: any) {
    console.error('[API_VENTURES_GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let userId = (session?.user as any)?.id;

    // Fallback to first existing user for testing if no active session
    if (!userId) {
      const fallbackUser = await prisma.user.findFirst();
      if (!fallbackUser) {
        return NextResponse.json({ error: 'Unauthorized: No user found' }, { status: 401 });
      }
      userId = fallbackUser.id;
    }

    const body = await req.json();
    const { name, problem, targetCustomer, industry, description, businessModel, hypothesis, riskLevel, autonomyLevel, capitalAllocatedCents } = body;

    if (!name || !problem || !targetCustomer || !industry) {
      return NextResponse.json(
        { error: 'Missing required fields: name, problem, targetCustomer, industry are mandatory.' },
        { status: 400 }
      );
    }

    const venture = await createVenture({
      userId,
      name,
      problem,
      targetCustomer,
      industry,
      description,
      businessModel,
      hypothesis,
      riskLevel,
      autonomyLevel,
      capitalAllocatedCents,
    });

    return NextResponse.json({ success: true, venture }, { status: 201 });
  } catch (error: any) {
    console.error('[API_VENTURES_POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create venture' }, { status: 500 });
  }
}
