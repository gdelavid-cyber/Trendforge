/**
 * Trendly OS — Autonomous Venture Factory
 * 
 * Automatically generates structured, data-grounded venture initiatives
 * from high-velocity market signals and autonomous opportunity scans.
 * 
 * Initializes:
 * - Structured Venture entity in DISCOVERED stage
 * - Grounded VentureHypothesis with explicit validation criteria
 * - StarNetTask queued for ARCHITECT role to begin demand validation
 */

import { prisma } from '@/lib/prisma';
import { Venture, VentureHypothesis, StarNetTask } from '@prisma/client';
import { createVenture, VentureLifecycleState } from '@/lib/ventures/lifecycle';
import { KernelRuntime } from '@/lib/runtime/kernel';

export interface VentureFactoryOptions {
  userId?: string;
  initialBudgetCents?: number;
  dailyBurnCapCents?: number;
  industry?: string;
}

export interface VentureBlueprint {
  name: string;
  problem: string;
  targetCustomer: string;
  industry: string;
  hypothesisStatement: string;
  validationCriteria: string[];
}

/**
 * Derives a venture blueprint from a query or trend signal.
 */
export async function deriveVentureBlueprint(
  query: string,
  contextData: Record<string, any> = {}
): Promise<VentureBlueprint> {
  const runtime = KernelRuntime.getInstance();

  const prompt = [
    {
      role: 'system' as const,
      content: `You are an elite Venture Architect in Trendly OS.
Given a market trend or opportunity, synthesize a high-margin B2B or consumer venture.
Return JSON with strictly these fields:
{
  "name": "Short Brand/Product Name (e.g. ApexDoc AI)",
  "problem": "Precise painful inefficiency being solved",
  "targetCustomer": "Specific ideal customer profile (e.g. Mid-sized Dental Clinics)",
  "industry": "Industry vertical (e.g. Healthcare / SaaS)",
  "hypothesisStatement": "If we offer X to Y, they will pay $Z because W",
  "validationCriteria": ["3 specific verifiable signals needed before building"]
}`,
    },
    {
      role: 'user' as const,
      content: `Opportunity query: "${query}". Context: ${JSON.stringify(contextData)}`,
    },
  ];

  try {
    const raw = await runtime.call({
      messages: prompt,
      jsonMode: true,
      costThresholdUsd: 0.05,
    });

    const parsed = JSON.parse(raw);
    if (parsed.name && parsed.problem && parsed.targetCustomer) {
      return {
        name: String(parsed.name).trim(),
        problem: String(parsed.problem).trim(),
        targetCustomer: String(parsed.targetCustomer).trim(),
        industry: String(parsed.industry || 'Technology').trim(),
        hypothesisStatement: String(parsed.hypothesisStatement || `Target customers will pay for ${query}`).trim(),
        validationCriteria: Array.isArray(parsed.validationCriteria)
          ? parsed.validationCriteria.map(String)
          : ['5+ qualified leads express acute pain', 'Identified target buyer title', 'Willingness to pay validated'],
      };
    }
  } catch {
    // Graceful deterministic fallback
  }

  // Deterministic blueprint generation
  const cleanQuery = query.replace(/[^\w\s-]/g, '').trim();
  const words = cleanQuery.split(/\s+/);
  const headline = words.slice(0, 3).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

  return {
    name: `${headline} Solutions`,
    problem: `Businesses experiencing high operational drag and manual overhead in ${cleanQuery}`,
    targetCustomer: `SMB Owners and Operations Managers in ${words[0] || 'Modern'} sectors`,
    industry: words[0] ? words[0].charAt(0).toUpperCase() + words[0].slice(1) : 'Enterprise Services',
    hypothesisStatement: `If we deploy automated ${cleanQuery} systems, target operators will pay monthly retainers to eliminate manual hours.`,
    validationCriteria: [
      'At least 3 prospect conversations confirming urgent bottleneck',
      'Demonstrated willingness to pay $500+/mo for automation',
      'Verified lack of dominant modern software incumbent',
    ],
  };
}

/**
 * Spawns a new venture from an active TrendSignal.
 */
export async function createVentureFromSignal(
  signalId: string,
  options: VentureFactoryOptions = {}
): Promise<{
  venture: Venture;
  hypothesis: VentureHypothesis;
  task: StarNetTask;
}> {
  const signal = await prisma.trendSignal.findUnique({
    where: { id: signalId },
  });

  if (!signal) {
    throw new Error(`TrendSignal not found: ${signalId}`);
  }

  // Resolve user
  let userId = options.userId;
  if (!userId) {
    const defaultUser = await prisma.user.findFirst({
      orderBy: { createdAt: 'asc' },
    });
    if (!defaultUser) {
      throw new Error('Cannot spawn venture: No user accounts exist in database.');
    }
    userId = defaultUser.id;
  }

  const blueprint = await deriveVentureBlueprint(signal.query, {
    platform: signal.platform,
    velocity: signal.velocity,
    sentiment: signal.sentiment,
  });

  // 1. Create Venture in DISCOVERED stage
  const venture = await createVenture({
    userId,
    name: blueprint.name,
    problem: blueprint.problem,
    targetCustomer: blueprint.targetCustomer,
    industry: options.industry || blueprint.industry,
    capitalAllocatedCents: options.initialBudgetCents || 50000,
  });

  // 2. Create Initial Hypothesis
  const hypothesis = await prisma.ventureHypothesis.create({
    data: {
      ventureId: venture.id,
      targetCustomer: blueprint.targetCustomer,
      problem: blueprint.problem,
      proposedSolution: blueprint.hypothesisStatement,
      valueProposition: `Eliminates operational drag and manual overhead in ${blueprint.industry}.`,
      businessModel: 'AI_SAAS',
      pricingDescription: '$299-$999/month recurring license',
      acquisitionChannel: 'Direct outbound and organic search',
      fulfillmentMethod: 'Automated platform runtime',
      successCriteria: blueprint.validationCriteria,
      failureCriteria: ['No pilot signups in 30 days', 'Negative unit economics'],
    },
  });

  // 3. Queue Initial StarNetTask for ARCHITECT to validate demand
  const task = await prisma.starNetTask.create({
    data: {
      taskId: `task_arch_${venture.id}_${Date.now()}`,
      ventureId: venture.id,
      taskType: 'DEMAND_VALIDATION',
      payload: {
        agentRole: 'ARCHITECT',
        signalId: signal.id,
        hypothesisId: hypothesis.id,
        query: signal.query,
        targetCustomer: blueprint.targetCustomer,
        problem: blueprint.problem,
      },
      status: 'PENDING',
    },
  });

  // Update signal status
  await prisma.trendSignal.update({
    where: { id: signal.id },
    data: { status: 'PROCESSED' },
  });

  return { venture, hypothesis, task };
}

/**
 * Spawns an autonomous venture directly from a specified problem or opportunity string.
 */
export async function createAutonomousVenture(input: {
  userId: string;
  topicOrOpportunity: string;
  industry?: string;
  budgetCents?: number;
  dailyBurnCapCents?: number;
}): Promise<{
  venture: Venture;
  hypothesis: VentureHypothesis;
  task: StarNetTask;
}> {
  const blueprint = await deriveVentureBlueprint(input.topicOrOpportunity);

  const venture = await createVenture({
    userId: input.userId,
    name: blueprint.name,
    problem: blueprint.problem,
    targetCustomer: blueprint.targetCustomer,
    industry: input.industry || blueprint.industry,
    capitalAllocatedCents: input.budgetCents || 50000,
  });

  const hypothesis = await prisma.ventureHypothesis.create({
    data: {
      ventureId: venture.id,
      targetCustomer: blueprint.targetCustomer,
      problem: blueprint.problem,
      proposedSolution: blueprint.hypothesisStatement,
      valueProposition: `Eliminates operational drag in ${blueprint.industry}.`,
      businessModel: 'AI_SAAS',
      pricingDescription: '$299-$999/month recurring license',
      acquisitionChannel: 'Direct outbound and organic search',
      fulfillmentMethod: 'Automated platform runtime',
      successCriteria: blueprint.validationCriteria,
      failureCriteria: ['No pilot signups in 30 days', 'Negative unit economics'],
    },
  });

  const task = await prisma.starNetTask.create({
    data: {
      taskId: `task_arch_${venture.id}_${Date.now()}`,
      ventureId: venture.id,
      taskType: 'DEMAND_VALIDATION',
      payload: {
        agentRole: 'ARCHITECT',
        hypothesisId: hypothesis.id,
        targetCustomer: blueprint.targetCustomer,
        problem: blueprint.problem,
      },
      status: 'PENDING',
    },
  });

  return { venture, hypothesis, task };
}

/**
 * Batch processes unprocessed active trend signals into newly minted ventures.
 */
export async function batchProcessMarketSignals(limit: number = 3): Promise<{
  processedCount: number;
  ventures: Venture[];
}> {
  const signals = await prisma.trendSignal.findMany({
    where: { status: 'ACTIVE' },
    orderBy: [{ monetizationScore: 'desc' }, { velocity: 'desc' }],
    take: limit,
  });

  const ventures: Venture[] = [];

  for (const signal of signals) {
    try {
      const result = await createVentureFromSignal(signal.id);
      ventures.push(result.venture);
    } catch (err: any) {
      console.error(`[VentureFactory] Failed to process signal ${signal.id}:`, err?.message);
    }
  }

  return {
    processedCount: ventures.length,
    ventures,
  };
}
