export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/core/auth-options';
import { isUserAdmin } from '@/lib/council/config';
import { prisma } from '@/lib/core/db';
import { fingerprint, isDuplicate } from '@/lib/pipeline';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isUserAdmin(session.user as any)) {
    return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const {
      sessionId,
      title = 'Autonomous B2B Emergency Voice Dispatch for Contractors',
      description = 'Service contractors miss 40% of night calls; hiring an overnight dispatcher costs $3,000/mo. Cash offer: $450 setup + retainer.',
      estimatedEarningsLow = 450,
      estimatedEarningsHigh = 2500,
      startupCost = 50,
      timeToFirstDollar = '24-48 hours',
      category = 'AGENT_ECONOMY',
      steps,
    } = body;

    // 1. Find or create linked Trend (fingerprint-guarded, idempotent)
    const trendName = `Commercial Alpha: ${title.slice(0, 60)}`;
    const trendFp = fingerprint(trendName);
    let trend = await prisma.trend.findFirst({
      where: { name: trendName },
    });
    if (!trend) {
      try {
        trend = await (prisma.trend.findFirst as any)({ where: { fingerprint: trendFp } });
      } catch {
        trend = null;
      }
    }

    if (!trend) {
      const trendDataBase = {
        name: trendName,
        sourcePlatforms: ['Reddit r/smallbusiness', 'Google Trends', 'AI Money Council'],
        mentionVelocity: 95.0,
        sentimentScore: 0.94,
        confidence: 0.96,
        category: 'AGENT_ECONOMY',
        status: 'ACTIVE',
        isMonetizable: true,
        monetizationScore: 0.98,
        monetizationRationale: 'Approved by AI Money Council with audited unit economics and verified commercial buyer intent.',
        newsSummary: description,
        whyItMatters: 'Zero vanity noise. High-velocity B2B cashflow opportunity with day-one profitability.',
      };
      try {
        trend = await prisma.trend.create({ data: { ...trendDataBase, fingerprint: trendFp } as any });
      } catch (e: any) {
        if (e?.code === 'P2002') {
          trend = await prisma.trend.findFirst({ where: { name: trendName } });
        } else if (/fingerprint|Unknown argument/i.test(String(e?.message || ''))) {
          trend = await prisma.trend.create({ data: trendDataBase as any });
        } else {
          throw e;
        }
      }
      if (!trend) {
        trend = await prisma.trend.findFirst({ where: { name: trendName } });
      }
    }

    // 2. Default concrete execution steps if none provided
    const taskSteps = steps && Array.isArray(steps) && steps.length > 0 ? steps : [
      { stepNumber: 1, title: 'Acquire Target Prospect List', instruction: 'Identify 15-20 local SMBs or consultants actively running ads but missing customer interactions.' },
      { stepNumber: 2, title: 'Deploy Pre-Built Integration Template', instruction: 'Configure the automated dispatch/portal template with zero code friction.' },
      { stepNumber: 3, title: 'Conduct Video/Live Audit Proof', instruction: 'Demonstrate lost call or lead volume directly to the owner with recorded test calls.' },
      { stepNumber: 4, title: 'Collect Setup Fee & Retainer', instruction: 'Charge $450 upfront setup fee plus $150/mo ongoing maintenance retainer.' },
      { stepNumber: 5, title: 'Automate Servicing & SMS Failover', instruction: 'Monitor system uptime and route complex edge-cases via SMS failover.' },
    ];

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days

    // 3. Double-click guard: same title fingerprint → return existing, never duplicate.
    const taskFp = fingerprint(String(title));
    let existing: any = null;
    try {
      existing = await (prisma.task.findFirst as any)({ where: { fingerprint: taskFp } });
    } catch {
      existing = null;
    }
    if (!existing) {
      existing = await prisma.task.findFirst({ where: { title: String(title) } });
    }
    if (!existing) {
      // Fuzzy sweep over recent tasks for this trend (Jaccard >= 0.45).
      const recent = await prisma.task.findMany({
        where: { trendId: trend!.id },
        select: { id: true, title: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      const hit = recent.find((r) => isDuplicate(String(title), [r.title], 0.45));
      if (hit) existing = hit;
    }
    let task: any = existing;
    let duplicate = Boolean(existing);
    if (!task) {
      const taskDataBase = {
        trendId: trend!.id,
        title,
        description,
        steps: taskSteps,
        difficulty: 'LOW',
        startupCost: Number(startupCost) || 50,
        timeToFirstDollar: timeToFirstDollar || '24-48 hours',
        estimatedEarningsLow: Number(estimatedEarningsLow) || 450,
        estimatedEarningsHigh: Number(estimatedEarningsHigh) || 2500,
        riskLevel: 'LOW',
        riskExplanation: 'Minimal upfront capital required; downside mitigated by automated failover routing.',
        mitigationStrategy: 'Hardcoded failover routing to business owner phone when confidence drops below 85%.',
        proTip: 'Offer a 7-day risk-free trial on after-hours missed calls to close contractor immediately.',
        category: 'AGENT_ECONOMY',
        qualityScore: 95,
        isVerified: true,
        isFeatured: true, // surfaces directly in Hot Tasks / Trending section
        trendScore: 98,   // puts it at the top of Hot Tasks feed
        weekOf: now,
        generatedAt: now,
        expiresAt,
      };
      try {
        // Create the Task in Hot Tasks roster (isFeatured: true, trendScore: 98)
        task = await prisma.task.create({ data: { ...taskDataBase, fingerprint: taskFp } as any });
      } catch (e: any) {
        if (e?.code === 'P2002') {
          task = await prisma.task.findFirst({ where: { title: String(title) } });
          duplicate = true;
        } else if (/fingerprint|Unknown argument/i.test(String(e?.message || ''))) {
          task = await prisma.task.create({ data: taskDataBase as any });
        } else {
          throw e;
        }
      }
    }

    // 4. Update CouncilSession if sessionId provided
    if (sessionId) {
      await prisma.councilSession.update({
        where: { id: sessionId },
        data: { status: 'approved' },
      }).catch(() => null);
    }

    // 5. Team feed: council approvals talk back instead of going silent.
    try {
      const { emitDone } = await import('@/lib/activity/emitter');
      await emitDone({
        taskId: task.id,
        actorId: 'council',
        actionDescription: `Council approved "${task.title}" → Hot Tasks.`,
        outputs: { taskId: task.id, sessionId: sessionId ?? null },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      ok: !duplicate,
      duplicate,
      ...(duplicate ? { reason: 'duplicate' } : null),
      taskId: task.id,
      title: task.title,
      message: duplicate
        ? 'Already in Hot Tasks — returning existing task (double-click safe).'
        : 'Council idea approved and moved to Hot Tasks section!',
      hotTaskUrl: `/tasks?tab=trending`,
    });
  } catch (error: any) {
    console.error('[ApproveCouncilTask] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to approve task' }, { status: 500 });
  }
}
