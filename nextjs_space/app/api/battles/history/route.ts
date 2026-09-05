export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/core/auth-options';
import { prisma } from '@/lib/core/db';

export async function GET() {
  const battles = await prisma.agentBattle.findMany({
    take: 15,
    orderBy: { createdAt: 'desc' },
    include: {
      challenger: { select: { id: true, name: true, archetype: true, avatarConfig: true, survivalScore: true } },
      defender: { select: { id: true, name: true, archetype: true, avatarConfig: true, survivalScore: true } },
    },
  });

  return NextResponse.json({ success: true, battles });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { challengerId, defenderId, arenaType } = body;

    const [challenger, defender] = await Promise.all([
      prisma.web4Agent.findUnique({ where: { id: challengerId } }),
      prisma.web4Agent.findUnique({ where: { id: defenderId } }),
    ]);

    if (!challenger || !defender) {
      return NextResponse.json({ error: 'Challenger or Defender agent not found.' }, { status: 404 });
    }

    // Simulate 3-round Economic Arena Match
    const rounds: any[] = [];
    let challengerPoints = 0;
    let defenderPoints = 0;

    const arenaName = arenaType || 'ARBITRAGE_SHOWDOWN';

    // Round 1: Scraping Speed & Discovery Velocity
    const cR1 = Math.floor(50 + Math.random() * 50 + (challenger.survivalScore / 4));
    const dR1 = Math.floor(50 + Math.random() * 50 + (defender.survivalScore / 4));
    if (cR1 > dR1) challengerPoints++; else defenderPoints++;
    rounds.push({ round: 1, name: 'Market Signal Extraction', challengerScore: cR1, defenderScore: dR1, roundWinner: cR1 > dR1 ? challenger.name : defender.name });

    // Round 2: Algorithmic Arbitrage Execution
    const cR2 = Math.floor(50 + Math.random() * 50 + (challenger.survivalScore / 4));
    const dR2 = Math.floor(50 + Math.random() * 50 + (defender.survivalScore / 4));
    if (cR2 > dR2) challengerPoints++; else defenderPoints++;
    rounds.push({ round: 2, name: 'Orderbook Spread Arbitrage', challengerScore: cR2, defenderScore: dR2, roundWinner: cR2 > dR2 ? challenger.name : defender.name });

    // Round 3: Commercial Monetization Yield
    const cR3 = Math.floor(50 + Math.random() * 50 + (challenger.survivalScore / 4));
    const dR3 = Math.floor(50 + Math.random() * 50 + (defender.survivalScore / 4));
    if (cR3 > dR3) challengerPoints++; else defenderPoints++;
    rounds.push({ round: 3, name: 'B2B Client Conversion Sprint', challengerScore: cR3, defenderScore: dR3, roundWinner: cR3 > dR3 ? challenger.name : defender.name });

    const winner = challengerPoints >= defenderPoints ? challenger : defender;

    // Exhibition match: no money moves until funded battles land with the
    // deposit system. Winner takes a survival-score bump only.
    const bountyYield = 0;

    await prisma.web4Agent.update({
      where: { id: winner.id },
      data: {
        survivalScore: Math.min(100, winner.survivalScore + 5),
      },
    });

    const battleRecord = await prisma.agentBattle.create({
      data: {
        challengerId: challenger.id,
        defenderId: defender.id,
        arenaType: arenaName,
        winnerId: winner.id,
        yieldGenerated: bountyYield,
        logs: { rounds, challengerPoints, defenderPoints, winnerName: winner.name, bountyYield },
        status: 'COMPLETED',
      },
    });

    return NextResponse.json({
      success: true,
      battle: battleRecord,
      winner: { id: winner.id, name: winner.name },
      bountyYield,
      rounds,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Battle execution failed' }, { status: 500 });
  }
}
