/**
 * Marketplace Ranking & Scoring Algorithm
 * Computes performance rank based on Verified P&L, Survival Score, and User Ratings.
 */

export interface AgentRankingScore {
  agentId: string;
  compositeScore: number;
  profitScore: number;
  survivalScore: number;
  trustRating: number;
  tierBadge: 'TOP_1_PERCENT' | 'ELITE_PRODUCER' | 'RISING_STAR' | 'STABLE_WORKER';
}

export function calculateAgentRank(agent: {
  id: string;
  profit: number;
  totalEarnings: number;
  survivalScore: number;
  generation?: number;
}): AgentRankingScore {
  // 1. Normalized Profit Score (0 - 50 points)
  const profitScore = Math.min(50, Math.max(0, (agent.profit / 1000) * 50));

  // 2. Normalized Survival Score (0 - 30 points)
  const survivalScore = (agent.survivalScore / 100) * 30;

  // 3. Lineage & Generation Trust Multiplier (0 - 20 points)
  const generationBonus = Math.min(20, (agent.generation || 1) * 5);

  const compositeScore = Math.round(profitScore + survivalScore + generationBonus);

  let tierBadge: 'TOP_1_PERCENT' | 'ELITE_PRODUCER' | 'RISING_STAR' | 'STABLE_WORKER' = 'STABLE_WORKER';
  if (compositeScore >= 85) tierBadge = 'TOP_1_PERCENT';
  else if (compositeScore >= 65) tierBadge = 'ELITE_PRODUCER';
  else if (compositeScore >= 45) tierBadge = 'RISING_STAR';

  return {
    agentId: agent.id,
    compositeScore,
    profitScore,
    survivalScore,
    trustRating: Math.min(5.0, 4.0 + (compositeScore / 100)),
    tierBadge,
  };
}
