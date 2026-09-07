import { TrendScoutOpportunity } from './types';
import { prisma } from '@/lib/core/db';

export function calculateMoneyProbability(factors: {
  searchGrowth: number; // 0-100
  socialVelocity: number; // 0-100
  buyerIntent: number; // 0-100
  competitionScore: number; // 0-100 (lower competition = higher score)
  aiExecutability: number; // 0-100
  priceViability: number; // 0-100
}): number {
  const score =
    factors.searchGrowth * 0.20 +
    factors.socialVelocity * 0.15 +
    factors.buyerIntent * 0.25 +
    factors.competitionScore * 0.15 +
    factors.aiExecutability * 0.15 +
    factors.priceViability * 0.10;
  return Math.round(score);
}

function clamp(n: number, min = 0, max = 100): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/**
 * Live-only trend scout. Reads monetizable trends from the database and maps
 * real columns (mentionVelocity, category, whyItMatters, newsSummary) to
 * opportunities. Returns [] when the DB is empty — callers surface
 * `pending fresh intel — retry` instead of curated fakes.
 */
export async function getTopScoutedOpportunities(): Promise<TrendScoutOpportunity[]> {
  let trends: Array<{
    id: string;
    name: string;
    category: string;
    mentionVelocity: number;
    newsSummary: string | null;
    whyItMatters: string | null;
  }> = [];
  try {
    trends = await prisma.trend.findMany({
      where: { isMonetizable: true },
      orderBy: { detectedAt: 'desc' },
      take: 5,
      select: { id: true, name: true, category: true, mentionVelocity: true, newsSummary: true, whyItMatters: true },
    });
  } catch {
    return [];
  }

  if (!trends || trends.length === 0) return [];

  return trends.slice(0, 3).map((t) => {
    const velocity = clamp(t.mentionVelocity || 0);
    const factors = {
      searchGrowth: velocity,
      socialVelocity: velocity,
      buyerIntent: velocity,
      competitionScore: 50,
      aiExecutability: 50,
      priceViability: 50,
    };
    return {
      id: t.id,
      trend: t.name,
      score: calculateMoneyProbability(factors),
      demandSignals: [
        t.whyItMatters || t.newsSummary || 'Live trend signal — see source trend record.',
        `Mention velocity: ${t.mentionVelocity}`,
      ],
      buyerProfile: `Live demand around "${t.name}" (${t.category}) — verify via source threads before outreach.`,
      priceRange: 'pending fresh intel — retry',
      competition: 'MEDIUM' as const,
      aiCanBuild: true,
      estimatedCloseTime: 'pending fresh intel — retry',
      confidence: 'LOW' as const,
      breakdown: factors,
    };
  });
}
