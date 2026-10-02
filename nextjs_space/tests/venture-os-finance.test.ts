import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { createVenture } from '@/lib/venture/engine';
import {
  recordFinancialTransaction,
  calculateVentureEconomics,
  reconcileStripeWebhookEvent,
} from '@/lib/finance/ledger';
import { FinancialProvenance, FinancialRecordType } from '@prisma/client';

describe('Trendly Venture OS — Financial Truth Layer & Economic Engine', () => {
  let testUserId: string;
  let ventureId: string;

  beforeEach(async () => {
    const user = await prisma.user.findFirst();
    testUserId = user?.id || 'test_user_id';

    const venture = await createVenture({
      userId: testUserId,
      name: 'Financial Ledger Test Venture',
      problem: 'SaaS companies lose money to cloud over-allocation.',
      targetCustomer: 'CTOs of seed-stage startups',
      industry: 'DevOps',
    });
    ventureId = venture.id;
  });

  it('records financial transactions with strict provenance without mixing them', async () => {
    // 1. Record projected revenue
    await recordFinancialTransaction({
      ventureId,
      amountCents: 50000,
      type: FinancialRecordType.REVENUE,
      provenance: FinancialProvenance.PROJECTED,
      description: 'Projected pipeline valuation',
    });

    // 2. Record verified revenue
    await recordFinancialTransaction({
      ventureId,
      amountCents: 15000,
      type: FinancialRecordType.REVENUE,
      provenance: FinancialProvenance.VERIFIED,
      description: 'First customer subscription payment',
    });

    // 3. Record AI compute cost
    await recordFinancialTransaction({
      ventureId,
      amountCents: 2500,
      type: FinancialRecordType.AI_COMPUTE_COST,
      provenance: FinancialProvenance.VERIFIED,
      description: 'OpenRouter token inference burn',
    });

    const economics = await calculateVentureEconomics(ventureId);

    expect(economics.verifiedRevenueCents).toBe(15000);
    expect(economics.projectedRevenueCents).toBe(50000);
    expect(economics.aiComputeCostCents).toBe(2500);
    expect(economics.netProfitCents).toBe(15000 - 2500);
  });

  it('guarantees Stripe webhook idempotency: duplicate charges never duplicate revenue', async () => {
    const mockChargeEvent = {
      id: `evt_test_${Date.now()}`,
      type: 'charge.succeeded',
      data: {
        object: {
          id: `ch_unique_charge_${Date.now()}`,
          amount: 9900,
          currency: 'usd',
          description: 'Monthly Pro Subscription',
          metadata: { ventureId },
        },
      },
    };

    // First reconciliation
    const firstPass = await reconcileStripeWebhookEvent(mockChargeEvent);
    expect(firstPass.isDuplicate).toBe(false);

    // Second reconciliation with identical charge ID
    const secondPass = await reconcileStripeWebhookEvent(mockChargeEvent);
    expect(secondPass.isDuplicate).toBe(true);

    const economics = await calculateVentureEconomics(ventureId);
    expect(economics.verifiedRevenueCents).toBe(9900); // Exactly once, NOT doubled!
  });

  it('flags CRITICAL_BURN when AI compute costs exceed 40% of revenue', async () => {
    // Revenue $100
    await recordFinancialTransaction({
      ventureId,
      amountCents: 10000,
      type: FinancialRecordType.REVENUE,
      provenance: FinancialProvenance.VERIFIED,
      description: 'Revenue $100',
    });

    // AI Cost $55 (55% burn)
    await recordFinancialTransaction({
      ventureId,
      amountCents: 5500,
      type: FinancialRecordType.AI_COMPUTE_COST,
      provenance: FinancialProvenance.VERIFIED,
      description: 'Excessive LLM loop cost',
    });

    const economics = await calculateVentureEconomics(ventureId);
    expect(economics.aiCostToRevenuePct).toBe(55);
    expect(economics.unitEconomicsHealth).toBe('CRITICAL_BURN');
  });
});
