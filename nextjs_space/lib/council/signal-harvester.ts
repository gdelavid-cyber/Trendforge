import { prisma } from '@/lib/core/db';
import { CouncilSignal } from './council-runner';

export interface CommercialMoneySignal extends CouncilSignal {
  targetBuyer: string;
  dealSizeRange: string;
  expectedMarginPercent: number;
  deliveryTimeHours: number;
  monetizationConfidence: number;
  commercialUrgency: string;
  /** 'pending' when the pool is exhausted — never render as a SUCCESS. */
  status?: 'ready' | 'pending';
  pendingReason?: string;
}

/** Pending sentinel returned when every archetype was debated recently. */
export function pendingCouncilSignal(reason: string): CommercialMoneySignal {
  return {
    title: 'PENDING — council pool exhausted',
    source: 'signal-harvester',
    rawInsight: reason,
    estimatedMargin: '0%',
    estimatedVelocity: 'pending fresh intel',
    targetBuyer: 'pending fresh intel',
    dealSizeRange: 'pending fresh intel',
    expectedMarginPercent: 0,
    deliveryTimeHours: 0,
    monetizationConfidence: 0,
    commercialUrgency: 'pending fresh intel — retry',
    status: 'pending',
    pendingReason: reason,
  };
}

// 12 High-Margin Commercial B2B Arbitrage Archetypes ($450–$3,500 deals, 75%+ margins)
export const HIGH_PROFIT_OPPORTUNITY_MATRIX: CommercialMoneySignal[] = [
  {
    title: 'Autonomous B2B Emergency Voice Dispatch for Contractors',
    source: 'Reddit r/smallbusiness + Commercial Google Trends',
    rawInsight: 'Service contractors miss 40% of night calls; hiring an overnight dispatcher costs $3,000/mo. Cash offer: $450 setup + $150/mo retainer.',
    estimatedMargin: '82.5%',
    estimatedVelocity: '24-48 hours',
    targetBuyer: 'Plumbing, HVAC & Roofing Contractors ($1M-$5M ARR)',
    dealSizeRange: '$450 setup + $150/mo retainer',
    expectedMarginPercent: 82.5,
    deliveryTimeHours: 24,
    monetizationConfidence: 0.94,
    commercialUrgency: 'Immediate: Contractors lose $1,200 on every missed emergency call.',
  },
  {
    title: 'Instant Landing Pages with Stripe Checkout for Fractional Executives',
    source: 'ProductHunt & Twitter High-Ticket Consultancies',
    rawInsight: 'High-earning fractional CMOs and CFOs lose deals without sleek booking and payment portals. Instant 24h delivery.',
    estimatedMargin: '88%',
    estimatedVelocity: '24 hours',
    targetBuyer: 'Fractional CMOs, CFOs & High-Ticket Advisors',
    dealSizeRange: '$650 one-time flat fee',
    expectedMarginPercent: 88,
    deliveryTimeHours: 24,
    monetizationConfidence: 0.92,
    commercialUrgency: 'High: Executives need professional checkout to close $5k/mo advisory retainers.',
  },
  {
    title: 'Faceless Short-Form Video Content Packages for Aesthetic Med-Spas',
    source: 'TikTok Viral Business & Local Yelp Ads',
    rawInsight: 'Med-spas pay $2,000/mo to legacy agencies. Automated Remotion pipeline delivers 15 reels for $500 with zero filming.',
    estimatedMargin: '91%',
    estimatedVelocity: '48 hours',
    targetBuyer: 'Local Medical Spas, Laser Clinics & Cosmetic Injectors',
    dealSizeRange: '$500/month recurring retainer',
    expectedMarginPercent: 91,
    deliveryTimeHours: 48,
    monetizationConfidence: 0.91,
    commercialUrgency: 'High: Doctors want social traffic but refuse to appear on camera.',
  },
  {
    title: 'Automated RFP & Government Bid Dossier Preparation for SMBs',
    source: 'GovTribe & Local Chamber of Commerce Tender Feeds',
    rawInsight: 'Subcontractors miss multi-million municipal bids due to 100-page compliance paperwork. AI compiles compliant bid draft in 4 hours.',
    estimatedMargin: '85%',
    estimatedVelocity: '48 hours',
    targetBuyer: 'Commercial Subcontractors, Janitorial & Security Firms',
    dealSizeRange: '$1,200 per bid proposal',
    expectedMarginPercent: 85,
    deliveryTimeHours: 48,
    monetizationConfidence: 0.89,
    commercialUrgency: 'Critical: Hard statutory bid submission deadlines.',
  },
  {
    title: 'E-Commerce Dispute & Chargeback Evidence Automation for Shopify Brands',
    source: 'Reddit r/ecommerce & Stripe Developer Forums',
    rawInsight: 'Brands doing $50k/mo lose 2.5% to fraudulent chargebacks. Auto-generating courier delivery receipts & IP evidence recovers 65% of claims.',
    estimatedMargin: '89%',
    estimatedVelocity: '24-48 hours',
    targetBuyer: 'Shopify Plus & Direct-to-Consumer Brands ($500k-$5M GMV)',
    dealSizeRange: '$350 setup + 15% recovered revenue bonus',
    expectedMarginPercent: 89,
    deliveryTimeHours: 24,
    monetizationConfidence: 0.95,
    commercialUrgency: 'Immediate: Stripe warning thresholds kick in at 1% dispute rate.',
  },
  {
    title: 'Automated Patient Reactivation SMS Pipeline for Dental Clinics',
    source: 'Dental Economics Journal & Local Maps Scrapes',
    rawInsight: 'Dental clinics have 2,000+ inactive patients due for cleaning. Conversational SMS reactivation books 15 appointments in week one.',
    estimatedMargin: '87%',
    estimatedVelocity: '48 hours',
    targetBuyer: 'Private Dental Practices & Orthodontists',
    dealSizeRange: '$500 setup + $35 per completed cleaning appointment',
    expectedMarginPercent: 87,
    deliveryTimeHours: 48,
    monetizationConfidence: 0.93,
    commercialUrgency: 'High: Each reactivated patient is worth $800+ in annual dental care.',
  },
  {
    title: 'Multi-Location Google Review Dispute & Reputation Defender',
    source: 'Reddit r/sweatystartup & Yelp Local Complaints',
    rawInsight: 'Unfair 1-star competitor reviews destroy local foot traffic. Automated TOS policy evidence package gets invalid reviews removed within 14 days.',
    estimatedMargin: '84%',
    estimatedVelocity: '24 hours',
    targetBuyer: 'Franchise Auto Repair, High-End Restaurants & Gyms',
    dealSizeRange: '$400 setup + $120/mo monitoring retainer',
    expectedMarginPercent: 84,
    deliveryTimeHours: 24,
    monetizationConfidence: 0.90,
    commercialUrgency: 'High: A single 1-star drop reduces local inbound calls by 22%.',
  },
  {
    title: 'Security & Compliance Posture Audit Generator for Commercial Insurance',
    source: 'Cyber Risk Insurance Underwriting Guidelines',
    rawInsight: 'SMBs get denied cyber insurance policies for basic checklist oversights. Automated DNS, MFA & backup report gets them approved in 24 hours.',
    estimatedMargin: '86%',
    estimatedVelocity: '48 hours',
    targetBuyer: 'Commercial Insurance Brokers & Accounting Firms',
    dealSizeRange: '$750 per security verification audit',
    expectedMarginPercent: 86,
    deliveryTimeHours: 48,
    monetizationConfidence: 0.91,
    commercialUrgency: 'Urgent: Insurance renewals require verified audit before policy issuance.',
  },
  {
    title: 'Automated Quote Follow-Up & Estimate Chaser for Remodelers',
    source: 'Reddit r/smallbusiness & Contractor CRM Exports',
    rawInsight: 'Remodeling contractors send $20k quotes and never follow up; 60% of jobs go to whoever chases first. Automated SMS and email chase sequence for every open estimate.',
    estimatedMargin: '83%',
    estimatedVelocity: '24-48 hours',
    targetBuyer: 'Residential Remodelers & General Contractors ($1M-$8M ARR)',
    dealSizeRange: '$550 setup + $99/mo retainer',
    expectedMarginPercent: 83,
    deliveryTimeHours: 36,
    monetizationConfidence: 0.9,
    commercialUrgency: 'High: Every unchased $20k quote is a lost month of crew payroll.',
  },
  {
    title: 'Job-Site Progress Photo Reports for General Contractors',
    source: 'Houzz Pro Forums & Local Builder Associations',
    rawInsight: 'GC clients call daily asking what happened on site. Automated photo report portal turns foreman phone pics into a branded weekly client update.',
    estimatedMargin: '81%',
    estimatedVelocity: '48 hours',
    targetBuyer: 'General Contractors & Custom Home Builders',
    dealSizeRange: '$600 per project flat fee',
    expectedMarginPercent: 81,
    deliveryTimeHours: 48,
    monetizationConfidence: 0.88,
    commercialUrgency: 'High: Client update calls eat 5+ foreman hours per week.',
  },
  {
    title: 'No-Show Recovery & Waitlist Backfill for Clinics and Med-Spas',
    source: 'Aesthetic Practice Journals & Clinic Booking Exports',
    rawInsight: 'Clinics lose 15% of appointments to no-shows. Automated waitlist backfill texts refill cancelled slots within the hour, saving front-desk labor.',
    estimatedMargin: '88%',
    estimatedVelocity: '24-48 hours',
    targetBuyer: 'Private Clinics, Med-Spas & Dental Practices',
    dealSizeRange: '$400 setup + $25 per recovered booking',
    expectedMarginPercent: 88,
    deliveryTimeHours: 36,
    monetizationConfidence: 0.92,
    commercialUrgency: 'High: Each empty chair costs the clinic $300+ in lost billings.',
  },
  {
    title: 'Vendor Invoice & Receipt Reconciliation for Bookkeeping Firms',
    source: 'QuickBooks ProAdvisor Forums & SMB Bookkeeper Slack',
    rawInsight: 'Bookkeeping firms drown in client shoeboxes of receipts each month-end. Automated invoice matching and categorization clears month-end in hours.',
    estimatedMargin: '85%',
    estimatedVelocity: '48 hours',
    targetBuyer: 'Boutique Bookkeeping & Accounting Firms serving SMBs',
    dealSizeRange: '$500/month recurring per client',
    expectedMarginPercent: 85,
    deliveryTimeHours: 48,
    monetizationConfidence: 0.9,
    commercialUrgency: 'High: Month-end close backlog blocks firms from onboarding new retainer clients.',
  },
];

/**
 * Filter ensuring only deals that meet strict commercial viability are allowed into Council debate.
 */
export function validateHighProfitabilityCriteria(signal: Partial<CommercialMoneySignal>): {
  valid: boolean;
  rejectionReason?: string;
} {
  const margin = parseFloat(String(signal.estimatedMargin || '0').replace('%', ''));
  const title = (signal.title || '').toLowerCase();
  const raw = (signal.rawInsight || '').toLowerCase();

  // 1. Minimum Margin Floor (Must be >= 70%)
  if (!isNaN(margin) && margin > 0 && margin < 70) {
    return { valid: false, rejectionReason: `Margin too low (${margin}% < 70% floor). Fails unit economics test.` };
  }

  // 2. Reject Consumer Fluff, Memes, and Unregulated Speculation
  const bannedKeywords = ['meme', 'crypto token', 'nft mint', 'dropshipping t-shirt', 'dating app', 'unregulated'];
  for (const word of bannedKeywords) {
    if (title.includes(word) || raw.includes(word)) {
      return { valid: false, rejectionReason: `Banned speculative vector: contains "${word}". Zero verified B2B cashflow.` };
    }
  }

  // 3. Must have clear B2B commercial target
  const commercialSignals = ['contractor', 'smb', 'b2b', 'clinic', 'retainer', 'client', 'agency', 'executive', 'business', 'brand', 'firm'];
  const hasCommercialFocus = commercialSignals.some((s) => title.includes(s) || raw.includes(s));
  if (!hasCommercialFocus) {
    return { valid: false, rejectionReason: 'Lacks identifiable B2B commercial buyer or recurring retainer structure.' };
  }

  return { valid: true };
}

/**
 * Dynamically harvests the next high-profitability commercial signal for AI Council debate.
 * Checks live database trends first, rotates through high-profit matrix, and filters out duplicates.
 */
export async function harvestNextCouncilSignal(preferredTopic?: string): Promise<CommercialMoneySignal> {
  try {
    // 1. Check recent council sessions to avoid debating the same topic consecutively
    const recentSessions = await prisma.councilSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { signal: true },
    });

    const recentTitles = new Set(
      recentSessions
        .map((s: any) => (s.signal?.title || '').toLowerCase().trim())
        .filter(Boolean)
    );

    // 2. Query high-scoring active trends in the database
    const highYieldDbTrends = await prisma.trend.findMany({
      where: {
        isMonetizable: true,
        monetizationScore: { gte: 0.85 },
        status: 'ACTIVE',
      },
      orderBy: { mentionVelocity: 'desc' },
      take: 8,
    });

    for (const trend of highYieldDbTrends) {
      const cleanTitle = trend.name.replace(/^(Commercial Alpha:|Hot Play:)/i, '').trim();
      if (!recentTitles.has(cleanTitle.toLowerCase())) {
        const candidateSignal: CommercialMoneySignal = {
          title: cleanTitle,
          source: trend.sourcePlatforms?.join(' + ') || 'Live Scraped Market Intelligence',
          rawInsight: trend.newsSummary || trend.whyItMatters || 'Scraped high-velocity market opportunity with confirmed buyer urgency.',
          estimatedMargin: '85%',
          estimatedVelocity: '24-48 hours',
          targetBuyer: 'Local & Regional Commercial Enterprises ($1M-$10M ARR)',
          dealSizeRange: '$450–$2,000 target cash deal',
          expectedMarginPercent: 85,
          deliveryTimeHours: 48,
          monetizationConfidence: trend.monetizationScore || 0.9,
          commercialUrgency: 'Active trend spike detected across search and community telemetry.',
          status: 'ready',
        };

        const check = validateHighProfitabilityCriteria(candidateSignal);
        if (check.valid) {
          return candidateSignal;
        }
      }
    }

    // 3. If no fresh DB trend found, rotate from the vetted high-profit opportunity matrix.
    // Deterministic order (no random pick): first not-recently-debated entry wins.
    const availablePool = HIGH_PROFIT_OPPORTUNITY_MATRIX.filter(
      (item) => !recentTitles.has(item.title.toLowerCase().trim())
    );

    if (availablePool.length > 0) {
      return { ...availablePool[0], status: 'ready' };
    }

    // Every archetype was debated within the last 30 sessions: report pending,
    // never a recycled SUCCESS.
    return pendingCouncilSignal(
      'All 12 vetted archetypes were debated in the last 30 sessions — pending fresh intel.'
    );
  } catch (err) {
    console.error('[SignalHarvester] Fallback to primary matrix:', err);
    // DB unreachable so recency is unknown: deterministic head of matrix, no random.
    return { ...HIGH_PROFIT_OPPORTUNITY_MATRIX[0], status: 'ready' };
  }
}
