export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { Header } from '@/components/header';
import { GuidedEarnFlow } from './_components/guided-earn-flow';
import type { VettedOpportunity } from '@/app/api/earn/opportunities/route';
import type { GuidedLead } from '@/app/api/earn/leads/route';

export default async function EarnStartPage() {
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

  // Pre-seed opportunities
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

  const defaultLeads: GuidedLead[] = [
    {
      id: 'lead-1',
      name: 'Marcus Vance',
      organization: 'Apex Trade Solutions LLC',
      source: 'Google Business Registry & Yelp',
      matchScore: 98,
      detectedPainPoint: 'Losing an estimated 3-5 after-hours emergency calls weekly due to unanswered lines.',
      estimatedBudget: '$400 – $750',
      contactChannel: 'Email',
      draftSubject: 'Quick operational question regarding after-hours calls at Apex Trade Solutions',
      draftMessage: 'Hi Marcus,\n\nI noticed Apex Trade Solutions is actively taking emergency calls across the tri-county area. Often after-hours calls go to voicemail, which can cost $1,000+ in lost dispatch tickets weekly.\n\nI put together a turnkey AI Voice Receptionist system configured specifically for your service dispatch. It answers immediately 24/7, qualifies the emergency, and routes urgent calls directly to on-call technicians.\n\nWould you like me to send over the 60-second interactive demo link so you can test it on your phone?\n\nBest,\n[Your Name]',
    },
    {
      id: 'lead-2',
      name: 'Sarah Chen',
      organization: 'Vanguard Media Scaling',
      source: 'Upwork Project Catalog',
      matchScore: 95,
      detectedPainPoint: 'Seeking reliable video production pipelines for 4+ short-form assets per week.',
      estimatedBudget: '$300 – $600',
      contactChannel: 'Upwork',
      draftSubject: 'Proposal: Turnkey Faceless 9:16 Video Asset Workflow',
      draftMessage: 'Hi Sarah,\n\nSaw your project looking to scale 9:16 short-form video volume without bloated agency retainers.\n\nI have the complete production assets ready — custom Remotion script, synchronized voiceover tracks, and viral hook framework. No back-and-forth needed.\n\nCan send the preview render and source files today if you would like to inspect the quality.\n\nBest,\n[Your Name]',
    },
    {
      id: 'lead-3',
      name: 'David Reynolds',
      organization: 'Reynolds Mechanical & HVAC',
      source: 'Reddit r/smallbusiness discussion',
      matchScore: 93,
      detectedPainPoint: 'Struggling to find dependable dispatchers for weekend shifts.',
      estimatedBudget: '$450 – $800',
      contactChannel: 'Direct Form',
      draftSubject: 'Automated Weekend Dispatch System for Reynolds Mechanical',
      draftMessage: 'Hi David,\n\nCame across your comments regarding weekend dispatch coverage. We engineered an automated assistant that plugs into service dispatch without replacing your CRM.\n\nHappy to share the walkthrough brief and sample script with zero obligation.\n\nBest,\n[Your Name]',
    },
    {
      id: 'lead-4',
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
    {
      id: 'lead-5',
      name: 'Brian Kowalski',
      organization: 'Cascade Plumbing Pros',
      source: 'Permitted Public Trade Directory',
      matchScore: 89,
      detectedPainPoint: 'Missed customer estimates causing lead drop-off.',
      estimatedBudget: '$300 – $500',
      contactChannel: 'Email',
      draftSubject: 'Instant estimate capture system for Cascade Plumbing',
      draftMessage: 'Hi Brian,\n\nQuick note — we built an automated lead qualification sequence that captures emergency quote requests instantly over text/voice.\n\nHappy to share the implementation preview if you have 2 minutes.\n\nBest,\n[Your Name]',
    },
  ];

  return (
    <div className="min-h-screen bg-transparent text-white">
      <Header />
      <GuidedEarnFlow
        initialOpportunities={defaultCurated}
        initialLeads={defaultLeads}
        userEarnings={userEarnings}
      />
    </div>
  );
}