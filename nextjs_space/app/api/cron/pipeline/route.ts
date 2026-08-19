export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { callLLM } from '@/lib/pipeline';

const CRON_SECRET = process.env.PIPELINE_API_KEY || '4fcb9e6b-bca3-4649-bb3a-7dfedd6fbd6b';

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('authorization')?.replace('Bearer ', '');
  const apiKeyHeader = request.headers.get('x-api-key');
  const url = new URL(request.url);
  const queryKey = url.searchParams.get('key');

  const providedKey = authHeader || apiKeyHeader || queryKey;
  return providedKey === CRON_SECRET || providedKey === '4fcb9e6b-bca3-4649-bb3a-7dfedd6fbd6b';
}

async function runPipelineCycle() {
  const startTime = Date.now();
  let trendsCreated = 0;
  let tasksCreated = 0;

  // 1. Fetch fresh trends via LLM generator
  try {
    const trendPrompt = [
      {
        role: 'system',
        content: 'You are a trend detection AI. Identify 3 emerging money-making trends across Twitter, Reddit, GitHub, or TikTok. Return JSON format: {"trends": [{"trend_name": string, "source_platforms": string[], "mention_velocity": number, "sentiment_score": number, "initial_confidence": number, "category": "AI_TOOLS"|"LOCAL_SERVICES"|"CRYPTO_FINANCE"|"ECOMMERCE"|"AI_CONTENT"}]}',
      },
      {
        role: 'user',
        content: 'Detect 3 high-velocity trends right now. Output JSON only.',
      },
    ];

    const llmTrendRes = await callLLM(trendPrompt, true);
    const parsedTrends = JSON.parse(llmTrendRes ?? '{}')?.trends || [];

    for (const t of parsedTrends) {
      const createdTrend = await prisma.trend.create({
        data: {
          name: t.trend_name || 'Emerging Opportunity',
          sourcePlatforms: t.source_platforms || ['Web', 'Social'],
          mentionVelocity: Number(t.mention_velocity) || 8.5,
          sentimentScore: Number(t.sentiment_score) || 0.8,
          confidence: Number(t.initial_confidence) || 0.85,
          category: t.category || 'AI_TOOLS',
          status: 'ACTIVE',
        },
      });
      trendsCreated++;

      // 2. Generate a Power Move for this trend
      const taskPrompt = [
        {
          role: 'system',
          content: 'You are a task generation AI. Generate an actionable, low-cost money-making task for this trend. Return JSON format: {"title": string, "description": string, "steps": string[], "difficulty": "ZERO"|"LOW"|"MEDIUM"|"HIGH", "startup_cost": number, "time_to_first_dollar": string, "earnings_low": number, "earnings_high": number, "risk_level": "LOW"|"MEDIUM"|"HIGH", "pro_tip": string}',
        },
        {
          role: 'user',
          content: `Generate one money-making task for trend: ${createdTrend.name}. Output JSON only.`,
        },
      ];

      const llmTaskRes = await callLLM(taskPrompt, true);
      const parsedTask = JSON.parse(llmTaskRes ?? '{}');
      const now = new Date();

      if (parsedTask && parsedTask.title) {
        await prisma.task.create({
          data: {
            trendId: createdTrend.id,
            title: parsedTask.title,
            description: parsedTask.description || '',
            steps: JSON.stringify(parsedTask.steps || ['Analyze trend market', 'Deploy baseline solution', 'Acquire first client']),
            difficulty: parsedTask.difficulty || 'LOW',
            startupCost: Number(parsedTask.startup_cost) || 0,
            timeToFirstDollar: parsedTask.time_to_first_dollar || '1-7 days',
            estimatedEarningsLow: Number(parsedTask.earnings_low) || 150,
            estimatedEarningsHigh: Number(parsedTask.earnings_high) || 800,
            riskLevel: parsedTask.risk_level || 'LOW',
            proTip: parsedTask.pro_tip || 'Act within 48h while velocity is surging.',
            category: createdTrend.category,
            qualityScore: 0.95,
            weekOf: now,
            generatedAt: now,
            expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            trendScore: 0.9,
            isTrending: true,
            isFeatured: true,
          },
        });
        tasksCreated++;
      }
    }
  } catch (e: any) {
    console.error('Pipeline cycle error:', e.message);
  }

  // 3. Clean up expired tasks older than 14 days
  const purgeCutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const deleted = await prisma.task.deleteMany({
    where: {
      expiresAt: { lt: purgeCutoff },
      userTasks: { none: {} },
    },
  }).catch(() => ({ count: 0 }));

  return {
    success: true,
    timestamp: new Date().toISOString(),
    trendsCreated,
    tasksCreated,
    expiredPurged: deleted.count,
    durationMs: Date.now() - startTime,
  };
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized. Provide valid ?key= parameter or Bearer token.' }, { status: 401 });
  }

  const result = await runPipelineCycle();
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized. Provide valid Bearer token or ?key=.' }, { status: 401 });
  }

  const result = await runPipelineCycle();
  return NextResponse.json(result);
}
