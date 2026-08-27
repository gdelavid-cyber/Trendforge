import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Fetch top active trends ordered by velocity
    const topTrends = await prisma.trend.findMany({
      where: { status: 'ACTIVE' },
      take: 4,
      orderBy: { mentionVelocity: 'desc' },
      select: {
        id: true,
        name: true,
        category: true,
        mentionVelocity: true,
        monetizationScore: true,
        newsSummary: true,
        whyItMatters: true,
      },
    });

    // Fetch top featured actionable moves
    const featuredTasks = await prisma.task.findMany({
      where: { isFeatured: true },
      take: 3,
      orderBy: { generatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        estimatedEarningsLow: true,
        estimatedEarningsHigh: true,
        startupCost: true,
        difficulty: true,
      },
    });

    // Fetch user's web4 agents if authenticated
    let userBotsCount = 0;
    let totalBotBalance = 0;
    if (userId) {
      const bots = await prisma.web4Agent.findMany({
        where: { userId },
        select: { walletBalance: true },
      });
      userBotsCount = bots.length;
      totalBotBalance = bots.reduce((acc, b) => acc + (b.walletBalance || 0), 0);
    }

    const todayDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    // Build synthesized spoken script
    const leadTrend = topTrends[0]?.name ?? 'Autonomous AI Agents & Micro-SaaS';
    const topMove = featuredTasks[0];
    const topYield = topMove ? `$${topMove.estimatedEarningsLow} to $${topMove.estimatedEarningsHigh}` : '$500 to $2,500';

    const spokenScript = `Good morning Operative. This is your Trendly Market Intelligence debrief for ${todayDate}.

Macro momentum is heavily surging around ${leadTrend}, with search velocity climbing rapidly over the past 24 hours. 

Our autonomous scrapers have identified high-conviction monetizable gaps across Reddit and tech communities. The primary alpha opportunity on the radar is ${topMove?.title || 'Micro-SaaS Codebase Scaffolding'}, with an estimated yield potential of ${topYield}.

Your sovereign agent fleet is online with ${userBotsCount} active units and ${totalBotBalance.toFixed(2)} USDC in autonomous reserves. All execution pipelines are green and ready for deployment. Launch your primary move whenever you are ready.`;

    return NextResponse.json({
      success: true,
      todayDate,
      spokenScript,
      topTrends,
      featuredTasks,
      primaryMove: topMove,
      userStats: {
        userBotsCount,
        totalBotBalance,
      },
    });
  } catch (error: any) {
    console.error('[MARKET_DEBRIEF_API_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate market debrief',
      },
      { status: 500 }
    );
  }
}
