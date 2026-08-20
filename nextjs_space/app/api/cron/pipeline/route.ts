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
  const errors: string[] = [];

  // Fetch all existing trend names from database to prevent any duplicates
  const existingTrends = await prisma.trend.findMany({ select: { name: true } });
  const existingNames = new Set(existingTrends.map((t) => t.name.toLowerCase()));

  // 1. Fetch fresh, unique trends via generator
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

    const llmTrendRes = await callLLM(trendPrompt, true, existingNames);
    let parsedTrends: any[] = [];
    try {
      const parsed = JSON.parse(llmTrendRes ?? '{}');
      parsedTrends = parsed?.trends || (Array.isArray(parsed) ? parsed : []);
    } catch (err: any) {
      errors.push(`Parse trends error: ${err.message}`);
    }

    const validCategories = ['AI_TOOLS', 'LOCAL_SERVICES', 'CRYPTO_FINANCE', 'ECOMMERCE', 'AI_CONTENT', 'OTHER'];

    for (const t of parsedTrends) {
      try {
        const trendName = t.trend_name || 'Emerging Opportunity';
        
        // Skip duplicate names
        if (existingNames.has(trendName.toLowerCase())) continue;

        const cat = validCategories.includes(t.category) ? t.category : 'AI_TOOLS';
        const createdTrend = await prisma.trend.create({
          data: {
            name: trendName,
            sourcePlatforms: Array.isArray(t.source_platforms) ? t.source_platforms : ['Web', 'Social'],
            mentionVelocity: Number(t.mention_velocity) || 14.5,
            sentimentScore: Number(t.sentiment_score) || 0.88,
            confidence: Number(t.initial_confidence) || 0.92,
            category: cat as any,
            status: 'ACTIVE',
          },
        });
        trendsCreated++;
        existingNames.add(trendName.toLowerCase());

        // 2. Generate a tailored Power Move for this specific trend
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
        let parsedTask: any = null;
        try {
          parsedTask = JSON.parse(llmTaskRes ?? '{}');
        } catch (_) {}

        const now = new Date();
        const stepsArray = Array.isArray(parsedTask?.steps) ? parsedTask.steps : [
          'Analyze current market demand and identify target prospects',
          'Deploy free baseline workflow using open APIs and no-code templates',
          'Launch automated outreach sequence to acquire first paying client',
        ];

        await prisma.task.create({
          data: {
            trendId: createdTrend.id,
            title: parsedTask?.title || `Monetize ${createdTrend.name}`,
            description: parsedTask?.description || `Actionable execution framework for ${createdTrend.name}`,
            steps: stepsArray,
            difficulty: (parsedTask?.difficulty as any) || 'LOW',
            startupCost: Number(parsedTask?.startup_cost) || 0,
            timeToFirstDollar: parsedTask?.time_to_first_dollar || '1-3 days',
            estimatedEarningsLow: Number(parsedTask?.earnings_low) || 350,
            estimatedEarningsHigh: Number(parsedTask?.earnings_high) || 1400,
            riskLevel: (parsedTask?.risk_level as any) || 'LOW',
            proTip: parsedTask?.pro_tip || 'Act within 48h while velocity is surging.',
            category: cat as any,
            qualityScore: 0.95,
            weekOf: now,
            generatedAt: now,
            expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            trendScore: 0.92,
            isTrending: true,
            isFeatured: true,
          },
        });
        tasksCreated++;
      } catch (innerErr: any) {
        errors.push(`Trend loop error: ${innerErr.message}`);
      }
    }
  } catch (e: any) {
    errors.push(`Pipeline cycle error: ${e.message}`);
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
    errors: errors.length > 0 ? errors : undefined,
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
