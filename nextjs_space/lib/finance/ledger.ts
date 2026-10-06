/**
 * Trendly Venture OS — Financial Truth Layer & Economic Engine
 * 
 * Strict provenance classification: PROJECTED, ESTIMATED, ACTUAL, VERIFIED.
 * Double-entry ledger integration and unit economics calculation (CAC, LTV, ROI, AI Cost/Revenue).
 * Idempotent Stripe reconciliation preventing revenue fabrication or duplication.
 */

import { prisma } from '@/lib/prisma';
import {
  FinancialProvenance,
  FinancialRecordType,
  Prisma,
} from '@prisma/client';

export interface RecordFinancialEntryInput {
  ventureId: string;
  customerId?: string;
  orderId?: string;
  type: FinancialRecordType;
  amountCents: number;
  currency?: string;
  provenance: FinancialProvenance;
  stripeChargeId?: string;
  stripeInvoiceId?: string;
  ledgerEntryId?: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface UnitEconomicsSummary {
  ventureId: string;
  currency: string;
  verifiedRevenueCents: number;
  projectedRevenueCents: number;
  aiComputeCostCents: number;
  infraCostCents: number;
  marketingCostCents: number;
  stripeFeesCents: number;
  totalCostCents: number;
  netProfitCents: number;
  grossMarginPct: number;
  customerCount: number;
  cacCents: number;
  ltvCents: number;
  roiPct: number;
  aiCostToRevenuePct: number;
  aiCostToGrossProfitPct: number;
  unitEconomicsHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL_BURN';
}

/**
 * Records a financial transaction with provenance.
 * Idempotent when stripeChargeId is provided.
 */
export async function recordFinancialTransaction(input: RecordFinancialEntryInput) {
  // Idempotency check for Stripe charges
  if (input.stripeChargeId) {
    const existing = await prisma.financialRecord.findUnique({
      where: { stripeChargeId: input.stripeChargeId },
    });
    if (existing) {
      return { record: existing, isDuplicate: true };
    }
  }

  const record = await prisma.$transaction(async (tx) => {
    const created = await tx.financialRecord.create({
      data: {
        ventureId: input.ventureId,
        customerId: input.customerId || null,
        orderId: input.orderId || null,
        type: input.type,
        amountCents: input.amountCents,
        currency: input.currency ?? 'USD',
        provenance: input.provenance,
        stripeChargeId: input.stripeChargeId || null,
        stripeInvoiceId: input.stripeInvoiceId || null,
        ledgerEntryId: input.ledgerEntryId || null,
        description: input.description,
        metadata: input.metadata || {},
      },
    });

    // Update venture aggregate counters if VERIFIED
    if (input.provenance === FinancialProvenance.VERIFIED) {
      if (input.type === FinancialRecordType.REVENUE) {
        await tx.venture.update({
          where: { id: input.ventureId },
          data: {
            revenueCents: { increment: input.amountCents },
            profitCents: { increment: input.amountCents },
          },
        });
      } else if (input.type === FinancialRecordType.REFUND) {
        await tx.venture.update({
          where: { id: input.ventureId },
          data: {
            revenueCents: { decrement: input.amountCents },
            profitCents: { decrement: input.amountCents },
          },
        });
      } else {
        // Cost entry
        await tx.venture.update({
          where: { id: input.ventureId },
          data: {
            costCents: { increment: input.amountCents },
            profitCents: { decrement: input.amountCents },
            capitalConsumedCents: { increment: input.amountCents },
          },
        });
      }
    }

    return created;
  });

  return { record, isDuplicate: false };
}

/**
 * Calculates rigorous unit economics for a given venture.
 */
export async function calculateVentureEconomics(ventureId: string): Promise<UnitEconomicsSummary> {
  const records = await prisma.financialRecord.findMany({
    where: { ventureId },
  });

  const customerCount = await prisma.ventureCustomer.count({
    where: { ventureId, status: 'ACTIVE' },
  });

  let verifiedRevenueCents = 0;
  let projectedRevenueCents = 0;
  let aiComputeCostCents = 0;
  let infraCostCents = 0;
  let marketingCostCents = 0;
  let stripeFeesCents = 0;
  let otherCostsCents = 0;

  for (const r of records) {
    if (r.type === FinancialRecordType.REVENUE) {
      if (r.provenance === FinancialProvenance.VERIFIED) {
        verifiedRevenueCents += r.amountCents;
      } else if (r.provenance === FinancialProvenance.PROJECTED) {
        projectedRevenueCents += r.amountCents;
      }
    } else if (r.type === FinancialRecordType.REFUND) {
      verifiedRevenueCents -= r.amountCents;
    } else if (r.type === FinancialRecordType.AI_COMPUTE_COST) {
      aiComputeCostCents += r.amountCents;
    } else if (r.type === FinancialRecordType.INFRA_COST) {
      infraCostCents += r.amountCents;
    } else if (r.type === FinancialRecordType.MARKETING_COST) {
      marketingCostCents += r.amountCents;
    } else if (r.type === FinancialRecordType.STRIPE_FEE) {
      stripeFeesCents += r.amountCents;
    } else {
      otherCostsCents += r.amountCents;
    }
  }

  const totalCostCents = aiComputeCostCents + infraCostCents + marketingCostCents + stripeFeesCents + otherCostsCents;
  const netProfitCents = verifiedRevenueCents - totalCostCents;

  const grossMarginPct = verifiedRevenueCents > 0
    ? Math.round(((verifiedRevenueCents - (aiComputeCostCents + infraCostCents)) / verifiedRevenueCents) * 1000) / 10
    : 0;

  const cacCents = customerCount > 0 ? Math.round(marketingCostCents / customerCount) : marketingCostCents;
  const ltvCents = customerCount > 0 ? Math.round(verifiedRevenueCents / customerCount) : 0;
  const roiPct = totalCostCents > 0 ? Math.round((netProfitCents / totalCostCents) * 100) : 0;

  const aiCostToRevenuePct = verifiedRevenueCents > 0
    ? Math.round((aiComputeCostCents / verifiedRevenueCents) * 1000) / 10
    : (aiComputeCostCents > 0 ? 100 : 0);

  const aiCostToGrossProfitPct = netProfitCents > 0
    ? Math.round((aiComputeCostCents / netProfitCents) * 1000) / 10
    : 100;

  // Determine health
  let unitEconomicsHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL_BURN' = 'HEALTHY';
  if (aiCostToRevenuePct > 40 || (verifiedRevenueCents > 0 && netProfitCents < 0)) {
    unitEconomicsHealth = 'CRITICAL_BURN';
  } else if (aiCostToRevenuePct > 25 || grossMarginPct < 50) {
    unitEconomicsHealth = 'WARNING';
  }

  return {
    ventureId,
    currency: 'USD',
    verifiedRevenueCents,
    projectedRevenueCents,
    aiComputeCostCents,
    infraCostCents,
    marketingCostCents,
    stripeFeesCents,
    totalCostCents,
    netProfitCents,
    grossMarginPct,
    customerCount,
    cacCents,
    ltvCents,
    roiPct,
    aiCostToRevenuePct,
    aiCostToGrossProfitPct,
    unitEconomicsHealth,
  };
}

/**
 * Reconciles incoming Stripe webhook events directly into the verified ledger.
 */
export async function reconcileStripeWebhookEvent(event: {
  id: string;
  type: string;
  data: { object: any };
}) {
  const obj = event.data.object;

  if (event.type === 'charge.succeeded' || event.type === 'payment_intent.succeeded') {
    const chargeId = obj.id;
    const amountCents = obj.amount;
    const currency = obj.currency?.toUpperCase() || 'USD';
    const ventureId = obj.metadata?.ventureId;

    if (!ventureId) {
      return { reconciled: false, reason: 'No ventureId in metadata', record: null as any, isDuplicate: false };
    }

    const tx = await recordFinancialTransaction({
      ventureId,
      amountCents,
      currency,
      type: FinancialRecordType.REVENUE,
      provenance: FinancialProvenance.VERIFIED,
      stripeChargeId: chargeId,
      description: `Stripe verified payment: ${obj.description || chargeId}`,
      metadata: { stripeEventId: event.id, customer: obj.customer },
    });
    return { reconciled: true, ...tx };
  }

  if (event.type === 'charge.refunded') {
    const chargeId = obj.id;
    const amountRefundedCents = obj.amount_refunded;
    const currency = obj.currency?.toUpperCase() || 'USD';
    const ventureId = obj.metadata?.ventureId;

    if (!ventureId) {
      return { reconciled: false, reason: 'No ventureId in metadata', record: null as any, isDuplicate: false };
    }

    const tx = await recordFinancialTransaction({
      ventureId,
      amountCents: amountRefundedCents,
      currency,
      type: FinancialRecordType.REFUND,
      provenance: FinancialProvenance.VERIFIED,
      stripeChargeId: `${chargeId}_refund_${event.id}`,
      description: `Stripe verified refund on charge ${chargeId}`,
      metadata: { stripeEventId: event.id },
    });
    return { reconciled: true, ...tx };
  }

  return { reconciled: false, reason: `Ignored event type: ${event.type}`, record: null as any, isDuplicate: false };
}
