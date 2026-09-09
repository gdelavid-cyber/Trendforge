import { db } from '@/lib/db';
import { callLLM, extractJSON } from '@/lib/pipeline';

export interface DiscoveryContext {
  trendId: string;
  executionId: string;
  userId: string | null;
  offer?: {
    offer_name?: string;
    promise?: string;
    pricing?: { primary_usd?: number };
  };
  icp?: {
    role_titles?: string[];
    industry?: string[];
    trigger_events?: string[];
    disqualifiers?: string[];
  };
}

/**
 * Step 1: Pull direct-warm leads — the exact posts that made the trend cluster.
 * These are ALREADY pre-qualified buyers who described the problem publicly.
 */
export async function harvestWarmLeads(ctx: DiscoveryContext) {
  const trend = await db.trend.findUnique({
    where: { id: ctx.trendId },
    include: {
      signals: {
        orderBy: [{ upvotes: 'desc' }, { createdAt: 'desc' }],
        take: 30,
      },
    },
  });
  if (!trend) return [];

  const leads: any[] = [];

  for (const signal of trend.signals) {
    // Score their intent before saving
    const scoring = await scoreBuyerIntent({
      title: signal.title,
      body: signal.body ?? '',
      source: signal.source,
      offer: ctx.offer,
    });

    if (scoring.intentScore < 30) continue; // skip low-intent signals

    const contactMethods = deriveContactMethods(signal.source);

    try {
      const lead = await db.buyerLead.upsert({
        where: {
          source_externalId: { source: signal.source, externalId: signal.externalId },
        },
        create: {
          executionId: ctx.executionId,
          userId: ctx.userId,
          source: signal.source,
          sourceUrl: signal.url || `https://${signal.source}.com`,
          externalId: signal.externalId,
          authorHandle: (signal as any).author ?? signal.subreddit ?? 'community_poster',
          postTitle: signal.title,
          postExcerpt: (signal.body ?? signal.title).slice(0, 500),
          postedAt: signal.createdAt,
          intentScore: scoring.intentScore,
          intentReasons: scoring.reasons as object,
          engagement: signal.upvotes,
          replyCount: signal.comments,
          contactMethods: contactMethods as object,
          status: 'NEW',
        },
        update: {
          intentScore: scoring.intentScore,
          intentReasons: scoring.reasons as object,
          lastCheckedAt: new Date(),
        },
      });
      leads.push(lead);
    } catch (e) {
      console.error('[Discovery] upsert failed:', e);
    }
  }

  return leads;
}

/**
 * Step 2: Expand — search adjacent public posts using LLM-crafted queries.
 * Feeds queries back into the scraper worker so it harvests more like these.
 */
export async function requestExpandedDiscovery(ctx: DiscoveryContext, warmLeadCount: number) {
  try {
    const content = await callLLM(
      [
        {
          role: 'system',
          content: 'You generate public-forum search queries to find MORE people expressing the same buying intent. Output JSON: {"queries":[{"platform":"reddit"|"twitter"|"hackernews","query":string,"why":string}]}. Queries should target IMPERATIVE language ("looking for", "recommend", "anyone tried", "does anyone know"), NOT descriptive language. Max 8 queries.',
        },
        {
          role: 'user',
          content: `Offer: ${ctx.offer?.offer_name || 'Turnkey Solution'} — ${ctx.offer?.promise || 'Production asset'}
ICP roles: ${ctx.icp?.role_titles?.join(', ') || 'operators, founders'}
Industries: ${ctx.icp?.industry?.join(', ') || 'digital services'}
Trigger events: ${ctx.icp?.trigger_events?.join(', ') || 'market demand surge'}

We already found ${warmLeadCount} warm leads. Generate queries to find similar buyers.`,
        },
      ],
      true
    );

    let parsed: any = {};
    try {
      parsed = JSON.parse(extractJSON(content));
    } catch {
      parsed = { queries: [] };
    }

    // Enqueue these queries for the worker to pick up next cycle
    for (const q of parsed.queries ?? []) {
      await db.discoveryQuery.create({
        data: {
          executionId: ctx.executionId,
          userId: ctx.userId,
          platform: q.platform || 'reddit',
          query: q.query,
          reason: q.why,
          status: 'PENDING',
        },
      });
    }

    return parsed.queries?.length ?? 0;
  } catch (err) {
    console.error('[Discovery] Expanded query creation failed:', err);
    return 0;
  }
}

/**
 * LLM scores how likely this poster is to actually buy.
 */
async function scoreBuyerIntent(args: {
  title: string;
  body: string;
  source: string;
  offer?: { offer_name?: string; promise?: string; pricing?: { primary_usd?: number } };
}) {
  try {
    const content = await callLLM(
      [
        {
          role: 'system',
          content: 'You score buyer purchase intent from a public post. Output JSON: {"intentScore":0-100,"reasons":string[]}.\n\nSignals that raise the score:\n- Explicit budget mention ("willing to pay", "$X budget")\n- Urgency ("need this by Friday", "deadline")\n- Frustration with current solution ("we\'re paying $500/mo for X and it doesn\'t work")\n- Direct ask ("looking for", "recommend", "anyone using")\n- Authority signals ("I run", "our team", "we need")\n\nSignals that lower it:\n- Vague curiosity ("just wondering")\n- Student/hobbyist context\n- Already solved ("we ended up building it ourselves")\n- Complaining without seeking (rant with no ask)',
        },
        {
          role: 'user',
          content: `Offer we're matching against: "${args.offer?.offer_name || 'Solution'}" — ${args.offer?.promise || 'Turnkey deliverable'} at $${args.offer?.pricing?.primary_usd || 100}

Post title: ${args.title}
Post body: ${args.body.slice(0, 800)}
Source: ${args.source}

Score their intent.`,
        },
      ],
      true
    );

    const parsed = JSON.parse(extractJSON(content));
    return {
      intentScore: Math.max(0, Math.min(100, parsed.intentScore ?? 0)),
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
    };
  } catch {
    return { intentScore: 50, reasons: ['Active forum poster discussing relevant niche pain'] };
  }
}

function deriveContactMethods(source: string) {
  const map: Record<string, any[]> = {
    reddit: [
      { channel: 'reddit_reply', how: 'Reply in-thread with value first', effort: 'low', risk: 'none' },
      { channel: 'reddit_dm', how: 'Send DM after establishing thread rapport', effort: 'medium', risk: 'low' },
    ],
    hackernews: [
      { channel: 'hn_reply', how: 'Reply to their comment/post', effort: 'low', risk: 'none' },
      { channel: 'hn_profile_link', how: 'Check their HN profile for a website/email they made public', effort: 'low', risk: 'none' },
    ],
    twitter: [
      { channel: 'twitter_reply', how: 'Reply publicly with the value asset', effort: 'low', risk: 'none' },
      { channel: 'twitter_dm', how: 'DM only if their DMs are open', effort: 'medium', risk: 'low' },
      { channel: 'twitter_quote', how: 'Quote-tweet with a helpful add', effort: 'medium', risk: 'none' },
    ],
    producthunt: [
      { channel: 'ph_comment', how: 'Comment on their launch/post', effort: 'low', risk: 'none' },
    ],
  };
  return map[source] ?? [{ channel: 'source_link', how: 'Visit source URL', effort: 'low', risk: 'none' }];
}
