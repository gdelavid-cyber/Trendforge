import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';

export const dynamic = 'force-dynamic';

export interface VettedOpportunity {
  id: string;
  trendId: string;
  taskId?: string;
  title: string;
  category: string;
  marketVector: string;
  buyerPriceRange: string; // e.g. "$250 – $650", or pending when unknown
  timeToDeliver: string;   // e.g. "24–48 hours", or pending when unknown
  buyersFoundThisWeek: number;
  whyHotNow: string;
  deliverablePreview: string[];
}

const PENDING_MESSAGE = 'pending fresh intel — retry';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Fetch real trends from the database
    const trends = await prisma.trend.findMany({
      where: { isMonetizable: true },
      orderBy: { detectedAt: 'desc' },
      skip: offset,
      take: 3,
      include: {
        tasks: {
          take: 1,
          select: {
            id: true,
            title: true,
            estimatedEarningsLow: true,
            estimatedEarningsHigh: true,
            timeToFirstDollar: true,
            category: true,
          },
        },
      },
    });

    // Live-only: empty DB means pending, never curated fakes.
    if (!trends || trends.length === 0) {
      return NextResponse.json({
        ok: true,
        status: 'pending',
        retry: true,
        message: PENDING_MESSAGE,
        opportunities: [],
      });
    }

    const mapped: VettedOpportunity[] = trends.map((t) => {
      const task = t.tasks?.[0];
      const low = task?.estimatedEarningsLow;
      const high = task?.estimatedEarningsHigh;
      const hasBudget = low != null && high != null;
      // No phantom budget floors: unknown budgets surface as pending, pipeline totals $0.
      const buyerPriceRange = hasBudget ? `$${low} – $${high}` : PENDING_MESSAGE;

      return {
        id: t.id,
        trendId: t.id,
        taskId: task?.id,
        title: task?.title || `${t.name} Power Move`,
        category: t.category,
        marketVector: t.whyItMatters || t.newsSummary || 'High-velocity commercial demand',
        buyerPriceRange,
        timeToDeliver: task?.timeToFirstDollar || PENDING_MESSAGE,
        buyersFoundThisWeek: 0,
        whyHotNow: t.whyItMatters || 'Surging search and freelance proposal demand detected this week.',
        deliverablePreview: [
          'Turnkey Deliverable Package',
          'Client Proposal & Audio Deck',
          'Target Prospect List',
        ],
      };
    });

    // No backfill with curated items: fewer than 3 live rows returns only live rows.
    return NextResponse.json({ ok: true, opportunities: mapped.slice(0, 3) });
  } catch (error: any) {
    console.error('Failed to fetch earn opportunities:', error);
    return NextResponse.json(
      { ok: true, status: 'pending', retry: true, message: PENDING_MESSAGE, opportunities: [] },
      { status: 200 }
    );
  }
}
