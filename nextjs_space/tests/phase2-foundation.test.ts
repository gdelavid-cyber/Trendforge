import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
  createVenture,
  transitionStage,
  getVentureStage,
  getPermittedNextStages,
  VentureLifecycleState,
} from '@/lib/ventures/lifecycle';
import {
  setCapitalAllocationPlan,
  authorizeSpend,
  getVentureBurnRate,
  getVentureEconomics,
} from '@/lib/capital/allocation';
import { KernelRuntime } from '@/lib/runtime/kernel';
import { recordDecision } from '@/lib/observability/collector';
import { FinancialRecordType, FinancialProvenance, VentureBusinessModel, AutonomyLevel } from '@prisma/client';

describe('Phase 2 Foundation: Lifecycle, Capital Allocation & Kernel Runtime', () => {
  let testUserId: string;

  beforeEach(async () => {
    vi.restoreAllMocks();
    const user = await prisma.user.findFirst();
    if (user) {
      testUserId = user.id;
    } else {
      const created = await prisma.user.create({
        data: {
          email: `phase2-tester-${Date.now()}@trendly.os`,
          name: 'Phase 2 Tester',
          passwordHash: 'dummy_hash',
        },
      });
      testUserId = created.id;
    }
  });

  afterEach(() => {
    delete process.env.BRAIN_LLM_COST_BUDGET;
    delete process.env.AGENT_USER_SPENDING_LIMIT;
    delete process.env.VENTURE_DAILY_LLM_BUDGET;
    delete process.env.LLM_PROVIDER;
  });

  // ==========================================================================
  // 1. LIFECYCLE STATE MACHINE & PREREQUISITES
  // ==========================================================================
  describe('Lifecycle State Machine', () => {
    it('initializes a new venture strictly in DISCOVERED stage', async () => {
      const venture = await createVenture({
        userId: testUserId,
        name: 'AI Medical Coding Assistant',
        problem: 'Clinics lose 18% of billings to coding submission errors.',
        targetCustomer: 'Private practice medical groups',
        industry: 'HealthTech',
        businessModel: VentureBusinessModel.AI_SAAS,
      });

      expect(venture.id).toBeDefined();
      expect(venture.lifecycleState).toBe(VentureLifecycleState.DISCOVERED);

      const stageInfo = await getVentureStage(venture.id);
      expect(stageInfo.stage).toBe(VentureLifecycleState.DISCOVERED);
      expect(stageInfo.permittedNextStages).toContain(VentureLifecycleState.RESEARCHING);
      expect(stageInfo.permittedNextStages).toContain(VentureLifecycleState.VALIDATING);
      expect(stageInfo.permittedNextStages).not.toContain(VentureLifecycleState.FIRST_REVENUE);
    });

    it('enforces legal forward transitions through the state machine graph', async () => {
      const venture = await createVenture({
        userId: testUserId,
        name: 'FinOps Optimization Agent',
        problem: 'Cloud egress fees go unchecked.',
        targetCustomer: 'FinOps Engineers',
        industry: 'Cloud Infrastructure',
      });

      // DISCOVERED -> RESEARCHING
      const stage1 = await transitionStage(
        venture.id,
        VentureLifecycleState.RESEARCHING,
        { signalsGathered: 15 },
        'RESEARCH_AGENT',
        'Scraped cloud engineering discussion threads'
      );
      expect(stage1.lifecycleState).toBe(VentureLifecycleState.RESEARCHING);

      // RESEARCHING -> VALIDATING
      const stage2 = await transitionStage(
        venture.id,
        VentureLifecycleState.VALIDATING,
        { surveyCount: 20 },
        'VALIDATION_AGENT',
        'Conducted user intent validation'
      );
      expect(stage2.lifecycleState).toBe(VentureLifecycleState.VALIDATING);
    });

    it('blocks illegal state jumps through the state machine graph', async () => {
      const venture = await createVenture({
        userId: testUserId,
        name: 'Skipping Stages Venture',
        problem: 'Testing state jump enforcement',
        targetCustomer: 'Test audience',
        industry: 'Software',
      });

      // Illegal jump: DISCOVERED -> FIRST_REVENUE
      await expect(
        transitionStage(venture.id, VentureLifecycleState.FIRST_REVENUE, {}, 'TEST_ACTOR')
      ).rejects.toThrow(/Illegal state transition from DISCOVERED to FIRST_REVENUE/);

      // Illegal jump: DISCOVERED -> SCALING
      await expect(
        transitionStage(venture.id, VentureLifecycleState.SCALING, {}, 'TEST_ACTOR')
      ).rejects.toThrow(/Illegal state transition from DISCOVERED to SCALING/);
    });

    it('strictly enforces objective prerequisites: cannot enter FIRST_REVENUE without verified payment', async () => {
      const venture = await createVenture({
        userId: testUserId,
        name: 'Revenue Prerequisite Test',
        problem: 'Sellers need automatic inventory sync',
        targetCustomer: 'Shopify Merchants',
        industry: 'E-commerce',
      });

      // Advance to SELLING legally
      await transitionStage(venture.id, VentureLifecycleState.RESEARCHING);
      await transitionStage(venture.id, VentureLifecycleState.VALIDATING);
      
      // Seed validation report to allow VALIDATED
      await prisma.demandValidationReport.create({
        data: {
          ventureId: venture.id,
          recommendation: 'VALIDATE',
          painEvidence: 'Customer interviews confirmed severe sync pain',
          urgencyEvidence: 'Immediate quarterly renewal deadlines',
          rationale: 'High demand confirmed with positive willingness to pay',
        },
      });
      await transitionStage(venture.id, VentureLifecycleState.VALIDATED);

      // Seed offer to allow READY_TO_SELL
      await prisma.ventureOffer.create({
        data: {
          ventureId: venture.id,
          title: 'Monthly Sync License',
          description: 'Automated catalog and inventory synchronization license',
          priceCents: 9900,
        },
      });
      await transitionStage(venture.id, VentureLifecycleState.READY_TO_SELL);
      await transitionStage(venture.id, VentureLifecycleState.SELLING);

      // Attempting FIRST_REVENUE without any verified revenue must fail
      await expect(
        transitionStage(venture.id, VentureLifecycleState.FIRST_REVENUE)
      ).rejects.toThrow(/Cannot transition to FIRST_REVENUE: No VERIFIED financial revenue record exists/);

      // Record a verified Stripe payment
      await prisma.financialRecord.create({
        data: {
          ventureId: venture.id,
          type: FinancialRecordType.REVENUE,
          amountCents: 9900,
          currency: 'USD',
          provenance: FinancialProvenance.VERIFIED,
          stripeChargeId: `ch_verified_test_${Date.now()}`,
          description: 'Verified customer subscription payment',
        },
      });

      // Now transition succeeds
      const advanced = await transitionStage(venture.id, VentureLifecycleState.FIRST_REVENUE);
      expect(advanced.lifecycleState).toBe(VentureLifecycleState.FIRST_REVENUE);
    });
  });

  // ==========================================================================
  // 2. CAPITAL ALLOCATION & ECONOMICS
  // ==========================================================================
  describe('Capital Allocation Engine', () => {
    it('authorizes spend within limits and rejects spend exceeding total budget', async () => {
      const venture = await createVenture({
        userId: testUserId,
        name: 'Budget Cap Venture',
        problem: 'Testing capital limits',
        targetCustomer: 'Indie devs',
        industry: 'Developer Tools',
        capitalAllocatedCents: 10000, // $100 allocated
      });

      await setCapitalAllocationPlan({
        ventureId: venture.id,
        allocatedCents: 10000, // $100
        maxDailyBurnCents: 5000, // $50/day
        hardStopThresholdCents: 10000,
      });

      // 1. Authorize $25 spend -> Success
      const auth1 = await authorizeSpend({
        ventureId: venture.id,
        amountCents: 2500,
        spendCategory: 'AI_COMPUTE',
        description: 'Initial market research embeddings',
      });
      expect(auth1.authorized).toBe(true);
      expect(auth1.currentConsumedCents).toBe(2500);

      // 2. Authorize another $80 spend -> Total would be $105 > $100 budget -> Rejection
      const auth2 = await authorizeSpend({
        ventureId: venture.id,
        amountCents: 8000,
        spendCategory: 'AI_COMPUTE',
        description: 'Massive unapproved scraping sweep',
      });
      expect(auth2.authorized).toBe(false);
      expect(auth2.reason).toContain('Total budget exceeded');
    });

    it('rejects spend when daily burn limit is breached', async () => {
      const venture = await createVenture({
        userId: testUserId,
        name: 'Daily Burn Venture',
        problem: 'Testing burn caps',
        targetCustomer: 'Operations managers',
        industry: 'FinOps',
      });

      await setCapitalAllocationPlan({
        ventureId: venture.id,
        allocatedCents: 100000, // $1000 total budget
        maxDailyBurnCents: 3000,  // $30/day limit
      });

      // Simulate prior expenses today of $25
      await prisma.financialRecord.create({
        data: {
          ventureId: venture.id,
          type: FinancialRecordType.AI_COMPUTE_COST,
          amountCents: 2500,
          provenance: FinancialProvenance.ACTUAL,
          description: 'LLM queries this morning',
        },
      });

      // Attempting $10 more ($25 + $10 = $35 > $30 limit)
      const auth = await authorizeSpend({
        ventureId: venture.id,
        amountCents: 1000,
        spendCategory: 'AI_COMPUTE',
        description: 'Late afternoon extraction',
      });

      expect(auth.authorized).toBe(false);
      expect(auth.reason).toContain('Daily burn limit exceeded');
    });

    it('calculates burn rate and venture economics correctly', async () => {
      const venture = await createVenture({
        userId: testUserId,
        name: 'Economics Calculation Venture',
        problem: 'Verifying burn rate and profit calculation',
        targetCustomer: 'Founders',
        industry: 'Venture Capital',
        capitalAllocatedCents: 50000,
      });

      // Record revenue of $200
      await prisma.financialRecord.create({
        data: {
          ventureId: venture.id,
          type: FinancialRecordType.REVENUE,
          amountCents: 20000,
          provenance: FinancialProvenance.VERIFIED,
          stripeChargeId: `ch_econ_rev_${Date.now()}`,
          description: 'Customer subscription',
        },
      });

      // Record AI compute cost of $30 today
      await prisma.financialRecord.create({
        data: {
          ventureId: venture.id,
          type: FinancialRecordType.AI_COMPUTE_COST,
          amountCents: 3000,
          provenance: FinancialProvenance.ACTUAL,
          description: 'Autonomous agent runtime',
        },
      });

      const burnRate = await getVentureBurnRate(venture.id);
      expect(burnRate).toBe(3000);

      const econ = await getVentureEconomics(venture.id);
      expect(econ.budget).toBe(50000);
      expect(econ.revenue).toBe(20000);
      expect(econ.burnRate).toBe(3000);
      expect(econ.netProfit).toBe(17000); // $200 - $30 = $170
    });
  });

  // ==========================================================================
  // 3. KERNEL RUNTIME & JEV DECISION LOGGING
  // ==========================================================================
  describe('Kernel Runtime & Telemetry', () => {
    it('enforces venture-level daily spending limit and blocks calls', async () => {
      process.env.VENTURE_DAILY_LLM_BUDGET = '5'; // $5/day max
      const runtime = KernelRuntime.getInstance();

      // Record $6 spend on venture
      runtime.recordSpend(6.0, undefined, 'venture_blocked_1');

      const budgetStatus = runtime.checkBudget(undefined, 'venture_blocked_1');
      expect(budgetStatus.isAllowed).toBe(false);
      expect(budgetStatus.reason).toContain('Venture daily LLM budget reached');

      await expect(
        runtime.call({
          messages: [{ role: 'user', content: 'Generate code for venture' }],
          ventureId: 'venture_blocked_1',
        })
      ).rejects.toThrow(/Venture daily LLM budget reached/);
    });

    it('cascades to procedural fallback when external LLMs are offline', async () => {
      const runtime = KernelRuntime.getInstance();

      const output = await runtime.call({
        messages: [
          { role: 'system', content: 'You are a task generation AI' },
          { role: 'user', content: 'Generate high margin venture task' },
        ],
        jsonMode: true,
      });

      expect(output).toBeDefined();
      expect(output.length).toBeGreaterThan(10);
      const parsed = JSON.parse(output);
      expect(parsed.tasks).toBeDefined();
      expect(Array.isArray(parsed.tasks)).toBe(true);
    });

    it('records decision logs with structured inputs, outputs, and hashes', async () => {
      const runId = `run_${Date.now()}`;
      await recordDecision({
        runId,
        agentId: 'cfo-agent',
        userId: testUserId,
        gateType: 'ledger_verification',
        primitive: 'choice',
        question: 'Is customer invoice #1042 verified on Stripe?',
        answer: { verified: true, chargeId: 'ch_test_123', amountUsd: 49.99 },
        threshold: 0.85,
        inputSummary: 'Invoice reconciliation query for customer #1042',
        latencyMs: 142,
        costUsd: 0.000042,
        actionTaken: 'allowed',
      });

      const logged = await prisma.decisionLog.findFirst({
        where: { runId },
      });

      expect(logged).toBeDefined();
      expect(logged?.gateType).toBe('ledger_verification');
      expect(logged?.agentId).toBe('cfo-agent');
      expect(logged?.actionTaken).toBe('allowed');
      expect(logged?.inputHash).toBeDefined();
      expect((logged?.answer as any)?.verified).toBe(true);
    });
  });
});
