export type TemplateType =
  | 'FACELESS_VIDEO'
  | 'ECOMMERCE_LISTING'
  | 'LANDING_PAGE'
  | 'LOGO_PACK'
  | 'RESUME_REWRITE'
  | 'SOCIAL_MEDIA_KIT'
  | 'SIMPLE_VIDEO_EDIT';

export type PricingTier = 'BUDGET' | 'STANDARD' | 'PREMIUM';

export interface SwarmTemplateSpec {
  id: string;
  type: TemplateType;
  name: string;
  category: string;
  isEvergreen: boolean;
  pricingTiers: Record<PricingTier, { min: number; target: number; max: number }>;
  estimatedCost: { min: number; target: number; max: number };
  spec: Record<string, any>;
  validationCriteria: {
    name: string;
    description: string;
    critical: boolean;
  }[];
  buildInstructions: string;
  masterySignals: {
    minConversionRate: number;
    maxRefundRate: number;
  };
}

export const SWARM_TEMPLATES: Record<string, SwarmTemplateSpec> = {
  FACELESS_VIDEO: {
    id: 'FACELESS_VIDEO',
    type: 'FACELESS_VIDEO',
    name: 'Faceless Social Video Pack',
    category: 'AI_CONTENT',
    isEvergreen: false,
    pricingTiers: {
      BUDGET: { min: 25, target: 40, max: 50 },
      STANDARD: { min: 75, target: 100, max: 120 },
      PREMIUM: { min: 150, target: 249, max: 300 },
    },
    estimatedCost: { min: 5, target: 15, max: 25 },
    spec: {
      deliverableType: '30-90s faceless social ad video + 2 thumbnail variants + ad copy',
      resolution: '1080x1920 (9:16 Vertical)',
      targetPlatforms: ['TikTok', 'Instagram Reels', 'YouTube Shorts', 'Meta Ads'],
      components: ['videoScript', 'audioVoiceover', 'dynamicSubtitles', 'thumbnailConcepts', 'adCopyVariants'],
    },
    validationCriteria: [
      { name: 'Resolution & Format', description: 'Must be vertical 9:16 format with high quality visual rendering', critical: true },
      { name: 'Duration Check', description: 'Duration must be between 30s and 90s', critical: true },
      { name: 'Audio Clarity', description: 'Voiceover pacing and background audio balance', critical: true },
      { name: 'No Hallucinated Text', description: 'All onscreen text matches script and brand standards', critical: true },
      { name: 'Brand Safe Content', description: 'Zero prohibited claims or trademark violations', critical: true },
    ],
    buildInstructions: `Generate an engaging 30-90 second direct response script with visual cues, high-contrast typography, hook-first structure, 2 thumbnail visual concepts, and 3 ad copy variations (short, medium, long).`,
    masterySignals: {
      minConversionRate: 0.03,
      maxRefundRate: 0.05,
    },
  },
  ECOMMERCE_LISTING: {
    id: 'ECOMMERCE_LISTING',
    type: 'ECOMMERCE_LISTING',
    name: 'E-Commerce Listing + Image Pack',
    category: 'ECOMMERCE',
    isEvergreen: false,
    pricingTiers: {
      BUDGET: { min: 30, target: 45, max: 60 },
      STANDARD: { min: 80, target: 110, max: 150 },
      PREMIUM: { min: 180, target: 240, max: 350 },
    },
    estimatedCost: { min: 4, target: 10, max: 18 },
    spec: {
      deliverableType: '5 product hero concepts + SEO title + 5 bullet points + full description + alt text',
      imageCount: 5,
      minResolution: '1000x1000',
      seoOptimized: true,
    },
    validationCriteria: [
      { name: 'Image Count & Spec', description: '5 distinct image concepts/prompts formatted for marketplace upload', critical: true },
      { name: 'SEO Title Length', description: 'SEO title must be under 80 characters with target keywords', critical: true },
      { name: 'Description Depth', description: 'Description must be >= 100 words with benefit-led copywriting', critical: true },
      { name: 'Compliance & Claims', description: 'No prohibited health or financial claims', critical: true },
    ],
    buildInstructions: `Perform product niche research, create high-converting title, 5 image generation prompts/specs, 5 core benefit bullet points, detailed product description, and accessibility alt text.`,
    masterySignals: {
      minConversionRate: 0.025,
      maxRefundRate: 0.03,
    },
  },
  LANDING_PAGE: {
    id: 'LANDING_PAGE',
    type: 'LANDING_PAGE',
    name: 'Landing Page + Ad Copy Quickstart',
    category: 'AI_TOOLS',
    isEvergreen: false,
    pricingTiers: {
      BUDGET: { min: 50, target: 75, max: 100 },
      STANDARD: { min: 120, target: 180, max: 250 },
      PREMIUM: { min: 300, target: 399, max: 500 },
    },
    estimatedCost: { min: 8, target: 20, max: 35 },
    spec: {
      deliverableType: 'One-page HTML landing page + hero copy + CTA + short ad copy',
      responsive: true,
      loadSpeedTarget: '< 3s',
      copyIncluded: true,
    },
    validationCriteria: [
      { name: 'HTML Structure & Validation', description: 'Valid HTML5 semantic structure with responsive CSS classes', critical: true },
      { name: 'Clear Call to Action', description: 'Prominent, high-converting CTA above and below fold', critical: true },
      { name: 'Mobile Responsive', description: 'Layout gracefully adjusts to mobile viewport', critical: true },
      { name: 'Ad Copy Integration', description: 'Includes 3 matched ad copy variants for immediate traffic driving', critical: true },
    ],
    buildInstructions: `Construct a modern, responsive one-page direct response landing page HTML code with hero section, feature breakdown, social proof blocks, dynamic CTA, and bundled ad copy.`,
    masterySignals: {
      minConversionRate: 0.04,
      maxRefundRate: 0.05,
    },
  },
  // Evergreen Fallback Templates (Used when trends dry up or in survival mode)
  LOGO_PACK: {
    id: 'LOGO_PACK',
    type: 'LOGO_PACK',
    name: 'Logo Pack (Evergreen)',
    category: 'DESIGN',
    isEvergreen: true,
    pricingTiers: {
      BUDGET: { min: 30, target: 40, max: 50 },
      STANDARD: { min: 60, target: 75, max: 90 },
      PREMIUM: { min: 100, target: 125, max: 150 },
    },
    estimatedCost: { min: 3, target: 8, max: 15 },
    spec: {
      deliverableType: '3 distinct logo concepts + color palette + vector guidelines',
      conceptsCount: 3,
    },
    validationCriteria: [
      { name: 'Concept Variety', description: '3 distinct artistic styles provided', critical: true },
      { name: 'Color Palette Included', description: 'Hex codes and contrast ratios included', critical: true },
    ],
    buildInstructions: `Generate 3 modern logo concepts (Monogram, Abstract, Wordmark) with brand colors, typography pairings, and usage guides.`,
    masterySignals: { minConversionRate: 0.05, maxRefundRate: 0.02 },
  },
  RESUME_REWRITE: {
    id: 'RESUME_REWRITE',
    type: 'RESUME_REWRITE',
    name: 'ATS Resume Rewrite & Cover Letter (Evergreen)',
    category: 'CAREER',
    isEvergreen: true,
    pricingTiers: {
      BUDGET: { min: 25, target: 35, max: 40 },
      STANDARD: { min: 50, target: 60, max: 70 },
      PREMIUM: { min: 80, target: 100, max: 120 },
    },
    estimatedCost: { min: 2, target: 5, max: 10 },
    spec: {
      deliverableType: 'ATS-optimized resume markdown + tailored cover letter + keyword score',
    },
    validationCriteria: [
      { name: 'ATS Keyword Match', description: 'Keyword density matches target job role', critical: true },
      { name: 'Action Verbs', description: 'Quantifiable bullet point achievements', critical: true },
    ],
    buildInstructions: `Produce an executive-grade, ATS-scannable resume with punchy quantified bullet points and tailored cover letter.`,
    masterySignals: { minConversionRate: 0.06, maxRefundRate: 0.02 },
  },
  SOCIAL_MEDIA_KIT: {
    id: 'SOCIAL_MEDIA_KIT',
    type: 'SOCIAL_MEDIA_KIT',
    name: 'Social Media 30-Day Content Kit (Evergreen)',
    category: 'MARKETING',
    isEvergreen: true,
    pricingTiers: {
      BUDGET: { min: 40, target: 50, max: 60 },
      STANDARD: { min: 80, target: 100, max: 120 },
      PREMIUM: { min: 150, target: 175, max: 200 },
    },
    estimatedCost: { min: 4, target: 10, max: 18 },
    spec: {
      deliverableType: '30 days of post prompts, captions, hashtag strategies, and visual specs',
    },
    validationCriteria: [
      { name: 'Full 30 Days Count', description: '30 distinct post prompts with scheduled dates', critical: true },
      { name: 'Hashtag Clusters', description: 'Targeted niche hashtags included per post', critical: true },
    ],
    buildInstructions: `Develop a comprehensive 30-day organic social calendar with hooks, captions, engagement questions, and image/video directions.`,
    masterySignals: { minConversionRate: 0.04, maxRefundRate: 0.03 },
  },
  SIMPLE_VIDEO_EDIT: {
    id: 'SIMPLE_VIDEO_EDIT',
    type: 'SIMPLE_VIDEO_EDIT',
    name: 'Simple Short Video Editing Kit (Evergreen)',
    category: 'VIDEO',
    isEvergreen: true,
    pricingTiers: {
      BUDGET: { min: 20, target: 30, max: 40 },
      STANDARD: { min: 50, target: 65, max: 80 },
      PREMIUM: { min: 90, target: 120, max: 150 },
    },
    estimatedCost: { min: 3, target: 8, max: 15 },
    spec: {
      deliverableType: 'Pacing edit, zoom cuts, sound effects map, and animated captions',
    },
    validationCriteria: [
      { name: 'Hook Retention Structure', description: 'Sound effects and visual cuts every 2-3s', critical: true },
      { name: 'Subtitles Present', description: 'Dynamic karaoke style subtitles mapped', critical: true },
    ],
    buildInstructions: `Assemble a high-retention video edit specification with sound design layers, transition effects, and dynamic captions.`,
    masterySignals: { minConversionRate: 0.05, maxRefundRate: 0.02 },
  },
  // Backward compatibility alias for faceless_video
  faceless_video: {
    id: 'faceless_video',
    type: 'FACELESS_VIDEO',
    name: 'Faceless Social Video Pack',
    category: 'AI_CONTENT',
    isEvergreen: false,
    pricingTiers: {
      BUDGET: { min: 25, target: 40, max: 50 },
      STANDARD: { min: 75, target: 100, max: 120 },
      PREMIUM: { min: 150, target: 249, max: 300 },
    },
    estimatedCost: { min: 5, target: 15, max: 25 },
    spec: {
      deliverableType: '15-30s faceless social ad video + 2 thumbnail variants + ad copy',
      resolution: '1080x1920 (9:16 Vertical)',
      targetPlatforms: ['TikTok', 'Instagram Reels', 'YouTube Shorts', 'Meta Ads'],
      components: ['videoScript', 'audioVoiceover', 'dynamicSubtitles', 'thumbnailConcepts', 'adCopyVariants'],
    },
    validationCriteria: [
      { name: 'Resolution & Format', description: 'Must be vertical 9:16 format with high quality visual rendering', critical: true },
      { name: 'Duration Check', description: 'Duration must be between 15s and 30s', critical: true },
      { name: 'Audio Clarity', description: 'Voiceover pacing and background audio balance', critical: true },
      { name: 'No Hallucinated Text', description: 'All onscreen text matches script and brand standards', critical: true },
      { name: 'Brand Safe Content', description: 'Zero prohibited claims or trademark violations', critical: true },
    ],
    buildInstructions: `Generate an engaging 15-30 second direct response script with visual cues, high-contrast typography, hook-first structure, 2 thumbnail visual concepts, and 3 ad copy variations (short, medium, long).`,
    masterySignals: { minConversionRate: 0.03, maxRefundRate: 0.05 },
  },
};

/**
 * Dynamic Pricing Engine
 */
export function calculateDynamicPrice(params: {
  templateType: TemplateType;
  tier: PricingTier;
  trendVelocity?: number; // 0 - 100
  competitionLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  historicalConversion?: number; // 0 - 1
  buyerUrgency?: boolean;
  reviewCount?: number;
  averageRating?: number;
}): { finalPrice: number; basePrice: number; breakdown: Record<string, number> } {
  const spec = SWARM_TEMPLATES[params.templateType] || SWARM_TEMPLATES.FACELESS_VIDEO;
  const basePrice = spec.pricingTiers[params.tier].target;

  // Reputation gate
  let effectiveTier = params.tier;
  const reviewCount = params.reviewCount || 0;
  const avgRating = params.averageRating || 5.0;

  if (avgRating < 3.5 || reviewCount < 10) {
    effectiveTier = 'BUDGET';
  } else if (reviewCount < 50 && effectiveTier === 'PREMIUM') {
    effectiveTier = 'STANDARD';
  }

  const adjustedBase = spec.pricingTiers[effectiveTier].target;

  let velocityBonus = 0;
  if ((params.trendVelocity || 50) > 80) velocityBonus = 0.15;
  else if ((params.trendVelocity || 50) > 60) velocityBonus = 0.08;

  let competitionFactor = 0;
  if (params.competitionLevel === 'HIGH') competitionFactor = -0.12;
  else if (params.competitionLevel === 'MEDIUM') competitionFactor = -0.05;

  let conversionBonus = 0;
  if ((params.historicalConversion || 0.03) > 0.05) conversionBonus = 0.10;

  let urgencyBonus = params.buyerUrgency ? 0.15 : 0;
  let reputationBonus = reviewCount >= 50 && avgRating >= 4.5 ? 0.10 : 0;

  const totalMultiplier = 1 + velocityBonus + competitionFactor + conversionBonus + urgencyBonus + reputationBonus;
  const finalPrice = Math.round(adjustedBase * totalMultiplier);

  return {
    finalPrice,
    basePrice: adjustedBase,
    breakdown: {
      velocityBonus,
      competitionFactor,
      conversionBonus,
      urgencyBonus,
      reputationBonus,
      totalMultiplier,
    },
  };
}

/**
 * Seed Golden Samples
 */
export const SEED_GOLDEN_SAMPLES = [
  {
    templateType: 'FACELESS_VIDEO',
    artifactUrl: 'https://trendly.io/golden/faceless-ai-creator-pack.mp4',
    buyerRating: 5,
    buyerComment: 'Delivered in 2 hours. Generated 45k views on TikTok in 48 hours. Phenomenal hooks!',
    specData: { format: '1080x1920', duration: '24s', audioStyle: 'Deep Tech Voiceover', hookHoldRate: '72%' },
  },
  {
    templateType: 'ECOMMERCE_LISTING',
    artifactUrl: 'https://trendly.io/golden/ergonomic-mat-amazon-listing.json',
    buyerRating: 5,
    buyerComment: 'A+ Content ready. Our conversion rate increased by 2.4% within 3 days of updating.',
    specData: { imageCount: 5, keywordDensity: '3.2%', characterCount: 1420 },
  },
  {
    templateType: 'LANDING_PAGE',
    artifactUrl: 'https://trendly.io/golden/agency-ai-landing-page.html',
    buyerRating: 5,
    buyerComment: 'Clean responsive code, loaded in 0.8s on Vercel. Closed 4 client inquiries immediately.',
    specData: { loadTimeMs: 820, mobileOptimized: true, variantCount: 2 },
  },
];
