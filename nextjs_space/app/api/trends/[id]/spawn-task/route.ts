import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const trend = await prisma.trend.findUnique({
      where: { id: params.id },
      include: { tasks: true },
    });

    if (!trend) {
      return NextResponse.json({ error: 'Trend not found' }, { status: 404 });
    }

    // If an existing task is already present, return it immediately
    if (trend.tasks.length > 0) {
      return NextResponse.json({ ok: true, taskId: trend.tasks[0].id });
    }

    // Create a new task linked to this trend
    const defaultSteps = [
      {
        id: 'step-1',
        title: 'Telemetry & Pain-Point Extraction',
        description: `Analyze signal sources for ${trend.name} and extract key customer pain points.`,
        action: 'research',
        external: false,
        tools: ['Reddit Scraper', 'HackerNews API'],
      },
      {
        id: 'step-2',
        title: 'Synthesize Turnkey Deliverable',
        description: 'Generate production-ready code, copy, and audio assets.',
        action: 'generate',
        external: false,
        tools: ['OpenRouter LLM', 'Remotion Canvas'],
      },
      {
        id: 'step-3',
        title: 'Concurrent Buyer Lead Qualification',
        description: 'Discover and qualify 5+ high-intent buyer prospects.',
        action: 'scrape',
        external: false,
        tools: ['Sales Scout', 'Google Maps Radar'],
      },
      {
        id: 'step-4',
        title: 'Personalized Pitch & Human-In-The-Loop Approval',
        description: 'Review matched buyer proposals and authorize outreach.',
        action: 'send',
        external: true,
        tools: ['Sales Engine', 'Resend API'],
      },
    ];

    const newTask = await prisma.task.create({
      data: {
        trendId: trend.id,
        title: `${trend.name} — Autonomous Power Move`,
        category: trend.category,
        description: trend.whyItMatters || trend.newsSummary || `High-velocity monetization blueprint executing ${trend.name}.`,
        difficulty: 'LOW',
        timeToFirstDollar: '24-48 hours',
        estimatedEarningsLow: 500,
        estimatedEarningsHigh: 2500,
        startupCost: 0,
        steps: defaultSteps,
      },
    });

    return NextResponse.json({ ok: true, taskId: newTask.id });
  } catch (error: any) {
    console.error('Failed to spawn task:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}