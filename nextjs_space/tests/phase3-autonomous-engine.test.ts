/**
 * Phase 3 Test Suite: Autonomous Engine (Ventures & Swarms)
 * 
 * Verifies:
 * 1. Autonomous Venture Factory (signal-to-venture generation & hypothesis formulation)
 * 2. StarNet Swarm Orchestrator (6 specialist roles, task queue, spend tracking)
 * 3. Autonomous Stage Advancer Loop (deterministic advancement & circuit breaker safety)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { VentureLifecycleState, ValidationRecommendation, RiskLevel } from '@prisma/client';
import {
  createVentureFromSignal,
  createAutonomousVenture,
  deriveVentureBlueprint,
} from '@/lib/ventures/factory';
import { StarNetOrchestrator } from '@/lib/swarm/orchestrator';
import {
  evaluateVentureAutonomy,
  runAutonomousLoop,
} from '@/lib/ventures/autonomy';
import { createVenture } from '@/lib/ventures/lifecycle';
import { setCapitalAllocationPlan } from '@/lib/capital/allocation';

describe('Phase 3 Autonomous Engine: Ventures & Swarms', () => {
  let testUserId: string;

  beforeAll(async () => {
    // Ensure test user exists
    let user = await prisma.user.findFirst({
      where: { email: 'operator@trendly.os' },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'operator@trendly.os',
          name: 'Autonomous Swarm Operator',
          role: 'ADMIN',
          passwordHash: '$2a$10$dummyhashforverification1234567890abcdef',
        },
      });
    }
    testUserId = user.id;
  });

  // ==========================================================================
  // 1. AUTONOMOUS VENTURE FACTORY
  // ==========================================================================
  describe('Autonomous Venture Factory', () => {
    it('synthesizes a structured venture blueprint from opportunity query', async () => {
      const blueprint = await deriveVentureBlueprint('Automated AI Medical Billing Reconciliation', {
        platform: 'REDDIT_COMMUNITIES',
        velocity: 92.5,
      });

      expect(blueprint).toBeDefined();
      expect(blueprint.name).toBeDefined();
      expect(blueprint.problem).toBeDefined();
      expect(blueprint.targetCustomer).toBeDefined();
      expect(blueprint.hypothesisStatement).toBeDefined();
      expect(Array.isArray(blueprint.validationCriteria)).toBe(true);
      expect(blueprint.validationCriteria.length).toBeGreaterThan(0);
    });

    it('spawns a new venture from an active TrendSignal with hypothesis and initial task', async () => {
      // Create seed TrendSignal
      const signal = await prisma.trendSignal.create({
        data: {
          query: 'automated fleet route optimization micro saas',
          platform: 'TWITTER_X',
          velocity: 88.0,
          sentiment: 0.72,
          monetizationScore: 94.0,
          status: 'ACTIVE',
        },
      });

      const spawned = await createVentureFromSignal(signal.id, {
        userId: testUserId,
        initialBudgetCents: 60000,
        dailyBurnCapCents: 6000,
      });

      expect(spawned.venture).toBeDefined();
      expect(spawned.venture.lifecycleState).toBe(VentureLifecycleState.DISCOVERED);
      expect(spawned.venture.capitalAllocatedCents).toBe(60000);

      // Verify hypothesis
      expect(spawned.hypothesis).toBeDefined();
      expect(spawned.hypothesis.ventureId).toBe(spawned.venture.id);
      expect(spawned.hypothesis.proposedSolution.length).toBeGreaterThan(10);

      // Verify initial queued ARCHITECT task
      expect(spawned.task).toBeDefined();
      expect(spawned.task.ventureId).toBe(spawned.venture.id);
      expect(spawned.task.taskType).toBe('DEMAND_VALIDATION');
      expect(spawned.task.status).toBe('PENDING');

      // Verify signal status updated to PROCESSED
      const updatedSignal = await prisma.trendSignal.findUnique({
        where: { id: signal.id },
      });
      expect(updatedSignal?.status).toBe('PROCESSED');
    });

    it('creates an autonomous venture directly from a problem brief', async () => {
      const result = await createAutonomousVenture({
        userId: testUserId,
        topicOrOpportunity: 'Automated SOC2 Compliance Evidence Gathering',
        industry: 'Cybersecurity',
        budgetCents: 75000,
      });

      expect(result.venture.id).toBeDefined();
      expect(result.venture.industry).toBe('Cybersecurity');
      expect(result.hypothesis.ventureId).toBe(result.venture.id);
      expect(result.task.taskType).toBe('DEMAND_VALIDATION');
    });
  });

  // ==========================================================================
  // 2. STARNET SWARM ORCHESTRATOR
  // ==========================================================================
  describe('StarNet Swarm Orchestrator', () => {
    const orchestrator = StarNetOrchestrator.getInstance();

    it('queues a task and executes it via SCOUT agent', async () => {
      const task = await orchestrator.queueTask(null, 'SCOUT', 'MARKET_SCAN', {
        query: 'cold storage temperature sensor telemetry',
        platform: 'INDUSTRY_FORUMS',
      });

      expect(task.id).toBeDefined();
      expect(task.status).toBe('PENDING');

      const execution = await orchestrator.executeTask(task.taskId);
      expect(execution.success).toBe(true);
      expect(execution.agentRole).toBe('SCOUT');
      expect(execution.data.scoutedSignalId).toBeDefined();

      // Verify signal was saved in database
      const scouted = await prisma.trendSignal.findUnique({
        where: { id: execution.data.scoutedSignalId },
      });
      expect(scouted).toBeDefined();
      expect(scouted?.query).toBe('cold storage temperature sensor telemetry');
    });

    it('executes ARCHITECT task to generate DemandValidationReport and logs spend', async () => {
      const venture = await createVenture({
        userId: testUserId,
        name: 'Architect Swarm Test',
        problem: 'Restaurants waste 15% inventory due to manual ordering',
        targetCustomer: 'Independent Restaurant Operators',
        industry: 'Hospitality Tech',
      });

      const task = await orchestrator.queueTask(venture.id, 'ARCHITECT', 'DEMAND_VALIDATION', {
        problem: venture.problem,
        targetCustomer: venture.targetCustomer,
      });

      const execution = await orchestrator.executeTask(task.taskId);
      expect(execution.success).toBe(true);
      expect(execution.data.validationReportId).toBeDefined();
      expect(execution.data.recommendation).toBe(ValidationRecommendation.VALIDATE);

      // Verify report in database
      const report = await prisma.demandValidationReport.findUnique({
        where: { id: execution.data.validationReportId },
      });
      expect(report).toBeDefined();
      expect(report?.ventureId).toBe(venture.id);
      expect(report?.recommendation).toBe('VALIDATE');

      // Verify spend logged to AgentSpend table
      const spends = await prisma.agentSpend.findMany({
        where: { ventureId: venture.id },
      });
      expect(spends.length).toBeGreaterThan(0);
      expect(spends.some((s) => s.agentRole === 'ARCHITECT')).toBe(true);
    });

    it('executes BUILDER task to construct VentureOffer', async () => {
      const venture = await createVenture({
        userId: testUserId,
        name: 'Builder Swarm Test',
        problem: 'Lawyers spend 10h/week on contract redaction',
        targetCustomer: 'Solo Practice Attorneys',
        industry: 'LegalTech',
      });

      const task = await orchestrator.queueTask(venture.id, 'BUILDER', 'OFFER_CREATION', {
        title: 'RedactAI Pro License',
        priceCents: 29900,
        tier: 'PROFESSIONAL',
      });

      const execution = await orchestrator.executeTask(task.taskId);
      expect(execution.success).toBe(true);
      expect(execution.data.offerId).toBeDefined();
      expect(execution.data.priceCents).toBe(29900);

      // Verify offer in database
      const offer = await prisma.ventureOffer.findUnique({
        where: { id: execution.data.offerId },
      });
      expect(offer).toBeDefined();
      expect(offer?.title).toBe('RedactAI Pro License');
      expect(offer?.isLive).toBe(true);
    });
  });

  // ==========================================================================
  // 3. AUTONOMOUS STAGE ADVANCER & CIRCUIT BREAKER
  // ==========================================================================
  describe('Autonomous Stage Advancer Loop', () => {
    it('automatically transitions DISCOVERED venture to VALIDATING and queues ARCHITECT', async () => {
      const venture = await createVenture({
        userId: testUserId,
        name: 'Autonomy Discovered Test',
        problem: 'Dental clinics missing after-hours emergency calls',
        targetCustomer: 'Dental Practice Owners',
        industry: 'Healthcare Services',
      });

      expect(venture.lifecycleState).toBe(VentureLifecycleState.DISCOVERED);

      const evaluation = await evaluateVentureAutonomy(venture.id);
      expect(evaluation.advanced).toBe(true);
      expect(evaluation.toState).toBe(VentureLifecycleState.VALIDATING);

      const updated = await prisma.venture.findUnique({ where: { id: venture.id } });
      expect(updated?.lifecycleState).toBe(VentureLifecycleState.VALIDATING);
    });

    it('automatically advances VALIDATING to VALIDATED and queues BUILDER when validation report exists', async () => {
      const venture = await createVenture({
        userId: testUserId,
        name: 'Autonomy Validation Test',
        problem: 'HVAC technicians struggle with field estimate paperwork',
        targetCustomer: 'HVAC Contractors',
        industry: 'Home Services',
      });

      // Move to VALIDATING
      await evaluateVentureAutonomy(venture.id);

      // Seed positive validation report
      await prisma.demandValidationReport.create({
        data: {
          ventureId: venture.id,
          painEvidence: 'Field contractors waste 12 hours weekly on estimates',
          urgencyEvidence: 'Peak summer volume demands immediate tool',
          rationale: 'High willingness to pay verified',
          recommendation: ValidationRecommendation.VALIDATE,
        },
      });

      const evaluation = await evaluateVentureAutonomy(venture.id);
      expect(evaluation.advanced).toBe(true);
      expect(evaluation.toState).toBe(VentureLifecycleState.VALIDATED);
      expect(evaluation.actionsQueued.some((a) => a.includes('BUILDER'))).toBe(true);
    });

    it('circuit breaker triggers: pauses venture and creates ApprovalRequest if daily burn cap is breached', async () => {
      const venture = await createVenture({
        userId: testUserId,
        name: 'Circuit Breaker Burn Test',
        problem: 'Automated test problem',
        targetCustomer: 'Testing ICP',
        industry: 'Testing',
      });

      await setCapitalAllocationPlan({
        ventureId: venture.id,
        allocatedCents: 50000,
        maxDailyBurnCents: 1000, // $10/day limit
      });

      // Advance to VALIDATING
      await evaluateVentureAutonomy(venture.id);

      // Seed spend that exceeds daily burn cap ($15.00 spend on a $10.00 cap)
      await prisma.agentSpend.create({
        data: {
          ventureId: venture.id,
          agentRole: 'BUILDER',
          modelUsed: 'test_provider',
          tokensIn: 10000,
          tokensOut: 5000,
          costCents: 1500, // $15.00
          toolName: 'code_generation',
        },
      });

      const evaluation = await evaluateVentureAutonomy(venture.id);
      expect(evaluation.toState).toBe(VentureLifecycleState.PAUSED);

      // Verify venture is paused
      const updated = await prisma.venture.findUnique({ where: { id: venture.id } });
      expect(updated?.lifecycleState).toBe(VentureLifecycleState.PAUSED);

      // Verify Human Approval Request created
      const approval = await prisma.approvalRequest.findFirst({
        where: { ventureId: venture.id },
        orderBy: { createdAt: 'desc' },
      });
      expect(approval).toBeDefined();
      expect(approval?.riskLevel).toBe(RiskLevel.HIGH);
      expect(approval?.status).toBe('PENDING');
      expect(approval?.proposedAction).toBe('CAPITAL_LIMIT_OVERRIDE');
    });

    it('executes full autonomous loop sweep over active ventures', async () => {
      const loopSummary = await runAutonomousLoop(3);
      expect(loopSummary).toBeDefined();
      expect(loopSummary.evaluatedCount).toBeGreaterThan(0);
      expect(Array.isArray(loopSummary.results)).toBe(true);
    }, 60000);
  });
});
