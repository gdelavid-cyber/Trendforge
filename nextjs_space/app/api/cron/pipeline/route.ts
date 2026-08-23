export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  callLLM,
  scrapeHackerNewsViral,
  scrapeRedditViral,
  isDuplicate,
  calculateSimilarity,
} from '@/lib/pipeline';

const CRON_SECRET = process.env.PIPELINE_API_KEY;

function checkCronAuth(request: Request): { authorized: boolean; error?: string; status?: number } {
  if (!CRON_SECRET) {
    return { authorized: false, error: 'CRON auth not configured', status: 500 };
  }

  const authHeader = request.headers.get('authorization')?.replace('Bearer ', '');
  const apiKeyHeader = request.headers.get('x-api-key');

  const providedKey = authHeader || apiKeyHeader;
  if (providedKey !== CRON_SECRET) {
    return { authorized: false, error: 'Unauthorized pipeline invocation', status: 401 };
  }

  return { authorized: true };
}


async function runPipelineCycle() {
  const startTime = Date.now();
  let trendsCreated = 0;
  let tasksCreated = 0;
  const errors: string[] = [];

  // 1. Fetch all existing trend names and task titles from database
  const [existingTrends, existingTasks] = await Promise.all([
    prisma.trend.findMany({ select: { id: true, name: true } }),
    prisma.task.findMany({ select: { id: true, title: true } }),
  ]);

  const existingTrendNames = new Set(existingTrends.map((t) => t.name.toLowerCase()));
  const existingTaskTitles = new Set(existingTasks.map((t) => t.title.toLowerCase()));

  // 2. Fetch live viral content from HackerNews and Reddit
  let liveTrends: any[] = [];

  try {
    const [hnStories, redditPosts] = await Promise.all([
      scrapeHackerNewsViral(),
      scrapeRedditViral(),
    ]);

    // Convert high-upvote HackerNews stories into trends
    for (const story of hnStories) {
      if (liveTrends.length >= 2) break;
      const title = story.title?.trim();
      if (!title || isDuplicate(title, existingTrendNames, 0.5)) continue;

      liveTrends.push({
        trend_name: title,
        source_platforms: ['HackerNews', 'GitHub'],
        mention_velocity: +(story.score ? story.score / 10 : 15).toFixed(1),
        sentiment_score: 0.88,
        initial_confidence: 0.92,
        category: 'AI_TOOLS',
      });
      existingTrendNames.add(title.toLowerCase());
    }

    // Convert top Reddit pain points into trends
    for (const post of redditPosts) {
      if (liveTrends.length >= 4) break;
      const title = post.title?.trim();
      if (!title || isDuplicate(title, existingTrendNames, 0.5)) continue;

      liveTrends.push({
        trend_name: title,
        source_platforms: ['Reddit', 'ProductHunt'],
        mention_velocity: +(post.score ? post.score / 5 : 12).toFixed(1),
        sentiment_score: 0.85,
        initial_confidence: 0.9,
        category: 'AI_TOOLS',
      });
      existingTrendNames.add(title.toLowerCase());
    }
  } catch (err: any) {
    errors.push(`Live scraper warning: ${err.message}`);
  }

  // 3. If live scrapers yielded fewer than 3, complement with procedural blueprints
  try {
    const trendPrompt = [
      {
        role: 'system',
        content:
          'You are a trend detection AI. Identify emerging money-making trends. Return JSON: {"trends": [{"trend_name": string, "source_platforms": string[], "mention_velocity": number, "sentiment_score": number, "initial_confidence": number, "category": "AI_TOOLS"|"LOCAL_SERVICES"|"CRYPTO_FINANCE"|"ECOMMERCE"|"AI_CONTENT"}]}',
      },
      { role: 'user', content: 'Detect high-velocity trends. Output JSON only.' },
    ];

    const llmTrendRes = await callLLM(trendPrompt, true, existingTrendNames);
    const parsed = JSON.parse(llmTrendRes ?? '{}');
    const procedural = parsed?.trends || (Array.isArray(parsed) ? parsed : []);
    
    for (const p of procedural) {
      if (!isDuplicate(p.trend_name, existingTrendNames, 0.55)) {
        liveTrends.push(p);
        existingTrendNames.add(p.trend_name.toLowerCase());
      }
    }
  } catch (err: any) {
    errors.push(`Trend generation error: ${err.message}`);
  }

  const validCategories = ['AI_TOOLS', 'LOCAL_SERVICES', 'CRYPTO_FINANCE', 'ECOMMERCE', 'AI_CONTENT', 'OTHER'];

  // 4. Ingest unique trends into database
  const createdTrendRecords: any[] = [];
  for (const t of liveTrends.slice(0, 3)) {
    try {
      const trendName = t.trend_name || 'Emerging Market Vector';
      const cat = validCategories.includes(t.category) ? t.category : 'AI_TOOLS';

      const newTrend = await prisma.trend.create({
        data: {
          name: trendName,
          category: cat as any,
          sourcePlatforms: Array.isArray(t.source_platforms) ? t.source_platforms : ['Twitter', 'Reddit'],
          mentionVelocity: Number(t.mention_velocity) || 14.5,
          sentimentScore: Number(t.sentiment_score) || 0.85,
          confidence: Number(t.initial_confidence) || 0.9,
          status: 'ACTIVE',
        },
      });

      createdTrendRecords.push(newTrend);
      trendsCreated++;
    } catch (e: any) {
      errors.push(`Failed to save trend "${t?.trend_name}": ${e.message}`);
    }
  }

  // 5. Generate matching high-yield Power Move task for each new trend
  for (const trend of createdTrendRecords) {
    try {
      const taskPrompt = [
        {
          role: 'system',
          content:
            'You are a task generation AI. For the given trend, formulate a step-by-step money-making task. Return JSON: {"title": string, "description": string, "steps": string[], "difficulty": "ZERO"|"LOW"|"MEDIUM"|"HIGH", "startup_cost": number, "time_to_first_dollar": string, "earnings_low": number, "earnings_high": number, "risk_level": "LOW"|"MEDIUM"|"HIGH", "risk_explanation": string, "mitigation_strategy": string, "pro_tip": string, "category": string}',
        },
        { role: 'user', content: `Generate one money-making task for trend: ${trend.name}. Output JSON only.` },
      ];

      const llmTaskRes = await callLLM(taskPrompt, true);
      const parsedTask = JSON.parse(llmTaskRes ?? '{}');

      let taskTitle = parsedTask.title || `Monetize ${trend.name}`;

      // Check task duplicate
      if (isDuplicate(taskTitle, existingTaskTitles, 0.6)) {
        taskTitle = `${taskTitle} (Strategy ${Math.floor(Math.random() * 90 + 10)})`;
      }

      await prisma.task.create({
        data: {
          title: taskTitle,
          description: parsedTask.description || `Step-by-step blueprint to monetize ${trend.name}.`,
          category: trend.category,
          steps: Array.isArray(parsedTask.steps) && parsedTask.steps.length > 0 ? parsedTask.steps : ['Identify demand', 'Deploy solution', 'Acquire clients'],
          difficulty: ['ZERO', 'LOW', 'MEDIUM', 'HIGH'].includes(parsedTask.difficulty) ? parsedTask.difficulty : 'LOW',
          startupCost: typeof parsedTask.startup_cost === 'number' ? parsedTask.startup_cost : 0,
          timeToFirstDollar: parsedTask.time_to_first_dollar || '1-3 days',
          estimatedEarningsLow: typeof parsedTask.earnings_low === 'number' ? parsedTask.earnings_low : 350,
          estimatedEarningsHigh: typeof parsedTask.earnings_high === 'number' ? parsedTask.earnings_high : 1500,
          riskLevel: ['LOW', 'MEDIUM', 'HIGH'].includes(parsedTask.risk_level) ? parsedTask.risk_level : 'LOW',
          riskExplanation: parsedTask.risk_explanation || 'Low initial capital needed.',
          mitigationStrategy: parsedTask.mitigation_strategy || 'Test with free pilot.',
          proTip: parsedTask.pro_tip || 'Focus on direct outreach.',
          trendId: trend.id,
          isFeatured: tasksCreated === 0,
        },
      });

      existingTaskTitles.add(taskTitle.toLowerCase());
      tasksCreated++;
    } catch (e: any) {
      errors.push(`Failed to generate task for "${trend.name}": ${e.message}`);
    }
  }

  const durationMs = Date.now() - startTime;

  // Log execution
  await prisma.trendIngestionLog.create({
    data: {
      source: 'LIVE_MULTI_SOURCE_SCRAPER',
      status: errors.length > 0 && trendsCreated === 0 ? 'FAILED' : 'SUCCESS',
      recordsIngested: trendsCreated,
      errorMessage: errors.length > 0 ? errors.join('; ') : null,
      durationMs,
    },
  });

  return {
    success: true,
    trendsCreated,
    tasksCreated,
    durationMs,
    errors,
  };
}

export async function GET(request: Request) {
  const auth = checkCronAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const result = await runPipelineCycle();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[CRON_PIPELINE_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Pipeline cycle failure' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
