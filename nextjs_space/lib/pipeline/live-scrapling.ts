import { db } from '@/lib/db';
import { TrendCategory } from '@prisma/client';

export interface ScrapedItem {
  source: 'HackerNews' | 'GitHub' | 'Reddit' | 'Web';
  externalId: string;
  title: string;
  url?: string;
  body?: string;
  score: number;
  comments: number;
}

/**
 * Autonomous real-time scraper running directly in Next.js serverless/node runtime.
 * Harvests live signals from HackerNews and GitHub trending, clusters them into
 * monetizable trends, and provisions fresh tasks.
 */
export async function harvestLiveSignalsAndTasks(): Promise<{
  signalsHarvested: number;
  trendsCreated: number;
  tasksCreated: number;
  freshTasks: any[];
}> {
  const items: ScrapedItem[] = [];

  // 1. Harvest Hacker News top stories + Show HN launches
  try {
    const topRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', { cache: 'no-store' });
    if (topRes.ok) {
      const ids: number[] = (await topRes.json()).slice(0, 15);
      const hnStories = await Promise.all(
        ids.map(async (id) => {
          try {
            const r = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, { cache: 'no-store' });
            return r.ok ? await r.json() : null;
          } catch {
            return null;
          }
        })
      );

      for (const s of hnStories) {
        if (!s || !s.title || (s.score || 0) < 10) continue;
        items.push({
          source: 'HackerNews',
          externalId: `hn_${s.id}`,
          title: s.title,
          url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
          body: s.text || `Hacker News discussion with ${s.score || 0} points and ${s.descendants || 0} comments.`,
          score: s.score || 0,
          comments: s.descendants || 0,
        });
      }
    }
  } catch (err) {
    console.warn('[LiveScrapling] HN harvest warning:', err);
  }

  // 2. Harvest GitHub fast-growing AI / SaaS repositories
  try {
    const ghRes = await fetch(
      'https://api.github.com/search/repositories?q=stars:>50+pushed:>2026-09-01&sort=updated&order=desc&per_page=10',
      {
        headers: { 'User-Agent': 'TrendlyLiveScrapling/2.0' },
        cache: 'no-store',
      }
    );
    if (ghRes.ok) {
      const ghData = await ghRes.json();
      for (const repo of ghData.items || []) {
        if (!repo.name || !repo.description) continue;
        items.push({
          source: 'GitHub',
          externalId: `gh_${repo.id}`,
          title: `${repo.name}: ${repo.description.slice(0, 100)}`,
          url: repo.html_url,
          body: repo.description,
          score: repo.stargazers_count || 0,
          comments: repo.open_issues_count || 0,
        });
      }
    }
  } catch (err) {
    console.warn('[LiveScrapling] GitHub harvest warning:', err);
  }

  let signalsHarvested = 0;
  let trendsCreated = 0;
  let tasksCreated = 0;
  const createdTaskIds: string[] = [];

  // 3. Ingest signals into RawSignal and generate active Trends + Tasks
  for (const item of items) {
    try {
      // Upsert raw signal
      const signal = await db.rawSignal.upsert({
        where: {
          source_externalId: { source: item.source, externalId: item.externalId },
        },
        create: {
          source: item.source,
          externalId: item.externalId,
          title: item.title,
          url: item.url,
          body: item.body,
          score: item.score,
          upvotes: item.score,
          comments: item.comments,
          velocity: Math.max(1, item.comments * 2 + item.score / 10),
          processed: true,
        },
        update: {
          score: item.score,
          upvotes: item.score,
          comments: item.comments,
        },
      });
      signalsHarvested++;

      // Check if a trend already exists for this topic
      const cleanTitle = item.title
        .replace(/Show HN:s*/i, '')
        .replace(/Ask HN:s*/i, '')
        .trim();

      const existingTrend = await db.trend.findFirst({
        where: {
          OR: [
            { name: { contains: cleanTitle.slice(0, 30), mode: 'insensitive' } },
            { newsSourceUrl: item.url },
          ],
        },
      });

      let trend = existingTrend;

      if (!trend) {
        // Categorize based on keywords
        let category: TrendCategory = 'OTHER';
        const lower = cleanTitle.toLowerCase();
        if (lower.includes('ai') || lower.includes('llm') || lower.includes('gpt') || lower.includes('agent')) {
          category = 'AI_TOOLS';
        } else if (lower.includes('saas') || lower.includes('b2b') || lower.includes('billing') || lower.includes('api')) {
          category = 'AGENT_ECONOMY';
        } else if (lower.includes('shop') || lower.includes('store') || lower.includes('commerce')) {
          category = 'ECOMMERCE';
        } else if (lower.includes('course') || lower.includes('learn') || lower.includes('teach')) {
          category = 'EDUCATION';
        }

        trend = await db.trend.create({
          data: {
            name: cleanTitle.slice(0, 120),
            sourcePlatforms: [item.source],
            mentionVelocity: Math.min(100, Math.max(10, item.score / 5)),
            confidence: 0.9,
            category,
            status: 'ACTIVE',
            isMonetizable: true,
            monetizationScore: 0.88,
            newsSummary: item.body || `Surging interest on ${item.source} with ${item.score} upvotes.`,
            whyItMatters: `Public demand and engagement signal rapid monetization window for turnkey tools or service integration.`,
            newsSourceUrl: item.url,
            detectedAt: new Date(),
          },
        });
        trendsCreated++;
      }

      // Link signal to trend
      if (trend && !signal.themeId) {
        await db.rawSignal.update({
          where: { id: signal.id },
          data: { themeId: trend.id },
        });
      }

      // Check if a task exists for this trend
      const existingTask = await db.task.findFirst({
        where: { trendId: trend.id },
      });

      if (!existingTask) {
        const estLow = 450 + Math.floor(Math.random() * 200);
        const estHigh = 1600 + Math.floor(Math.random() * 800);

        const newTask = await db.task.create({
          data: {
            trendId: trend.id,
            title: `Monetize ${trend.name.slice(0, 80)}`,
            category: trend.category,
            description: `High-intent monetization blueprint capitalizing on ${trend.name}. Turn immediate interest into closed revenue.`,
            difficulty: 'LOW',
            timeToFirstDollar: '24-48 hours',
            estimatedEarningsLow: estLow,
            estimatedEarningsHigh: estHigh,
            startupCost: 0,
            status: 'PENDING',
            trendScore: 92 + Math.floor(Math.random() * 6),
            steps: [
              `Review pre-qualified buyer discussions on ${item.source}`,
              `Position solution addressing the core pain point (${cleanTitle.slice(0, 50)})`,
              `Deploy customized outreach pitch to high-intent respondents`,
              `Close deals directly and collect 100% margin`,
            ],
          },
        });
        tasksCreated++;
        createdTaskIds.push(newTask.id);
      }
    } catch (e) {
      console.error('[LiveScrapling] Signal/Trend creation error:', e);
    }
  }

  // 4. Archive old stale pending tasks older than 72 hours so they don't block fresh opportunities
  try {
    const oldCutoff = new Date(Date.now() - 72 * 3600_000);
    await db.task.updateMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: oldCutoff },
      },
      data: {
        status: 'ARCHIVED',
      },
    });
  } catch (err) {
    console.warn('[LiveScrapling] Task cleanup warning:', err);
  }

  // 5. Fetch freshest tasks
  const freshTasks = await db.task.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    take: 6,
    include: {
      trend: {
        select: {
          id: true,
          name: true,
          category: true,
        },
      },
    },
  });

  return {
    signalsHarvested,
    trendsCreated,
    tasksCreated,
    freshTasks,
  };
}
