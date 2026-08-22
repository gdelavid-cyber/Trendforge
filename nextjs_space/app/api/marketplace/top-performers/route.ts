export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculateAgentRank } from '@/lib/marketplace/ranking';

export async function GET() {
  const agents = await prisma.web4Agent.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { profit: 'desc' },
    take: 10,
  });

  const rankedAgents = agents.map((agent) => {
    const rankInfo = calculateAgentRank(agent);
    return {
      ...agent,
      rankInfo,
    };
  }).sort((a, b) => b.rankInfo.compositeScore - a.rankInfo.compositeScore);

  return NextResponse.json({ success: true, topPerformers: rankedAgents });
}
