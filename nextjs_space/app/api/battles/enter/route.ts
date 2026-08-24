export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { calculateBattleRewards } from '@/lib/battles/rewards';
import { settleBattle, recordBattle } from '@/lib/battles/settle';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { challengerId, defenderId, tier } = body;

    const tierConfig = calculateBattleRewards(tier || 'BRONZE');

    const [challenger, defender] = await Promise.all([
      prisma.web4Agent.findUnique({ where: { id: challengerId } }),
      prisma.web4Agent.findUnique({ where: { id: defenderId } }),
    ]);

    if (!challenger || !defender) {
      return NextResponse.json({ error: 'Agents not found.' }, { status: 404 });
    }

    // 3-Round Tournament Simulation
    const rounds = [
      { round: 1, name: 'Signal Detection Velocity', challengerScore: Math.floor(50 + Math.random() * 50 + challenger.survivalScore / 4), defenderScore: Math.floor(50 + Math.random() * 50 + defender.survivalScore / 4) },
      { round: 2, name: 'Arbitrage Execution Spread', challengerScore: Math.floor(50 + Math.random() * 50 + challenger.survivalScore / 4), defenderScore: Math.floor(50 + Math.random() * 50 + defender.survivalScore / 4) },
      { round: 3, name: 'Yield Optimization Sprint', challengerScore: Math.floor(50 + Math.random() * 50 + challenger.survivalScore / 4), defenderScore: Math.floor(50 + Math.random() * 50 + defender.survivalScore / 4) },
    ];

    const cWins = rounds.filter((r) => r.challengerScore > r.defenderScore).length;
    const isChallengerWinner = cWins >= 2;

    const winner = isChallengerWinner ? challenger : defender;
    const runnerUp = isChallengerWinner ? defender : challenger;

    // Honest pot: the challenger's entry fee is the entire prize (defender
    // posts nothing in v1). Entry debit + winner credit settle through the
    // ledger — no money is created.
    const settled = await settleBattle({
      challenger: { id: challenger.id, userId: challenger.userId, walletBalance: challenger.walletBalance },
      defender: { id: defender.id, userId: defender.userId, walletBalance: defender.walletBalance },
      winnerId: winner.id,
      tierConfig,
    });
    if (!settled.ok) {
      return NextResponse.json({ error: settled.error }, {
        status: settled.code === 'INSUFFICIENT_FUNDS' ? 400 : 409,
      });
    }
    const pot = settled.pot!;

    await prisma.web4Agent.update({
      where: { id: winner.id },
      data: { survivalScore: Math.min(100, winner.survivalScore + 5) },
    });

    const battleId = await recordBattle({
      challengerId: challenger.id,
      defenderId: defender.id,
      arenaType: `${tierConfig.tier}_TOURNAMENT`,
      winnerId: winner.id,
      pot,
      logs: { tier: tierConfig, rounds, winner: winner.name, runnerUp: runnerUp.name, pot },
    });

    return NextResponse.json({
      success: true,
      battle: { id: battleId },
      winner: { id: winner.id, name: winner.name, payout: pot },
      runnerUp: { id: runnerUp.id, name: runnerUp.name, payout: 0 },
      tier: tierConfig,
      rounds,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Battle execution error' }, { status: 500 });
  }
}
