export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';
import {
  validatePipelineKey,
  fingerprint,
  isDuplicate,
} from '@/lib/pipeline';
import { classifyTrendMonetization } from '@/lib/pipeline/classifier';
import { toStructuredStepsJson } from '@/lib/pipeline/steps';
import { logExecutionEvent } from '@/lib/execution/logger';
import { getSessionUser, requireAdminUser } from '@/lib/core/route-auth';

export async function POST(request: Request) {
  const startTime = Date.now();
  const isKeyValid = validatePipelineKey(request);

  if (!isKeyValid) {
    const adminUser = await requireAdminUser();
    if (!adminUser) {
      const user = await getSessionUser();
      if (user) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  let body: any = {};
  try {
    const text = await request.text();
    if (text.trim()) {
      body = JSON.parse(text);
    }
  } catch {
    return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
  }

  const rawSignals = body?.signals ?? [];
  if (!Array.isArray(rawSignals)) {
    return NextResponse.json({ error: 'signals must be an array' }, { status: 400 });
  }

  const signals = rawSignals.slice(0, 100);

  if (signals.length === 0) {
    const durationMs = Date.now() - startTime;
    await prisma.trendIngestionLog.create({
      data: {
        source: 'SCRAPLING_WORKER',
        status: 'SUCCESS',
        recordsIngested: 0,
        durationMs,
        errorMessage: null,
      },
    });

    return NextResponse.json({
      success: true,
      summary: 'Autonomous Scrapling ingestion complete: 0 signals processed.',
      monetizableMovesAdded: 0,
      marketNewsAdded: 0,
      recordsIngested: 0,
      durationMs,
      errors: [],
    });
  }

  let existingTrendNames = new Set<string>();
  let existingTaskTitles = new Set<string>();
  try {
    const [existingTrends, existingTasks] = await Promise.all([
      prisma.trend.findMany({ select: { name: true }, take: 500 }),
      prisma.task.findMany({ select: { title: true }, take: 500 }),
    ]);
    existingTrendNames = new Set(existingTrends.map((t) => t.name.toLowerCase().trim()));
    existingTaskTitles = new Set(existingTasks.map((t) => t.title.toLowerCase().trim()));
  } catch (dbErr) {
    console.warn('[INGEST] Pre-check query warning:', dbErr);
  }

  let recordsIngested = 0;
  let monetizableMovesAdded = 0;
  let marketNewsAdded = 0;
  const errors: string[] = [];

  for (const signal of signals) {
    const rawName = signal?.name || signal?.title;
    if (!rawName || typeof rawName !== 'string') continue;
    const name = rawName.trim();

    if (isDuplicate(name, existingTrendNames, 0.45)) continue;

    const classification = await classifyTrendMonetization(
      {
        name,
        sourcePlatforms: Array.isArray(signal.sourcePlatforms) ? signal.sourcePlatforms : undefined,
        description: signal.description,
        url: signal.url,
        score: typeof signal.score === 'number' ? signal.score : undefined,
      },
      existingTaskTitles
    );

    const mentionVelocity =
      typeof signal.mentionVelocity === 'number' && !isNaN(signal.mentionVelocity)
        ? signal.mentionVelocity
        : 0;
    const sentimentScore = 0;
    const confidence =
      typeof classification.monetizationScore === 'number'
        ? classification.monetizationScore
        : 0.85;
    const sourcePlatforms =
      Array.isArray(signal.sourcePlatforms) && signal.sourcePlatforms.length > 0
        ? signal.sourcePlatforms
        : ['Web'];

    let trend: any;
    try {
      trend = await prisma.trend.create({
        data: {
          name,
          sourcePlatforms,
          mentionVelocity,
          sentimentScore,
          confidence,
          category: classification.category,
          status: 'ACTIVE',
          isMonetizable: classification.isMonetizable,
          monetizationScore: classification.monetizationScore,
          monetizationRationale: classification.monetizationRationale,
          newsSummary: classification.newsSummary,
          whyItMatters: classification.whyItMatters,
          newsSourceUrl: signal.url || null,
          detectedAt: new Date(),
          hoursSinceDetection:
            typeof signal.hoursSinceDetection === 'number' ? signal.hoursSinceDetection : 0,
        },
      });
    } catch (err: any) {
      if (err?.code === 'P2002') continue;
      errors.push(`Failed to create trend "${name}": ${err.message}`);
      continue;
    }

    existingTrendNames.add(name.toLowerCase());
    recordsIngested++;

    if (classification.isMonetizable && classification.taskProposal) {
      const tp = classification.taskProposal;
      const taskTitle = tp.title.trim();

      if (isDuplicate(taskTitle, existingTaskTitles, 0.45)) {
        marketNewsAdded++;
        continue;
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      let newTask: any;

      try {
        newTask = await prisma.task.create({
          data: {
            trendId: trend.id,
            title: taskTitle,
            description: tp.description,
            steps: toStructuredStepsJson(tp.steps),
            difficulty: tp.difficulty,
            startupCost: tp.startupCost,
            timeToFirstDollar: tp.timeToFirstDollar,
            estimatedEarningsLow: tp.estimatedEarningsLow,
            estimatedEarningsHigh: tp.estimatedEarningsHigh,
            riskLevel: tp.riskLevel,
            riskExplanation: tp.riskExplanation,
            mitigationStrategy: tp.mitigationStrategy,
            proTip: tp.proTip,
            category: classification.category,
            qualityScore: 0.9,
            weekOf: now,
            generatedAt: now,
            expiresAt,
            trendScore: classification.monetizationScore,
            isFeatured: true,
            requiresOptIn: tp.riskLevel === 'HIGH',
          },
        });
      } catch (taskErr: any) {
        if (taskErr?.code === 'P2002') {
          marketNewsAdded++;
          continue;
        }
        errors.push(`Failed to create task for "${taskTitle}": ${taskErr.message}`);
        continue;
      }

      existingTaskTitles.add(taskTitle.toLowerCase());
      monetizableMovesAdded++;

      await logExecutionEvent({
        taskId: newTask.id,
        logType: 'companion_action',
        actor: 'companion',
        actorId: 'scrapling-ingest',
        actionDescription: `Discovered and structured monetizable opportunity: "${newTask.title}" from ${name}`,
        inputs: { trendId: trend.id, signalName: name, sourcePlatforms },
        outputs: { taskId: newTask.id, earningsLow: tp.estimatedEarningsLow, earningsHigh: tp.estimatedEarningsHigh },
      });
    } else {
      marketNewsAdded++;
    }
  }

  const durationMs = Date.now() - startTime;

  await prisma.trendIngestionLog.create({
    data: {
      source: 'SCRAPLING_WORKER',
      status: errors.length > 0 && recordsIngested === 0 ? 'FAILED' : 'SUCCESS',
      recordsIngested,
      durationMs,
      errorMessage: errors.length > 0 ? errors.join('; ') : null,
    },
  });

  return NextResponse.json({
    success: true,
    summary: `Autonomous Scrapling ingestion complete: ${recordsIngested} signals evaluated. ${monetizableMovesAdded} monetizable Power Moves sent to /tasks, and ${marketNewsAdded} market news briefings sent to /trends.`,
    monetizableMovesAdded,
    marketNewsAdded,
    recordsIngested,
    durationMs,
    errors,
  });
}
