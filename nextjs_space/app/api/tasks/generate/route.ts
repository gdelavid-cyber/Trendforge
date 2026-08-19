export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { callLLM } from '@/lib/pipeline';

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

    const systemPrompt = `You are a task generation AI. For the given topic, generate a money-making task. Output JSON: {"title": string, "description": string, "steps": string[], "difficulty": "ZERO"|"LOW"|"MEDIUM"|"HIGH", "startup_cost": number, "time_to_first_dollar": string, "earnings_low": number, "earnings_high": number, "risk_level": "LOW"|"MEDIUM"|"HIGH", "risk_explanation": string, "mitigation_strategy": string, "pro_tip": string, "category": string}`;
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
        steps: JSON.stringify(parsedTask.steps ?? []),
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
        isTrending: false, // On-demand tasks aren't marked as trending by default
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
