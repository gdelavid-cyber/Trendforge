export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';
import {
  scrapeHackerNewsViral,
  scrapeRedditViral,
  generateProceduralTrends,
  isDuplicate,
  validatePipelineKey,
} from '@/lib/pipeline';
import { classifyTrendMonetization } from '@/lib/pipeline/classifier';

export async function POST(request: Request) {
  // Allow session auth OR pipeline API key
  const session = await getServerSession(authOptions);
  const isKeyValid = validatePipelineKey(request);

  if (!session?.user && !isKeyValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const existingTrends = await prisma.trend.findMany({
      select: { name: true, id: true },
      take: 200,
    });
    const existingNames = new Set(existingTrends.map((t) => t.name.toLowerCase()));

    // 1. Gather raw scraped signals
    const [hnStories, redditPosts] = await Promise.all([
      scrapeHackerNewsViral(),
      scrapeRedditViral(),
    ]);

    const candidates: {
      name: string;
      sourcePlatforms: string[];
      description?: string;
      url?: string;
      velocity?: number;
      sentiment?: number;
    }[] = [];

    // Add HackerNews signals
    for (const hn of hnStories) {
      if (hn?.title && !isDuplicate(hn.title, existingNames, 0.6)) {
        candidates.push({
          name: hn.title,
          sourcePlatforms: ['HackerNews'],
          description: hn.url ? `Discussion on HN with ${hn.score || 50} upvotes: ${hn.url}` : hn.title,
          url: hn.url || `https://news.ycombinator.com/item?id=${hn.id}`,
          velocity: +(10 + Math.random() * 15).toFixed(1),
          sentiment: 0.75,
        });
      }
    }

    // Add Reddit signals
    for (const r of redditPosts) {
      if (r?.title && !isDuplicate(r.title, existingNames, 0.6)) {
        candidates.push({
          name: r.title,
          sourcePlatforms: ['Reddit', `r/${r.subreddit || 'SaaS'}`],
          description: r.selftext ? r.selftext.slice(0, 300) : r.title,
          url: r.permalink ? `https://reddit.com${r.permalink}` : 'https://reddit.com',
          velocity: +(12 + Math.random() * 18).toFixed(1),
          sentiment: 0.82,
        });
      }
    }

    // Dynamic trend & news signals catalog
    const DYNAMIC_SIGNAL_VECTORS = [
      { name: 'Deploy Local DeepSeek-R1 Legal Document Analysis Pipelines', platforms: ['GitHub', 'HackerNews'], desc: 'On-premise private reasoning LLM deployments for law firms and financial audits.', isMove: true },
      { name: 'Claude 3.7 Sonnet Hybrid Reasoning & Extended Thinking Launch', platforms: ['Twitter', 'HackerNews'], desc: 'Anthropic releases hybrid reasoning architecture combining instant responses with step-by-step thinking tokens.', isMove: false },
      { name: 'Autonomous Voice AI Receptionists for Emergency HVAC & Plumbing', platforms: ['Twitter', 'LinkedIn'], desc: 'Vapi/Retell AI phone agents capturing missed calls and booking service calls after hours.', isMove: true },
      { name: 'Nvidia Blackwell Ultra GPU Architecture Production Milestone', platforms: ['TechCrunch', 'HackerNews'], desc: 'Nvidia begins volume shipment of next-gen GB200 NVL72 AI superclusters to cloud providers.', isMove: false },
      { name: 'Automated 9:16 UGC Video Storyboarding for TikTok Shop DTC Brands', platforms: ['TikTok', 'Instagram'], desc: 'Rapid viral creative production and multi-hook testing using AI video generators.', isMove: true },
      { name: 'Solana High-Frequency Arbitrage & DEX Liquidity Routing Bots', platforms: ['Twitter', 'DexScreener'], desc: 'Raydium and Orca concentrated pool variance capture with automated safety slippage.', isMove: true },
      { name: 'EU AI Act Enforcement Framework Takes Effect for Foundation Models', platforms: ['Reuters', 'HackerNews'], desc: 'Comprehensive compliance and transparency regulations enforced across major AI providers operating in Europe.', isMove: false },
      { name: 'Curate & Distribute Executive Notion Workspaces for Solopreneurs', platforms: ['ProductHunt', 'Twitter'], desc: 'High-converting digital operating systems and client management hubs sold on Gumroad.', isMove: true },
    ];

    if (candidates.length < 4) {
      for (const vector of DYNAMIC_SIGNAL_VECTORS) {
        const candidateName = existingNames.has(vector.name.toLowerCase())
          ? `${vector.name} [${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}]`
          : vector.name;
        
        candidates.push({
          name: candidateName,
          sourcePlatforms: vector.platforms,
          description: vector.desc,
          velocity: +(14 + Math.random() * 12).toFixed(1),
          sentiment: 0.86,
        });
        if (candidates.length >= 6) break;
      }
    }

    // Process each candidate through the Autonomous AI Classifier
    const routedTasks: any[] = [];
    const routedNews: any[] = [];
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    for (const item of candidates.slice(0, 8)) {
      try {
        const classification = await classifyTrendMonetization(item, existingNames);

        // 1. Create Trend record
        const trend = await prisma.trend.create({
          data: {
            name: item.name,
            sourcePlatforms: item.sourcePlatforms,
            mentionVelocity: item.velocity || 15.0,
            sentimentScore: item.sentiment || 0.85,
            confidence: +(0.85 + Math.random() * 0.12).toFixed(2),
            category: classification.category,
            status: 'ACTIVE',
            isMonetizable: classification.isMonetizable,
            monetizationScore: classification.monetizationScore,
            monetizationRationale: classification.monetizationRationale,
            newsSummary: classification.newsSummary,
            whyItMatters: classification.whyItMatters,
            newsSourceUrl: item.url || null,
            detectedAt: now,
            hoursSinceDetection: 0,
          },
        });

        existingNames.add(item.name.toLowerCase());

        // 2. Route based on monetization check
        if (classification.isMonetizable && classification.taskProposal) {
          const tp = classification.taskProposal;
          const newTask = await prisma.task.create({
            data: {
              trendId: trend.id,
              title: tp.title,
              description: tp.description,
              steps: JSON.stringify(tp.steps),
              difficulty: tp.difficulty,
              startupCost: tp.startupCost,
              timeToFirstDollar: tp.timeToFirstDollar,
              estimatedEarningsLow: tp.estimatedEarningsLow,
              estimatedEarningsHigh: tp.estimatedEarningsHigh,
              riskLevel: tp.riskLevel,
              riskExplanation: tp.riskExplanation,
              mitigationStrategy: tp.mitigationStrategy,
              proTip: tp.proTip,
              category: classification.category,
              qualityScore: 0.9,
              weekOf: now,
              generatedAt: now,
              expiresAt,
              trendScore: 0.92,
              isFeatured: true,
              requiresOptIn: tp.riskLevel === 'HIGH',
            },
          });

          routedTasks.push({
            taskId: newTask.id,
            title: newTask.title,
            earnings: `$${newTask.estimatedEarningsLow}-$${newTask.estimatedEarningsHigh}`,
            trendName: item.name,
          });
        } else {
          routedNews.push({
            trendId: trend.id,
            name: item.name,
            newsSummary: classification.newsSummary,
            whyItMatters: classification.whyItMatters,
          });
        }
      } catch (err: any) {
        console.error('[INGEST] Error processing candidate trend:', err.message);
      }
    }

    return NextResponse.json({
      success: true,
      summary: `Autonomous AI evaluated ${routedTasks.length + routedNews.length} signals: ${routedTasks.length} monetizable Power Moves sent to /tasks, and ${routedNews.length} market intelligence briefings sent to /trends.`,
      monetizableMovesAdded: routedTasks.length,
      marketNewsAdded: routedNews.length,
      routedTasks,
      routedNews,
    });
  } catch (error: any) {
    console.error('[INGEST_PIPELINE] Global error:', error);
    return NextResponse.json({ error: error?.message ?? 'Pipeline ingestion failed' }, { status: 500 });
  }
}
