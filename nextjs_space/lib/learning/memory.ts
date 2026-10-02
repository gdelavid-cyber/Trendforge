/**
 * Trendly Venture OS — Learning Engine & Venture Memory
 * 
 * Captures decision variances, customer objections, operational failures, and market lessons.
 * Promotes high-confidence patterns into reusable global VentureBlueprints.
 */

import { prisma } from '@/lib/prisma';
import { VentureBusinessModel } from '@prisma/client';

export interface RecordMemoryInput {
  ventureId: string;
  category: 'CUSTOMER_OBJECTION' | 'PRICING_FEEDBACK' | 'TECHNICAL_FAILURE' | 'MARKET_INSIGHT' | 'LESSON';
  insight: string;
  supportingData?: Record<string, any>;
  confidence?: number;
}

export interface PromoteToBlueprintInput {
  ventureId: string;
  name: string;
  industry: string;
  businessModel: VentureBusinessModel;
  typicalPriceCents: number;
  validatedOfferTemplate: Record<string, any>;
  funnelTemplate: Record<string, any>;
  agentStackConfig?: Record<string, any>;
  provenRoiMedian: number;
}

/**
 * Persists an experience reflection into persistent VentureMemory.
 */
export async function recordVentureMemory(input: RecordMemoryInput) {
  return prisma.ventureMemory.create({
    data: {
      ventureId: input.ventureId,
      category: input.category,
      insight: input.insight,
      supportingData: input.supportingData || {},
      confidence: input.confidence ?? 0.85,
    },
  });
}

/**
 * Retrieves contextual memories for a venture by category or keywords.
 */
export async function getVentureMemories(ventureId: string, category?: string) {
  const where: any = { ventureId };
  if (category) where.category = category;

  return prisma.ventureMemory.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 25,
  });
}

/**
 * Promotes an evidence-backed venture pattern into a reusable global VentureBlueprint.
 */
export async function promoteToBlueprint(input: PromoteToBlueprintInput) {
  const blueprint = await prisma.ventureBlueprint.create({
    data: {
      name: input.name,
      industry: input.industry,
      businessModel: input.businessModel,
      typicalPriceCents: input.typicalPriceCents,
      validatedOfferTemplate: input.validatedOfferTemplate,
      funnelTemplate: input.funnelTemplate,
      agentStackConfig: input.agentStackConfig || { defaultRunner: 'MICRO_SAAS_BUILDER' },
      provenRoiMedian: input.provenRoiMedian,
      sampleSizeVentures: 1,
    },
  });

  // Mark memories as promoted
  await prisma.ventureMemory.updateMany({
    where: { ventureId: input.ventureId },
    data: { isPromotedToGlobalBlueprint: true },
  });

  return blueprint;
}

/**
 * Searches global blueprints matching an industry or business model.
 */
export async function findMatchingBlueprints(industry: string, businessModel?: VentureBusinessModel) {
  const where: any = { industry };
  if (businessModel) where.businessModel = businessModel;

  return prisma.ventureBlueprint.findMany({
    where,
    orderBy: { provenRoiMedian: 'desc' },
    take: 10,
  });
}
