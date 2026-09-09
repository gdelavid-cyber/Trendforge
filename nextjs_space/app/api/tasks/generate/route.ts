export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import { callLLM } from '@/lib/pipeline';
import { toStructuredStepsJson } from '@/lib/pipeline/steps';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role check: Only premium/pro users can generate custom tasks
    const userRole = (session.user as any)?.role;
    if (userRole === 'FREE') {
      return NextResponse.json({ error: 'Upgrade to Premium or Pro to generate custom tasks' }, { status: 403 });
    }

    const body = await request.json();
    const { topic } = body ?? {};
    if (!topic || typeof topic !== 'string' || topic.trim() === '') {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    // Find or create a trend category placeholder for custom task
    let trend = await prisma.trend.findFirst({
      where: { status: 'ACTIVE' },
    });

    if (!trend) {
      trend = await prisma.trend.create({
        data: {
          name: `Custom Topic: ${topic.slice(0, 50)}`,
          sourcePlatforms: ['UserRequest'],
          mentionVelocity: 5.0,
          sentimentScore: 0.8,
          confidence: 0.8,
          category: 'OTHER',
          status: 'ACTIVE',
        },
      });
    }

    // NOTE: output schema is load-bearing — the parser below reads these exact
    // snake_case keys. Keep them stable; put all conversion craft in the rules.
    const systemPrompt = `You are an elite, practical B2B growth architect and conversion copywriter.
Your goal is to transform a raw topic into a high-margin monetization blueprint that reads like it was written by an industrious human research assistant — not an AI, not a marketing brochure.

Output strictly valid JSON matching this schema:
{"title": string, "description": string, "steps": string[], "difficulty": "ZERO"|"LOW"|"MEDIUM"|"HIGH", "startup_cost": number, "time_to_first_dollar": string, "earnings_low": number, "earnings_high": number, "risk_level": "LOW"|"MEDIUM"|"HIGH", "risk_explanation": string, "mitigation_strategy": string, "pro_tip": string, "category": string}

CRITICAL COPYWRITING RULES (TO EVADE SPAM FILTERS & HUMAN BS-DETECTORS):
1. NO AI CLICHES: Absolutely forbid words/phrases like: "delve", "testament", "optimize", "streamline", "beacon", "in today's digital landscape", "look no further", "revolutionize", "cutting-edge", "game-changer", "moreover", "foster", "synergy", "seamless", "I hope this email finds you well".
2. HUMAN WRITING STYLE: Variable sentence lengths, natural relaxed grammar, peer-to-peer tone. Every step and the description must read like a note jotted down in 2 minutes by someone who already did the homework.
3. THE "PERMISSIONLESS PITCH" PROTOCOL: Do not pitch services directly. Frame the plan around a valuable, specific piece of work or insight already prepared for the buyer based on their exact pain point — 10% of the problem solved for free, upfront.
4. LOW-VOLUME, HIGH-CONVERSION: Design for highly targeted outreach (10-20 customized prospects per day), never mass blasts. Say who to contact and why them specifically.
5. OBJECTION HANDLING: The risk_explanation and mitigation_strategy must address real constraints — budget limits, skepticism toward external vendors, and integration friction.

BUSINESS MODEL MANDATES (TO MAXIMIZE PROFIT):
- Prioritize models with high recurring margins (micro-SaaS, productized consulting, specialized automated retainers).
- Recommend tooling with generous free tiers to keep startup_cost near $0.
- time_to_first_dollar must be realistic but optimized for quick validation (under 14 days).`;
    const userPrompt = `Generate one custom task about: ${topic}. Respond with raw JSON only.`;

    const llmResponse = await callLLM([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], true);

    let parsedTask: any = null;
    try {
      const parsed = JSON.parse(llmResponse ?? '{}');
      // Handle both array wrap and single object styles
      parsedTask = parsed?.tasks?.[0] || parsed;
    } catch (e) {
      return NextResponse.json({ error: 'Failed to parse generated task' }, { status: 500 });
    }

    if (!parsedTask || !parsedTask.title) {
      return NextResponse.json({ error: 'Invalid task format generated' }, { status: 500 });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days expiration

    // Create the task in database
    const task = await prisma.task.create({
      data: {
        trendId: trend.id,
        title: parsedTask.title ?? `Custom ${topic} Task`,
        description: parsedTask.description ?? '',
          steps: toStructuredStepsJson(parsedTask.steps ?? []),
        difficulty: parsedTask.difficulty ?? 'LOW',
        startupCost: parsedTask.startup_cost ?? 0,
        timeToFirstDollar: parsedTask.time_to_first_dollar ?? '1-7 days',
        estimatedEarningsLow: parsedTask.earnings_low ?? 0,
        estimatedEarningsHigh: parsedTask.earnings_high ?? 0,
        riskLevel: parsedTask.risk_level ?? 'LOW',
        riskExplanation: parsedTask.risk_explanation ?? '',
        mitigationStrategy: parsedTask.mitigation_strategy ?? '',
        proTip: parsedTask.pro_tip ?? '',
        category: parsedTask.category ?? 'OTHER',
        qualityScore: 0.9,
        weekOf: now,
        generatedAt: now,
        expiresAt,
        trendScore: 0.85,
        isFeatured: false, // On-demand tasks aren't marked as featured by default
        requiresOptIn: parsedTask.risk_level === 'HIGH',
      },
    });

    return NextResponse.json({
      success: true,
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        difficulty: task.difficulty,
        riskLevel: task.riskLevel,
        startupCost: task.startupCost,
        estimatedEarningsLow: task.estimatedEarningsLow,
        estimatedEarningsHigh: task.estimatedEarningsHigh,
        category: task.category,
      },
    });
  } catch (error: any) {
    console.error('Custom task generation error:', error);
    return NextResponse.json({ error: error?.message ?? 'Failed to generate task' }, { status: 500 });
  }
}
