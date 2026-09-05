import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { opportunityTitle, category, customPrice, customAngle } = body;

    const priceRange = customPrice || '$450.00';
    const angle = customAngle || 'Direct problem-led proposal with zero operational friction.';

    const plan = {
      whatIsBeingSold: `Complete turnkey execution package for "${opportunityTitle || 'High-Alpha Deliverable'}". Ready to deploy directly into the client's operations within 24–48 hours.`,
      targetBuyer: category === 'LOCAL_SERVICES'
        ? 'Independent HVAC, plumbing, and electrical trade business owners with 5–25 field technicians.'
        : category === 'AI_CONTENT'
        ? 'Digital marketing agencies, high-volume TikTok/YouTube creators, and DTC brand managers.'
        : 'Small-to-medium business founders and operators with active hiring or tool requests.',
      recommendedPrice: priceRange,
      deliverables: [
        {
          name: 'Executive Technical Brief & Setup SOP',
          format: 'Structured Documentation (.md / .pdf)',
          purpose: 'Outlines the turnkey architecture and client handover steps.',
        },
        {
          name: 'Core Production Deliverable (Code/Audio/Prompt)',
          format: 'Master Asset File',
          purpose: 'The finished, production-ready product solving the client\'s bottleneck.',
        },
        {
          name: 'High-Converting Proposal & Outreach Script',
          format: 'Pitch Deck & Personalized Email/DM',
          purpose: 'Custom tailored script highlighting verifiable ROI and rapid time-to-value.',
        },
      ],
      salesApproach: angle,
      timeframe: 'Estimated 24 to 48 hours from dispatch to first buyer presentation.',
      humanInTheLoopRule: 'All outbound communications remain in draft status until you inspect and approve each message.',
    };

    return NextResponse.json({ ok: true, plan });
  } catch (error: any) {
    console.error('Failed to generate plan:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}