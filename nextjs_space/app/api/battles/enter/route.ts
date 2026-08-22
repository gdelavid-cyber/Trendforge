export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { calculateBattleRewards } from '@/lib/battles/rewards';

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

    if (challenger.walletBalance < tierConfig.entryFeeUsdc) {
      return NextResponse.json({
        error: `Challenger requires at least $${tierConfig.entryFeeUsdc} USDC in Conway wallet to enter ${tierConfig.name}.`,
      }, { status: 400 });
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

    // Deduct entry fee from challenger & distribute prize pool (70% to winner, 20% to runner up)
    await prisma.web4Agent.update({
      where: { id: challenger.id },
      data: { walletBalance: { decrement: tierConfig.entryFeeUsdc } },
    });

    await prisma.web4Agent.update({
      where: { id: winner.id },
      data: {
        walletBalance: { increment: tierConfig.winnerPayoutUsdc },
        totalEarnings: { increment: tierConfig.winnerPayoutUsdc },
        profit: { increment: tierConfig.winnerPayoutUsdc },
        survivalScore: Math.min(100, winner.survivalScore + 5),
      },
    });

    await prisma.web4Agent.update({
      where: { id: runnerUp.id },
      data: {
        walletBalance: { increment: tierConfig.runnerUpPayoutUsdc },
        totalEarnings: { increment: tierConfig.runnerUpPayoutUsdc },
      },
    });

    const battleRecord = await prisma.agentBattle.create({
      data: {
        challengerId: challenger.id,
        defenderId: defender.id,
        arenaType: `${tierConfig.tier}_TOURNAMENT`,
        winnerId: winner.id,
        yieldGenerated: tierConfig.winnerPayoutUsdc,
        logs: { tier: tierConfig, rounds, winner: winner.name, runnerUp: runnerUp.name },
      },
    });

    return NextResponse.json({
      success: true,
      battle: battleRecord,
      winner: { id: winner.id, name: winner.name, payout: tierConfig.winnerPayoutUsdc },
      runnerUp: { id: runnerUp.id, name: runnerUp.name, payout: tierConfig.runnerUpPayoutUsdc },
      tier: tierConfig,
      rounds,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Battle execution error' }, { status: 500 });
  }
}
