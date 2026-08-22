export interface BattleTierConfig {
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  name: string;
  entryFeeUsdc: number;
  prizePoolUsdc: number;
  winnerPayoutUsdc: number;
  runnerUpPayoutUsdc: number;
  platformCutUsdc: number;
  minSurvivalScore: number;
  color: string;
  badge: string;
}

export const BATTLE_TIERS: Record<string, BattleTierConfig> = {
  BRONZE: {
    tier: 'BRONZE',
    name: 'Bronze Contender Arena',
    entryFeeUsdc: 2.0,
    prizePoolUsdc: 10.0,
    winnerPayoutUsdc: 7.0, // 70%
    runnerUpPayoutUsdc: 2.0, // 20%
    platformCutUsdc: 1.0, // 10%
    minSurvivalScore: 20,
    color: 'text-amber-600 border-amber-600/30 bg-amber-600/10',
    badge: '🥉 Bronze Tier',
  },
  SILVER: {
    tier: 'SILVER',
    name: 'Silver Gladiator Arena',
    entryFeeUsdc: 10.0,
    prizePoolUsdc: 50.0,
    winnerPayoutUsdc: 35.0, // 70%
    runnerUpPayoutUsdc: 10.0, // 20%
    platformCutUsdc: 5.0, // 10%
    minSurvivalScore: 40,
    color: 'text-slate-300 border-slate-400/30 bg-slate-400/10',
    badge: '🥈 Silver Tier',
  },
  GOLD: {
    tier: 'GOLD',
    name: 'Gold Mastermind Arena',
    entryFeeUsdc: 50.0,
    prizePoolUsdc: 250.0,
    winnerPayoutUsdc: 175.0, // 70%
    runnerUpPayoutUsdc: 50.0, // 20%
    platformCutUsdc: 25.0, // 10%
    minSurvivalScore: 65,
    color: 'text-[#FFD700] border-[#FFD700]/30 bg-[#FFD700]/10',
    badge: '🥇 Gold Tier',
  },
  PLATINUM: {
    tier: 'PLATINUM',
    name: 'Platinum Titan Championship',
    entryFeeUsdc: 200.0,
    prizePoolUsdc: 1000.0,
    winnerPayoutUsdc: 700.0, // 70%
    runnerUpPayoutUsdc: 200.0, // 20%
    platformCutUsdc: 100.0, // 10%
    minSurvivalScore: 80,
    color: 'text-[#00F0FF] border-[#00F0FF]/30 bg-[#00F0FF]/10 shadow-[0_0_25px_rgba(0,240,255,0.3)]',
    badge: '🏆 Platinum Championship',
  },
};

export function calculateBattleRewards(tierName: string) {
  const normalized = (tierName || 'BRONZE').toUpperCase();
  return BATTLE_TIERS[normalized] || BATTLE_TIERS.BRONZE;
}
