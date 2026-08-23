export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validatePipelineKey, callLLM } from '@/lib/pipeline';
import { redis } from '@/lib/redis';

export async function POST(request: Request) {
  if (!validatePipelineKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get latest trends for pipeline input
    const trends = await prisma.trend.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { detectedAt: 'desc' },
      take: 10,
    });

    if ((trends?.length ?? 0) === 0) {
      return NextResponse.json({ error: 'No active trends to process' }, { status: 400 });
    }

    const trendData = JSON.stringify(trends.map((t: any) => ({
      name: t.name, platforms: t.sourcePlatforms, velocity: t.mentionVelocity,
      sentiment: t.sentimentScore, confidence: t.confidence,
    })));

    // Stage 1: Extract
    const stage1 = await callLLM([
      { role: 'system', content: 'You are a trend detection AI. Given scraped data (mentions, velocity, sentiment), extract all potential money-making trends. Output JSON: {"trends": [{"trend_name": string, "source_platforms": string[], "mention_velocity": number, "sentiment_score": number, "initial_confidence": number}]}' },
      { role: 'user', content: `Analyze these trends and extract money-making opportunities:\n${trendData}\nRespond with raw JSON only.` },
    ], true);

    // Stage 4: Generate Tasks (generate 50 tasks matching requested mix)
    const stage4 = await callLLM([
      { role: 'system', content: 'You are a task generation AI. For the given trends, generate 50 money-making tasks (15 Zero cost, 15 Low, 10 Medium, 10 High difficulty). Output JSON: {"tasks": [{"title": string, "description": string, "steps": string[], "difficulty": "ZERO"|"LOW"|"MEDIUM"|"HIGH", "startup_cost": number, "time_to_first_dollar": string, "earnings_low": number, "earnings_high": number, "risk_level": "LOW"|"MEDIUM"|"HIGH", "risk_explanation": string, "mitigation_strategy": string, "pro_tip": string, "category": string}]}' },
      { role: 'user', content: `Generate 50 executable tasks from these trend signals:\n${stage1}\nRespond with raw JSON only.` },
    ], true);

    let tasks: any[] = [];
    try { tasks = JSON.parse(stage4 ?? '{}')?.tasks ?? []; } catch {}

    // Save tasks
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    let saved = 0;
    for (const t of tasks) {
      try {
        const trend = trends.find((tr: any) => tr.id === t?.trendId) || trends[0];
        if (!trend) continue;

        // Compute trendScore: (0.4 * trend.confidence) + (0.3 * trend.mentionVelocity) + (0.2 * trend.sentiment) + (0.1 * (1 / (trend.hoursSinceDetection || 1)))
        const confidence = trend.confidence ?? 0;
        const velocity = trend.mentionVelocity ?? 0;
        const sentiment = trend.sentimentScore ?? 0;
        const hours = trend.hoursSinceDetection ?? 0;
        const trendScore = (0.4 * confidence) + (0.3 * velocity) + (0.2 * sentiment) + (0.1 * (1 / (hours || 1)));
        const isTrending = trendScore > 0.8;

        const newTask = await prisma.task.create({
          data: {
            trendId: trend.id,
            title: t?.title ?? 'Untitled',
            description: t?.description ?? '',
            steps: JSON.stringify(t?.steps ?? []),
            difficulty: t?.difficulty ?? 'LOW',
            startupCost: t?.startup_cost ?? 0,
            timeToFirstDollar: t?.time_to_first_dollar ?? '1-7 days',
            estimatedEarningsLow: t?.earnings_low ?? 0,
            estimatedEarningsHigh: t?.earnings_high ?? 0,
            riskLevel: t?.risk_level ?? 'LOW',
            riskExplanation: t?.risk_explanation ?? '',
            mitigationStrategy: t?.mitigation_strategy ?? '',
            proTip: t?.pro_tip ?? '',
            category: t?.category ?? 'OTHER',
            qualityScore: 0.8,
            weekOf: now,
            generatedAt: now,
            expiresAt,
            trendScore,
            isFeatured: isTrending,
            requiresOptIn: t?.risk_level === 'HIGH',
          },
        });

        if (isTrending) {
          // Publish real-time notification to Redis
          try {
            await redis.publish('trending-tasks', JSON.stringify({
              type: 'NEW_TRENDING',
              task: {
                id: newTask.id,
                title: newTask.title,
                description: newTask.description,
                difficulty: newTask.difficulty,
                riskLevel: newTask.riskLevel,
                startupCost: newTask.startupCost,
                estimatedEarningsLow: newTask.estimatedEarningsLow,
                estimatedEarningsHigh: newTask.estimatedEarningsHigh,
                timeToFirstDollar: newTask.timeToFirstDollar,
                category: newTask.category,
                trendScore: newTask.trendScore,
                isFeatured: isTrending,
                generatedAt: now.toISOString(),
                expiresAt: expiresAt.toISOString(),
              }
            }));
          } catch (redisErr: any) {
            console.error('Redis publish error:', redisErr.message);
          }
        }

        saved++;
      } catch (e: any) { console.error('Save task error:', e?.message); }
    }

    // Create weekly digest
    await prisma.weeklyDigest.create({
      data: {
        weekOf: now,
        tasks: JSON.stringify(tasks.map((t: any) => ({ title: t?.title, difficulty: t?.difficulty }))),
        trendSummary: `Pipeline generated ${saved} tasks from ${trends?.length} active trends.`,
      },
    });

    return NextResponse.json({ success: true, tasksGenerated: saved });
  } catch (error: any) {
    console.error('Pipeline run error:', error);
    return NextResponse.json({ error: error?.message ?? 'Pipeline failed' }, { status: 500 });
  }
}
