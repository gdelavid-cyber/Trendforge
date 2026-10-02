import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { createVenture, transitionVentureState, getVentureDetails } from '@/lib/venture/engine';
import { VentureLifecycleState, VentureBusinessModel, FinancialRecordType, FinancialProvenance } from '@prisma/client';

describe('Trendly Venture OS — Lifecycle State Machine', () => {
  let testUserId: string;

  beforeEach(async () => {
    // Ensure test user exists
    const user = await prisma.user.findFirst();
    if (user) {
      testUserId = user.id;
    } else {
      const created = await prisma.user.create({
        data: {
          email: `test-venture-owner-${Date.now()}@example.com`,
          passwordHash: 'dummy_hash',
          name: 'Venture Test User',
        },
      });
      testUserId = created.id;
    }
  });

  it('creates a new venture initialized strictly in DISCOVERED state', async () => {
    const venture = await createVenture({
      userId: testUserId,
      name: 'Automated Cold Outreach AI',
      problem: 'B2B sales teams spend 15 hours weekly writing personalized emails with low reply rates.',
      targetCustomer: 'Mid-market SaaS sales teams',
      industry: 'B2B Software',
      businessModel: VentureBusinessModel.AI_SAAS,
    });

    expect(venture.id).toBeDefined();
    expect(venture.lifecycleState).toBe(VentureLifecycleState.DISCOVERED);
    expect(venture.slug).toContain('automated-cold-outreach-ai');

    const details = await getVentureDetails(venture.id);
    expect(details?.transitions.length).toBeGreaterThanOrEqual(1);
    expect(details?.transitions[0].toState).toBe(VentureLifecycleState.DISCOVERED);
  });

  it('allows legal transitions and records transition evidence', async () => {
    const venture = await createVenture({
      userId: testUserId,
      name: 'Legal Transition Venture',
      problem: 'Accounting firms struggle to reconcile crypto transactions.',
      targetCustomer: 'Boutique accounting firms',
      industry: 'Fintech',
    });

    // DISCOVERED -> RESEARCHING
    const step1 = await transitionVentureState({
      ventureId: venture.id,
      toState: VentureLifecycleState.RESEARCHING,
      actor: 'RESEARCH_AGENT',
      reason: 'Gathering competitor pricing points and market signals',
      evidence: { competitorCount: 3 },
    });
    expect(step1.lifecycleState).toBe(VentureLifecycleState.RESEARCHING);

    // RESEARCHING -> VALIDATING
    const step2 = await transitionVentureState({
      ventureId: venture.id,
      toState: VentureLifecycleState.VALIDATING,
      actor: 'CEO_AGENT',
      reason: 'Competitors identified; testing buyer willingness to pay',
    });
    expect(step2.lifecycleState).toBe(VentureLifecycleState.VALIDATING);
  });

  it('blocks illegal state jumps through the state machine graph', async () => {
    const venture = await createVenture({
      userId: testUserId,
      name: 'Jump Test Venture',
      problem: 'Video editors need automated transcript alignment.',
      targetCustomer: 'YouTube creators',
      industry: 'Media',
    });

    // Attempt DISCOVERED -> SCALING (illegal skip)
    await expect(
      transitionVentureState({
        ventureId: venture.id,
        toState: VentureLifecycleState.SCALING,
        actor: 'TEST_RUNNER',
        reason: 'Attempting invalid jump',
      })
    ).rejects.toThrow(/Illegal state transition/);
  });

  it('enforces objective prerequisites: cannot enter FIRST_REVENUE without verified revenue record', async () => {
    const venture = await createVenture({
      userId: testUserId,
      name: 'Revenue Prerequisite Venture',
      problem: 'Customer support teams have high turnover.',
      targetCustomer: 'E-commerce brands',
      industry: 'Customer Support',
    });

    // Fast-forward to SELLING
    await prisma.venture.update({
      where: { id: venture.id },
      data: { lifecycleState: VentureLifecycleState.SELLING },
    });

    // Attempt SELLING -> FIRST_REVENUE without any verified financial record
    await expect(
      transitionVentureState({
        ventureId: venture.id,
        toState: VentureLifecycleState.FIRST_REVENUE,
        actor: 'SALES_AGENT',
        reason: 'Claiming first revenue falsely',
      })
    ).rejects.toThrow(/No VERIFIED financial revenue record exists/);

    // Now insert a genuine VERIFIED revenue record
    await prisma.financialRecord.create({
      data: {
        ventureId: venture.id,
        type: FinancialRecordType.REVENUE,
        amountCents: 4900,
        provenance: FinancialProvenance.VERIFIED,
        description: 'Verified Stripe invoice payment',
      },
    });

    // Transition should now succeed
    const validStep = await transitionVentureState({
      ventureId: venture.id,
      toState: VentureLifecycleState.FIRST_REVENUE,
      actor: 'SALES_AGENT',
      reason: 'Verified Stripe payment received',
    });
    expect(validStep.lifecycleState).toBe(VentureLifecycleState.FIRST_REVENUE);
  });
});
