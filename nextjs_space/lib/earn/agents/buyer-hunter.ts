import { QualifiedBuyer } from './types';
import { executeSkill } from '@/lib/intelligence/tools/executor';

export function calculateBuyerScore(criteria: {
  budgetLikelihood: number; // 0-25
  painPointMatch: number; // 0-25
  timingSignals: number; // 0-25
  accessibility: number; // 0-25
}): number {
  return criteria.budgetLikelihood + criteria.painPointMatch + criteria.timingSignals + criteria.accessibility;
}

export interface BuyerHuntPending {
  status: 'pending';
  buyers: [];
  retry: true;
  message: 'pending fresh intel — retry';
}

export function pendingBuyerHunt(): BuyerHuntPending {
  return { status: 'pending', buyers: [], retry: true, message: 'pending fresh intel — retry' };
}

function resolveNiche(input?: string | Record<string, any> | unknown): { subreddit: string; keywords: string } {
  if (typeof input === 'string' && input.trim().length > 0) {
    return { subreddit: 'smallbusiness', keywords: input.trim() };
  }
  if (input && typeof input === 'object') {
    const rec = input as Record<string, any>;
    const subreddit = typeof rec.subreddit === 'string' && rec.subreddit.trim() ? rec.subreddit.trim() : 'smallbusiness';
    const keywords =
      typeof rec.keywords === 'string' && rec.keywords.trim()
        ? rec.keywords.trim()
        : typeof rec.niche === 'string' && rec.niche.trim()
          ? rec.niche.trim()
          : 'missed calls, hiring help, lead follow-up';
    return { subreddit, keywords };
  }
  return { subreddit: 'smallbusiness', keywords: 'missed calls, hiring help, lead follow-up' };
}

/**
 * Live-only buyer hunt. Runs the real `scrape_reddit_painpoints` executor and
 * maps verified pain-point signals to buyer prospects backed by source URLs.
 * Returns a pending envelope (never static fake buyers) when the live fetch
 * is empty, blocked, or fails.
 */
export async function huntQualifiedBuyers(
  niche?: string | Record<string, any> | unknown
): Promise<QualifiedBuyer[] | BuyerHuntPending> {
  const { subreddit, keywords } = resolveNiche(niche);

  let exec: Awaited<ReturnType<typeof executeSkill>>;
  try {
    exec = await executeSkill('scrape_reddit_painpoints', { subreddit, keywords, maxPosts: 20 });
  } catch {
    return pendingBuyerHunt();
  }

  if (exec.status !== 'SUCCESS' || !exec.result) return pendingBuyerHunt();

  const painPoints: Array<{
    problem?: string;
    evidence?: string;
    frequencyScore?: number;
    demandLevel?: string;
    suggestedProduct?: string;
  }> = Array.isArray(exec.result.painPoints) ? exec.result.painPoints : [];
  const samplePosts: Array<{ permalink?: string; title?: string }> = Array.isArray(exec.result.samplePosts)
    ? exec.result.samplePosts
    : [];

  if (painPoints.length === 0) return pendingBuyerHunt();

  const buyers: QualifiedBuyer[] = painPoints.slice(0, 5).map((pp, idx) => {
    const sourceUrl = samplePosts[idx]?.permalink || samplePosts[0]?.permalink || '';
    const problem = (pp.problem || pp.evidence || 'Live demand signal').slice(0, 140);
    const evidence = (pp.evidence || pp.problem || '').slice(0, 200);
    const freq = Math.min(Math.max(Number(pp.frequencyScore) || 5, 1), 10);
    const score = Math.round((freq / 10) * 100);
    return {
      id: `live-buyer-${Date.now().toString(36)}-${idx}`,
      name: `Live prospect: ${problem.slice(0, 60)}`,
      organization: `Live signal · r/${subreddit}`,
      category: 'LOCAL_BUSINESS',
      score,
      signals: [
        evidence || problem,
        pp.suggestedProduct ? `Suggested angle: ${pp.suggestedProduct.slice(0, 140)}` : `Demand level: ${pp.demandLevel || 'unknown'}`,
        sourceUrl ? `Source: ${sourceUrl}` : 'Source: live Reddit scrape (see executor output)',
      ],
      contact: {
        decisionMaker: 'Unknown — verify via source thread',
        channel: 'Email',
        address: sourceUrl || 'pending fresh intel — retry',
      },
      recommendedPrice: 'pending fresh intel — retry',
      personalizedHook: `Saw this live thread about "${problem}". Verify the poster via the source link before outreach.`,
      closeProbability: 0,
    };
  });

  // Drop any buyer without a verifiable source URL — never ship sourceless prospects.
  const sourced = buyers.filter((b) => b.contact.address && b.contact.address.startsWith('http'));
  return sourced.length > 0 ? sourced : pendingBuyerHunt();
}
