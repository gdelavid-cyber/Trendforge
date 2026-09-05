export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { Header } from '@/components/header';
import { QuickWinsFlow } from './_components/quick-wins-flow';
import type { VettedOpportunity } from '@/app/api/earn/opportunities/route';
import type { GuidedLead } from '@/app/api/earn/leads/route';

export default async function QuickWinsPage() {
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

  const defaultOpportunities: VettedOpportunity[] = [
    {
      id: 'opp-quick-hvac',
      trendId: 'trend-ai-voice-hvac',
      title: 'AI Voice Receptionist for HVAC & Field Contractors',
      category: 'LOCAL_SERVICES',
      marketVector: 'After-hours contractor emergency call capture',
      buyerPriceRange: '$500 – $1,500',
      timeToDeliver: '24–48 hours',
      buyersFoundThisWeek: 18,
      whyHotNow: 'Emergency HVAC contractors lose ~$1,200/wk on missed night calls.',
      deliverablePreview: ['Vapi/Retell Voice Bot Script', 'Emergency Dispatch Protocol', 'Contractor Cold Pitch Deck'],
    },
    {
      id: 'opp-quick-gbp',
      trendId: 'trend-gbp-ai-audit',
      title: 'Google Business Profile AI Citation & Review Pack',
      category: 'AI_TOOLS',
      marketVector: 'Local SEO citation and reputation boosting',
      buyerPriceRange: '$250 – $600',
      timeToDeliver: '24 hours',
      buyersFoundThisWeek: 15,
      whyHotNow: 'Local brick-and-mortar stores urgently upgrading AI review management.',
      deliverablePreview: ['Audit Scorecard PDF', 'Automated Review Response Prompts', 'Local Geo-Citation Blueprint'],
    },
    {
      id: 'opp-quick-shorts',
      trendId: 'trend-faceless-shorts',
      title: 'Faceless Video Sample Pack for DTC Brands',
      category: 'AI_CONTENT',
      marketVector: 'TikTok & Shorts organic algorithm arbitrage',
      buyerPriceRange: '$297 – $497',
      timeToDeliver: '12–24 hours',
      buyersFoundThisWeek: 24,
      whyHotNow: 'Brands paying high retainers for short-form video volume.',
      deliverablePreview: ['Remotion TSX Video Project', 'ElevenLabs Audio Track', 'High-Hook Viral Script'],
    },
  ];

  const defaultLeads: GuidedLead[] = [
    {
      id: 'lead-1',
      name: 'Marcus Vance',
      organization: 'Apex Trade Solutions LLC',
      source: 'Google Business Registry & Yelp',
      matchScore: 98,
      detectedPainPoint: 'Losing an estimated 3-5 after-hours emergency calls weekly due to unanswered lines.',
      estimatedBudget: '$500 – $1,500',
      contactChannel: 'Email',
      draftSubject: 'Quick operational question regarding after-hours calls at Apex Trade Solutions',
      draftMessage: 'Hi Marcus,\n\nI noticed Apex Trade Solutions is actively taking emergency calls across the tri-county area. Often after-hours calls go to voicemail, which can cost $1,000+ in lost dispatch tickets weekly.\n\nI put together a turnkey AI Voice Receptionist system configured specifically for your service dispatch. It answers immediately 24/7, qualifies the emergency, and routes urgent calls directly to on-call technicians.\n\nWould you like me to send over the 60-second interactive demo link so you can test it on your phone?\n\nBest,\n[Your Name]',
    },
    {
      id: 'lead-2',
      name: 'David Reynolds',
      organization: 'Reynolds Mechanical & HVAC',
      source: 'Reddit r/smallbusiness discussion',
      matchScore: 94,
      detectedPainPoint: 'Struggling to find dependable dispatchers for weekend shifts.',
      estimatedBudget: '$450 – $800',
      contactChannel: 'Direct Form',
      draftSubject: 'Automated Weekend Dispatch System for Reynolds Mechanical',
      draftMessage: 'Hi David,\n\nCame across your comments regarding weekend dispatch coverage. We engineered an automated assistant that plugs into service dispatch without replacing your CRM.\n\nHappy to share the walkthrough brief and sample script with zero obligation.\n\nBest,\n[Your Name]',
    },
    {
      id: 'lead-3',
      name: 'Elena Rostova',
      organization: 'Kinetics Digital Agency',
      source: 'LinkedIn B2B Signal',
      matchScore: 91,
      detectedPainPoint: 'Expanding local business client roster and needs turnkey SEO/GBP fulfillment packages.',
      estimatedBudget: '$350 – $650',
      contactChannel: 'LinkedIn',
      draftSubject: 'White-label GBP Optimization Pack for Kinetics Digital clients',
      draftMessage: 'Hi Elena,\n\nSaw your agency is expanding local business service packages. We compiled a complete Google Business Profile AI audit and review response engine ready to white-label for your clients.\n\nWould a 2-minute overview deck be useful for your team?\n\nBest,\n[Your Name]',
    },
  ];

  return (
    <div className="min-h-screen bg-[#06060E] text-white">
      <Header />
      <QuickWinsFlow
        initialOpportunities={defaultOpportunities}
        initialLeads={defaultLeads}
        userEarnings={userEarnings}
      />
    </div>
  );
}