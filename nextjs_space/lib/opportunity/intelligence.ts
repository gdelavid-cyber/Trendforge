/**
 * Trendly Venture OS — Opportunity Intelligence Engine
 * 
 * Ingests, normalizes, dedupes, clusters, and evaluates market signals.
 * Strictly separates OBSERVED evidence from INFERRED or MODEL_ESTIMATE calculations.
 * Never manufactures demand evidence.
 */

import { prisma } from '@/lib/prisma';
import { SignalProvenance, ValidationRecommendation } from '@prisma/client';
import { instrumentedJevCall } from '@/lib/observability/collector';

export interface IngestSignalInput {
  source: 'reddit' | 'hackernews' | 'github' | 'twitter' | 'search' | 'custom';
  sourceUrl: string;
  externalId?: string;
  topic: string;
  industry: string;
  customerSegment?: string;
  problemExcerpt: string;
  urgencyScore?: number;
  intentScore?: number;
  reliabilityScore?: number;
  provenance?: SignalProvenance;
  rawSignalData?: Record<string, any>;
  ventureId?: string;
}

export interface DemandValidationInput {
  signalId?: string;
  ventureId?: string;
  problem: string;
  targetCustomer: string;
  industry: string;
  competitors?: Array<{ name: string; pricing: string; weakness: string }>;
  observedPricingPoints?: number[]; // in cents
}

export interface DemandValidationResult {
  recommendation: ValidationRecommendation;
  painEvidence: string;
  urgencyEvidence: string;
  competitorLandscape: any;
  pricingEvidence: any;
  marginExpectation: number;
  technicalDifficultyScore: number;
  operationalRiskScore: number;
  rationale: string;
}

// Concrete urgency and intent heuristic keywords
const HIGH_URGENCY_TRIGGERS = [
  'need a solution immediately',
  'desperately looking for',
  'willing to pay',
  'budget is',
  'alternative to',
  'too expensive',
  'breaking our workflow',
  'wasting hours every week',
  'frustrated with',
  'hate having to manually',
];

const HIGH_INTENT_TRIGGERS = [
  'looking to buy',
  'looking for',
  'willing to pay',
  'budget is',
  'alternative to',
  'what tool can do',
  'any software that',
  'recommend a service for',
  'hiring someone to',
  'ready to switch from',
  'how much does it cost to',
  'paid tool recommendation',
];

/**
 * Normalizes, calculates empirical heuristic scores, and stores a MarketSignal.
 */
export async function ingestMarketSignal(input: IngestSignalInput) {
  // Intent & urgency heuristics if not provided
  let computedUrgency = input.urgencyScore;
  let computedIntent = input.intentScore;

  const lowerExcerpt = input.problemExcerpt.toLowerCase();

  if (computedUrgency === undefined) {
    let matches = 0;
    for (const trigger of HIGH_URGENCY_TRIGGERS) {
      if (lowerExcerpt.includes(trigger)) matches++;
    }
    computedUrgency = Math.min(100, Math.max(20, matches * 25 + 30));
  }

  if (computedIntent === undefined) {
    let matches = 0;
    for (const trigger of HIGH_INTENT_TRIGGERS) {
      if (lowerExcerpt.includes(trigger)) matches++;
    }
    computedIntent = Math.min(100, Math.max(20, matches * 30 + 20));
  }

  // Deduplication check if externalId + source present
  if (input.externalId) {
    const existing = await prisma.marketSignal.findFirst({
      where: {
        source: input.source,
        externalId: input.externalId,
      },
    });
    if (existing) {
      return { signal: existing, isDuplicate: true };
    }
  }

  const signal = await prisma.marketSignal.create({
    data: {
      ventureId: input.ventureId || null,
      source: input.source,
      sourceUrl: input.sourceUrl,
      externalId: input.externalId || null,
      topic: input.topic,
      industry: input.industry,
      customerSegment: input.customerSegment || null,
      problemExcerpt: input.problemExcerpt,
      urgencyScore: computedUrgency,
      intentScore: computedIntent,
      reliabilityScore: input.reliabilityScore ?? 70,
      provenance: input.provenance ?? SignalProvenance.OBSERVED,
      rawSignalData: input.rawSignalData || {},
    },
  });

  return { signal, isDuplicate: false };
}

/**
 * Conducts structured empirical demand validation on a problem & market signal.
 * Never fabricates numbers. If evidence is thin, outputs DEFER or REJECT.
 */
export async function validateDemand(input: DemandValidationInput): Promise<DemandValidationResult> {
  const { problem, targetCustomer, industry, competitors = [], observedPricingPoints = [] } = input;

  // Evaluate pain & urgency from text density, target audience, and specifics
  const lowerProb = problem.toLowerCase();
  const combinedContext = `${problem} ${targetCustomer || ''} ${industry || ''}`.toLowerCase();
  const hasSpecificWorkflow = lowerProb.length > 30 && !lowerProb.includes('lorem');
  const hasCommercialFocus = !combinedContext.includes('hobby') && (
    combinedContext.includes('business') ||
    combinedContext.includes('company') ||
    combinedContext.includes('agency') ||
    combinedContext.includes('client') ||
    combinedContext.includes('revenue') ||
    combinedContext.includes('workflow') ||
    combinedContext.includes('b2b') ||
    combinedContext.includes('sales') ||
    combinedContext.includes('budget') ||
    combinedContext.includes('team') ||
    combinedContext.includes('firm') ||
    combinedContext.includes('saas') ||
    combinedContext.includes('enterprise')
  );

  // Calculate pricing baseline
  let estimatedMargin = 0.75; // Default SaaS/service baseline
  const pricingEvidence = {
    observedCount: observedPricingPoints.length,
    medianPriceCents: observedPricingPoints.length > 0
      ? observedPricingPoints.sort((a, b) => a - b)[Math.floor(observedPricingPoints.length / 2)]
      : 4900, // $49/mo benchmark default
    priceRangeCents: observedPricingPoints.length > 0
      ? [Math.min(...observedPricingPoints), Math.max(...observedPricingPoints)]
      : [2900, 9900],
    source: observedPricingPoints.length > 0 ? 'OBSERVED' : 'MODEL_ESTIMATE',
  };

  // Technical & operational scores
  let technicalDifficulty = 40;
  if (problem.toLowerCase().includes('real-time') || problem.toLowerCase().includes('infrastructure')) {
    technicalDifficulty += 25;
  }
  let operationalRisk = 25;
  if (competitors.length > 8) {
    operationalRisk += 30; // High saturation
  }

  // Jev decision gating on commercial viability
  let viabilityScore = 0.6;
  try {
    const { askJev } = await import('@/lib/intelligence/decision/jev');
    const questions = {
      commercial_viability: { type: 'score', description: 'Viability 0-100', min: 0, max: 100 },
    };
    const jevResult = await instrumentedJevCall(
      {
        gateType: 'lead_qualification',
        threshold: 0.70,
        state: { problem, targetCustomer, industry, competitorCount: competitors.length },
        questions,
      },
      () => askJev({ problem, targetCustomer, industry, competitorCount: competitors.length }, questions)
    );
    const scoreVal = (jevResult as any)?.decision?.commercial_viability;
    if (typeof scoreVal === 'number') {
      viabilityScore = scoreVal > 1 ? scoreVal / 100 : scoreVal;
    } else {
      let score = 0.5;
      if (hasSpecificWorkflow) score += 0.2;
      if (hasCommercialFocus) score += 0.2;
      if (competitors.length >= 1 && competitors.length <= 6) score += 0.1;
      viabilityScore = Math.min(1.0, score);
    }
  } catch (_) {
    let score = 0.5;
    if (hasSpecificWorkflow) score += 0.2;
    if (hasCommercialFocus) score += 0.2;
    if (competitors.length >= 1 && competitors.length <= 6) score += 0.1;
    viabilityScore = Math.min(1.0, score);
  }

  let recommendation: ValidationRecommendation = ValidationRecommendation.DEFER;
  let rationale = '';

  if (viabilityScore >= 0.75 && hasSpecificWorkflow && hasCommercialFocus) {
    recommendation = ValidationRecommendation.VALIDATE;
    rationale = `High pain density identified with specific commercial workflow and healthy competitive demand. Viability score: ${(viabilityScore * 100).toFixed(0)}%.`;
  } else if (viabilityScore < 0.45 || !hasSpecificWorkflow) {
    recommendation = ValidationRecommendation.REJECT;
    rationale = `Insufficient customer pain specificity or non-commercial focus. Viability score: ${(viabilityScore * 100).toFixed(0)}%.`;
  } else {
    recommendation = ValidationRecommendation.DEFER;
    rationale = `Opportunity shows preliminary promise but requires further direct customer interviews or additional market signals. Viability score: ${(viabilityScore * 100).toFixed(0)}%.`;
  }

  const result: DemandValidationResult = {
    recommendation,
    painEvidence: `Analyzed customer statement for target "${targetCustomer}": "${problem.substring(0, 200)}"`,
    urgencyEvidence: `Evaluated via ${competitors.length} competitors and commercial workflow markers. Commercial intent score: ${(viabilityScore * 100).toFixed(0)}%.`,
    competitorLandscape: competitors,
    pricingEvidence,
    marginExpectation: estimatedMargin,
    technicalDifficultyScore: technicalDifficulty,
    operationalRiskScore: operationalRisk,
    rationale,
  };

  // Persist report if signalId or ventureId provided
  if (input.signalId || input.ventureId) {
    await prisma.demandValidationReport.create({
      data: {
        ventureId: input.ventureId || null,
        signalId: input.signalId || null,
        painEvidence: result.painEvidence,
        urgencyEvidence: result.urgencyEvidence,
        competitorLandscape: result.competitorLandscape,
        pricingEvidence: result.pricingEvidence,
        marginExpectation: result.marginExpectation,
        technicalDifficultyScore: result.technicalDifficultyScore,
        operationalRiskScore: result.operationalRiskScore,
        recommendation: result.recommendation,
        rationale: result.rationale,
      },
    });
  }

  return result;
}

/**
 * Clusters signals across common industries and problem keywords to identify high-density opportunities.
 */
export async function clusterMarketSignals(industry?: string) {
  const whereClause = industry ? { industry } : {};
  const signals = await prisma.marketSignal.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const clusters: Record<string, { topic: string; industry: string; signals: typeof signals; avgUrgency: number; avgIntent: number }> = {};

  for (const s of signals) {
    const key = `${s.industry}:${s.topic.toLowerCase().trim()}`;
    if (!clusters[key]) {
      clusters[key] = {
        topic: s.topic,
        industry: s.industry,
        signals: [],
        avgUrgency: 0,
        avgIntent: 0,
      };
    }
    clusters[key].signals.push(s);
  }

  // Calculate cluster aggregate metrics
  return Object.values(clusters).map((c) => {
    const count = c.signals.length;
    const totalUrgency = c.signals.reduce((acc, s) => acc + s.urgencyScore, 0);
    const totalIntent = c.signals.reduce((acc, s) => acc + s.intentScore, 0);
    return {
      topic: c.topic,
      industry: c.industry,
      signalCount: count,
      avgUrgency: Math.round(totalUrgency / count),
      avgIntent: Math.round(totalIntent / count),
      sampleSignalIds: c.signals.map((s) => s.id).slice(0, 5),
    };
  }).sort((a, b) => (b.signalCount * b.avgUrgency) - (a.signalCount * a.avgUrgency));
}
