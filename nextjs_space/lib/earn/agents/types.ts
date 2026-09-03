export type AgentStatus = 'idle' | 'working' | 'waiting_approval' | 'complete' | 'error';

export interface AgentMetadata {
  id: string;
  name: string;
  role: string;
  avatarIcon: string;
  color: string;
  status: AgentStatus;
  currentTask?: string;
  estimatedTimeRemaining?: string;
  lastUpdated: string;
}

// 1. Trend Scout
export interface TrendScoutOpportunity {
  id: string;
  trend: string;
  score: number; // 0-100
  demandSignals: string[];
  buyerProfile: string;
  priceRange: string;
  competition: 'LOW' | 'MEDIUM' | 'HIGH';
  aiCanBuild: boolean;
  estimatedCloseTime: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  breakdown: {
    searchGrowth: number;
    socialVelocity: number;
    buyerIntent: number;
    competitionScore: number;
    aiExecutability: number;
    priceViability: number;
  };
}

// 2. Deliverable Architect
export interface DeliverablePackage {
  id: string;
  title: string;
  deliverableType: 'AI_VOICE' | 'FACELESS_VIDEO' | 'GBP_PACK' | 'UGC_ADS' | 'CONTENT_MULTIPLICATION';
  filesGenerated: {
    name: string;
    fileType: string;
    description: string;
    downloadUrl?: string;
  }[];
  executiveBrief: string;
  setupInstructions: string[];
  clientPitchDeck: string;
  sampleAssetUrl?: string;
  qualityScore: number;
}

// 3. Buyer Hunter
export interface QualifiedBuyer {
  id: string;
  name: string;
  organization: string;
  category: 'LOCAL_BUSINESS' | 'CREATOR' | 'E_COMMERCE' | 'COACH';
  location?: string;
  score: number; // 0-100
  signals: string[];
  contact: {
    decisionMaker: string;
    channel: 'Email' | 'Instagram DM' | 'LinkedIn' | 'X DM' | 'Facebook';
    address: string;
  };
  recommendedPrice: string;
  personalizedHook: string;
  closeProbability: number; // percentage
}

// 4. Outreach Composer
export type OutreachFramework = 'FREE_SAMPLE' | 'PAIN_MIRROR' | 'SOCIAL_PROOF';

export interface OutreachMessage {
  id: string;
  buyerId: string;
  framework: OutreachFramework;
  channel: 'Email' | 'Instagram DM' | 'LinkedIn' | 'X DM' | 'Facebook';
  subject?: string;
  body: string;
  followUpCadence: {
    day: number;
    action: string;
    message: string;
  }[];
  approved: boolean;
}

// 5. Video Production Engine
export interface VideoClipCandidate {
  id: string;
  sourceTimestamp: string;
  durationSeconds: number;
  hookText: string;
  viralScore: number; // 0-100
  captionStyle: 'Hormozi' | 'MrBeast' | 'Minimal' | 'Corporate' | 'Custom';
  aspectRatio: '9:16' | '16:9';
  previewUrl: string;
}

// 6. Platform Arbitrage Scout
export interface PlatformScoutMatrix {
  platform: string;
  category: 'DIGITAL_PRODUCT' | 'VIDEO_CLIPS' | 'STOCK_FOOTAGE' | 'COURSES';
  payoutPercentage: number;
  payoutSpeed: string;
  audienceSize: string;
  easeOfListing: number; // 1-10
  competitionLevel: number; // 1-10 (lower is better)
  trendingDirection: 'UP' | 'STABLE' | 'DOWN';
  recommendationScore: number;
  monthlyPotential: string;
  recommendedPricing: string;
}

// 7. Sales Closer
export interface ObjectionResponse {
  objectionKey: 'TOO_EXPENSIVE' | 'NEED_TO_THINK' | 'CAN_YOU_DO_CHEAPER' | 'ALREADY_HAVE_SOMEONE' | 'SEND_MORE_INFO';
  buyerSaying: string;
  tacticalReply: string;
  psychologicalLever: string;
}

export interface InvoiceDraft {
  id: string;
  clientName: string;
  amount: number;
  type: 'ONE_TIME' | 'MONTHLY_RETAINER';
  terms: string;
  deliverablesIncluded: string[];
  stripePaymentLink?: string;
}

// 8. Quality Controller
export interface QualityAuditResult {
  deliverableId: string;
  score: number; // 1-10
  status: 'AUTO_APPROVED' | 'FLAGGED_FOR_REVIEW' | 'AUTO_REJECTED';
  checks: {
    criterion: string;
    passed: boolean;
    notes?: string;
  }[];
  requiredImprovements?: string[];
}

// 9. Analytics & Optimizer
export interface UnitEconomicsModel {
  pathway: 'QUICK_WINS' | 'VIDEO_EMPIRE' | 'AUTOMATED_ASSETS';
  playName: string;
  targetPrice: number;
  closeRateCold: number;
  leadsNeededPerClose: number;
  humanTimeMinutes: number;
  aiProcessingTimeMinutes: number;
  netProfitPerDeal: number;
  effectiveHourlyRate: number;
  month1Revenue: number;
  month3Revenue: number;
  month12Revenue: number;
}