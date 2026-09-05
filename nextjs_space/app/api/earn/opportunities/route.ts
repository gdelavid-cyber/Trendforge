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
  buyerPriceRange: string; // e.g. "$250 – $650"
  timeToDeliver: string;   // e.g. "24–48 hours"
  buyersFoundThisWeek: number;
  whyHotNow: string;
  deliverablePreview: string[];
}

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

    const defaultCurated: VettedOpportunity[] = [
      {
        id: 'opp-1',
        trendId: 'trend-ai-voice-hvac',
        title: 'Emergency HVAC AI Voice Receptionist',
        category: 'LOCAL_SERVICES',
        marketVector: 'After-hours contractor call capture',
        buyerPriceRange: '$350 – $750',
        timeToDeliver: '24–48 hours',
        buyersFoundThisWeek: 18,
        whyHotNow: 'Emergency HVAC contractors lose ~$1,200/mo on missed night calls.',
        deliverablePreview: ['Vapi/Retell Voice Bot Script', 'Emergency Dispatch Protocol', 'Contractor Cold Pitch Deck'],
      },
      {
        id: 'opp-2',
        trendId: 'trend-faceless-shorts',
        title: '9:16 Faceless Video Content Engine',
        category: 'AI_CONTENT',
        marketVector: 'TikTok & Shorts organic algorithm arbitrage',
        buyerPriceRange: '$200 – $500',
        timeToDeliver: '12–24 hours',
        buyersFoundThisWeek: 24,
        whyHotNow: 'Brands paying high retainers for short-form video volume.',
        deliverablePreview: ['Remotion TSX Video Project', 'ElevenLabs Audio Track', 'High-Hook Viral Script'],
      },
      {
        id: 'opp-3',
        trendId: 'trend-gbp-ai-audit',
        title: 'Google Business Profile AI Domination Pack',
        category: 'AI_TOOLS',
        marketVector: 'Local SEO citation and reputation boosting',
        buyerPriceRange: '$300 – $600',
        timeToDeliver: '24 hours',
        buyersFoundThisWeek: 15,
        whyHotNow: 'Local brick-and-mortar stores urgently upgrading AI review management.',
        deliverablePreview: ['Audit Scorecard PDF', 'Automated Review Response Prompts', 'Local Geo-Citation Blueprint'],
      },
    ];

    if (!trends || trends.length === 0) {
      return NextResponse.json({ ok: true, opportunities: defaultCurated });
    }

    const mapped: VettedOpportunity[] = trends.map((t, idx) => {
      const task = t.tasks?.[0];
      const low = task?.estimatedEarningsLow || 250;
      const high = task?.estimatedEarningsHigh || 650;
      const buyersCount = Math.floor(12 + ((t.mentionVelocity || 15) % 15));

      return {
        id: t.id,
        trendId: t.id,
        taskId: task?.id,
        title: task?.title || `${t.name} Power Move`,
        category: t.category,
        marketVector: t.whyItMatters || t.newsSummary || 'High-velocity commercial demand',
        buyerPriceRange: `$${low} – $${high}`,
        timeToDeliver: task?.timeToFirstDollar || '24–48 hours',
        buyersFoundThisWeek: buyersCount,
        whyHotNow: t.whyItMatters || 'Surging search and freelance proposal demand detected this week.',
        deliverablePreview: [
          'Turnkey Deliverable Package',
          'Client Proposal & Audio Deck',
          'Target Prospect List',
        ],
      };
    });

    // If fewer than 3, fill with default curated items
    while (mapped.length < 3) {
      mapped.push(defaultCurated[mapped.length]);
    }

    return NextResponse.json({ ok: true, opportunities: mapped.slice(0, 3) });
  } catch (error: any) {
    console.error('Failed to fetch earn opportunities:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}