import { QualifiedBuyer } from './types';

export function calculateBuyerScore(criteria: {
  budgetLikelihood: number; // 0-25
  painPointMatch: number; // 0-25
  timingSignals: number; // 0-25
  accessibility: number; // 0-25
}): number {
  return criteria.budgetLikelihood + criteria.painPointMatch + criteria.timingSignals + criteria.accessibility;
}

export function huntQualifiedBuyers(niche: string): QualifiedBuyer[] {
  return [
    {
      id: 'buyer-mike-hvac',
      name: 'Mike Chen',
      organization: "Mike's HVAC & Mechanical Solutions",
      category: 'LOCAL_BUSINESS',
      location: 'Dallas, TX',
      score: calculateBuyerScore({
        budgetLikelihood: 24,
        painPointMatch: 25,
        timingSignals: 22,
        accessibility: 20,
      }), // 91
      signals: [
        "Google Review: 'Tried calling at 9:30 PM with broken furnace, nobody picked up'",
        'Website promises 24/7 emergency dispatch but phone connects to voicemail after 6 PM',
        '3.8 star average caused primarily by unreturned customer callback complaints',
        'Employs 14 service vans with estimated $2.8M annual revenue',
      ],
      contact: {
        decisionMaker: 'Mike Chen (Owner)',
        channel: 'Email',
        address: 'mike@mikeshvacdallas.com',
      },
      recommendedPrice: '$750 setup + $150/month',
      personalizedHook:
        'I noticed your Google reviews mention customers struggling to reach emergency dispatch after hours. I built a turnkey voice receptionist that captures every night call automatically.',
      closeProbability: 40,
    },
    {
      id: 'buyer-vance-plumbing',
      name: 'Marcus Vance',
      organization: 'Apex Trade Solutions LLC',
      category: 'LOCAL_BUSINESS',
      location: 'Phoenix, AZ',
      score: calculateBuyerScore({
        budgetLikelihood: 25,
        painPointMatch: 24,
        timingSignals: 24,
        accessibility: 23,
      }), // 96
      signals: [
        'Active Yelp commercial listing with unanswered quote inquiries',
        'Owner recently commented in local trade forum seeking dispatcher staffing',
        'High ticket commercial HVAC installations with high margins',
      ],
      contact: {
        decisionMaker: 'Marcus Vance (Principal)',
        channel: 'Email',
        address: 'mvance@apextradesolutions.com',
      },
      recommendedPrice: '$750 setup + $199/month',
      personalizedHook:
        'Saw you are expanding coverage across Maricopa County. We engineered an automated assistant that plugs into service dispatch so zero emergency leads slip through to competitors.',
      closeProbability: 45,
    },
    {
      id: 'buyer-solopreneur-podcast',
      name: 'Sarah Chen',
      organization: 'The $10M Solopreneur Podcast',
      category: 'CREATOR',
      location: 'Austin, TX',
      score: calculateBuyerScore({
        budgetLikelihood: 23,
        painPointMatch: 25,
        timingSignals: 24,
        accessibility: 22,
      }), // 94
      signals: [
        'Uploads 90-minute YouTube podcast weekly with 85K subscribers',
        'Has published fewer than 5 YouTube Shorts in the last 90 days',
        'High engagement on long-form but completely missing short-form algorithmic reach',
      ],
      contact: {
        decisionMaker: 'Sarah Chen (Host)',
        channel: 'LinkedIn',
        address: 'linkedin.com/in/sarahchen-podcast',
      },
      recommendedPrice: '$797/month retainer',
      personalizedHook:
        'Love the deep-dive episode with Jason on cashflow architectures. I clipped 3 high-retention viral moments with kinetic captions from the episode — here are the links with zero obligation.',
      closeProbability: 38,
    },
    {
      id: 'buyer-kinetic-digital',
      name: 'Elena Rostova',
      organization: 'Kinetics Digital Agency',
      category: 'COACH',
      location: 'Miami, FL',
      score: calculateBuyerScore({
        budgetLikelihood: 25,
        painPointMatch: 23,
        timingSignals: 22,
        accessibility: 22,
      }), // 92
      signals: [
        'Agency onboarding 8 new local service clients monthly',
        'Hiring freelance fulfillment specialists on LinkedIn',
        'Needs turnkey Google Business Profile citation packs to white-label',
      ],
      contact: {
        decisionMaker: 'Elena Rostova (Operations Director)',
        channel: 'LinkedIn',
        address: 'linkedin.com/in/elena-rostova-digital',
      },
      recommendedPrice: '$497 one-time per client pack',
      personalizedHook:
        'Saw Kinetics is scaling agency fulfillment for trade contractors. We have a white-label Google Business Profile AI audit and review response engine ready to brand as your own.',
      closeProbability: 42,
    },
    {
      id: 'buyer-solas-brand',
      name: 'David Reynolds',
      organization: 'Solas Wellness Co (DTC)',
      category: 'E_COMMERCE',
      location: 'San Diego, CA',
      score: calculateBuyerScore({
        budgetLikelihood: 24,
        painPointMatch: 22,
        timingSignals: 23,
        accessibility: 20,
      }), // 89
      signals: [
        'Running $12K/month Meta ads with static product photo creative',
        'Customer acquisition costs rising on TikTok according to ad library activity',
        'Competitor brands actively scaling direct-response UGC video ads',
      ],
      contact: {
        decisionMaker: 'David Reynolds (Head of Growth)',
        channel: 'Email',
        address: 'david@solaswellness.com',
      },
      recommendedPrice: '$997/month ad bundle',
      personalizedHook:
        'Noticed Solas is scaling paid social. We rendered 3 direct-response video hook concepts for your filtration bottle — happy to send the preview renders if you want to test them.',
      closeProbability: 35,
    },
  ];
}