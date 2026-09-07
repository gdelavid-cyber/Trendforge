import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';

export const dynamic = 'force-dynamic';

export interface GuidedLead {
  id: string;
  name: string;
  organization: string;
  source: string;
  matchScore: number;
  detectedPainPoint: string;
  estimatedBudget: string;
  contactChannel: 'Email' | 'Upwork' | 'LinkedIn' | 'Direct Form';
  draftSubject: string;
  draftMessage: string;
}

const PENDING_MESSAGE = 'pending fresh intel — retry';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;
    const title = searchParams.get('title') || undefined;
    void category;
    void title;

    // Live-only: surface persisted leads with verifiable source URLs.
    let stored: Array<{
      id: string;
      buyerName: string | null;
      source: string;
      sourceUrl: string;
      requestText: string;
      statedBudgetCents: number | null;
      compositeScore: number;
    }> = [];
    try {
      stored = await prisma.lead.findMany({
        orderBy: { compositeScore: 'desc' },
        take: 5,
        select: {
          id: true,
          buyerName: true,
          source: true,
          sourceUrl: true,
          requestText: true,
          statedBudgetCents: true,
          compositeScore: true,
        },
      });
    } catch {
      stored = [];
    }

    const live = stored.filter(
      (l): l is typeof l & { buyerName: string } => !!l.sourceUrl && l.sourceUrl.startsWith('http') && !!l.buyerName
    );

    if (live.length === 0) {
      return NextResponse.json({
        ok: true,
        status: 'pending',
        retry: true,
        message: PENDING_MESSAGE,
        leads: [],
      });
    }

    const leads: GuidedLead[] = live.map((l) => ({
      id: l.id,
      name: l.buyerName,
      organization: l.source,
      source: l.sourceUrl,
      matchScore: l.compositeScore,
      detectedPainPoint: l.requestText,
      estimatedBudget: l.statedBudgetCents != null ? `$${(l.statedBudgetCents / 100).toFixed(0)}` : PENDING_MESSAGE,
      contactChannel: 'Direct Form',
      draftSubject: `Saw your post — quick question`,
      draftMessage: `Hi,\n\nSaw your post (${l.sourceUrl}). Verify the details at the source link before outreach.\n\nBest,\n[Your Name]`,
    }));

    return NextResponse.json({ ok: true, leads });
  } catch (error: any) {
    console.error('Failed to fetch guided leads:', error);
    return NextResponse.json(
      { ok: true, status: 'pending', retry: true, message: PENDING_MESSAGE, leads: [] },
      { status: 200 }
    );
  }
}
