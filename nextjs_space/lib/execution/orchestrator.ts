import { db } from '@/lib/db';
import { callLLM, extractJSON } from '@/lib/pipeline';
import { STAGES, generatePlayableHtml, type StageContext, type StageDefinition } from './stages';
import { logActivity, updateCheckpoint } from './activity';

const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [0, 1500, 4000];

interface StageResult {
  output: Record<string, unknown>;
  usedFallback: boolean;
  provider?: string;
  model?: string;
  latencyMs: number;
  attempts: number;
  error?: string;
}

/**
 * Runs one stage with: retry -> JSON repair -> schema repair -> fallback.
 * Emits real-time ExecutionEvent rows for transparency logging.
 */
async function runStage(executionId: string, def: StageDefinition, ctx: StageContext): Promise<StageResult> {
  const started = Date.now();
  let lastError = '';

  await db.executionEvent.create({
    data: {
      executionId,
      actor: 'system',
      stageKey: def.key,
      message: `Stage initiated: ${def.label}`,
      data: { description: def.description, ordinal: def.ordinal },
    },
  }).catch(() => {});

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (BACKOFF_MS[attempt - 1]) {
      await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt - 1]));
    }

    try {
      const { system, user } = def.buildPrompt(ctx);

      const repairSuffix = lastError
        ? `\n\nYour previous response was rejected: ${lastError}. Fix that specifically.`
        : '';

      const raw = await callLLM(
        [
          { role: 'system', content: system + repairSuffix },
          { role: 'user', content: user },
        ],
        true
      );

      const content = typeof raw === 'string' ? raw : (raw as any)?.content ?? '';
      if (!content) {
        lastError = 'empty LLM response';
        await db.executionEvent.create({
          data: {
            executionId,
            actor: 'system',
            stageKey: def.key,
            message: `Attempt ${attempt} returned empty response. Retrying...`,
          },
        }).catch(() => {});
        continue;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(extractJSON(content));
      } catch {
        const m = content.match(/\{[\s\S]*\}/);
        if (!m) {
          lastError = 'output was not JSON';
          await db.executionEvent.create({
            data: {
              executionId,
              actor: 'system',
              stageKey: def.key,
              message: `Attempt ${attempt} failed JSON parsing. Retrying with syntax repair...`,
            },
          }).catch(() => {});
          continue;
        }
        try {
          parsed = JSON.parse(m[0]);
        } catch {
          lastError = 'output was malformed JSON';
          continue;
        }
      }

      const check = def.validate(parsed);
      if (!check.ok) {
        lastError = check.reason || 'failed schema validation';
        await db.executionEvent.create({
          data: {
            executionId,
            actor: 'system',
            stageKey: def.key,
            message: `Attempt ${attempt} schema check rejected: ${lastError}`,
          },
        }).catch(() => {});
        continue;
      }

      const provider = process.env.INFERHUB_API_KEY
        ? 'InferHub'
        : process.env.OPENAI_API_KEY
          ? 'OpenAI'
          : 'AbacusAI';
      const model = process.env.INFERHUB_MODEL || 'gemini-3.6-flash';
      const latencyMs = Date.now() - started;

      await db.executionEvent.create({
        data: {
          executionId,
          actor: 'llm',
          stageKey: def.key,
          message: `Stage verified: ${def.label} produced via ${provider} (${latencyMs}ms)`,
          data: { attempts: attempt, provider, model, latencyMs },
        },
      }).catch(() => {});

      return {
        output: parsed as Record<string, unknown>,
        usedFallback: false,
        provider,
        model,
        latencyMs,
        attempts: attempt,
      };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.error(`[Exec] ${def.key} attempt ${attempt} failed:`, lastError);
      await db.executionEvent.create({
        data: {
          executionId,
          actor: 'system',
          stageKey: def.key,
          message: `Attempt ${attempt} network/inference error: ${lastError}`,
        },
      }).catch(() => {});
    }
  }

  // Fallback guarantee point
  const latencyMs = Date.now() - started;
  console.warn(`[Exec] ${def.key} exhausted retries, using deterministic fallback. Last error: ${lastError}`);
  const fallbackOutput = def.fallback(ctx);

  await db.executionEvent.create({
    data: {
      executionId,
      actor: 'fallback',
      stageKey: def.key,
      message: `Fallback engaged for ${def.label}: synthesized signal-based deliverable`,
      data: { error: lastError, attempts: MAX_ATTEMPTS, latencyMs },
    },
  }).catch(() => {});

  return {
    output: fallbackOutput,
    usedFallback: true,
    latencyMs,
    attempts: MAX_ATTEMPTS,
    error: lastError,
  };
}

/**
 * Runs (or resumes) a full execution work graph across all 6 stages.
 */
export async function runExecution(executionId: string): Promise<void> {
  const execution = await db.trendExecution.findUnique({
    where: { id: executionId },
    include: {
      trend: { include: { signals: { orderBy: { score: 'desc' }, take: 25 } } },
      stages: true,
    },
  });

  if (!execution) throw new Error(`Execution ${executionId} not found`);
  if (execution.status === 'COMPLETED' || execution.status === 'DEGRADED') return;

  // Log "started" on initial run
  if (execution.status === 'QUEUED') {
    await logActivity({
      userId: execution.userId,
      executionId,
      trendId: execution.trendId,
      kind: 'execution_started',
      title: `Started executing "${execution.trend.name}"`,
      detail: '6-stage revenue kit in progress',
    });
  }

  await db.trendExecution.update({
    where: { id: executionId },
    data: { status: 'RUNNING', startedAt: execution.startedAt ?? new Date(), lastActivityAt: new Date() },
  });

  await db.executionEvent.create({
    data: {
      executionId,
      actor: 'system',
      stageKey: null,
      message: `Execution pipeline active for trend "${execution.trend.name}" (6 stages)`,
    },
  }).catch(() => {});

  const priorOutputs: Record<string, unknown> = {};
  for (const s of execution.stages) {
    if ((s.status === 'COMPLETED' || s.status === 'FALLBACK') && s.output) {
      priorOutputs[s.stageKey] = s.output;
    }
  }

  let anyFallback = execution.stages.some((s) => s.usedFallback);

  for (const def of STAGES) {
    if (priorOutputs[def.key]) continue;

    await updateCheckpoint(executionId, `Working on: ${def.label}`);

    await db.executionStage.upsert({
      where: { executionId_stageKey: { executionId, stageKey: def.key } },
      create: {
        executionId,
        stageKey: def.key,
        ordinal: def.ordinal,
        status: 'RUNNING',
        startedAt: new Date(),
      },
      update: { status: 'RUNNING', startedAt: new Date() },
    });

    await db.trendExecution.update({
      where: { id: executionId },
      data: {
        currentStage: def.key,
        progressPct: Math.round(((def.ordinal - 1) / STAGES.length) * 100),
        lastActivityAt: new Date(),
      },
    });

    const ctx: StageContext = { trend: execution.trend, priorOutputs };
    const result = await runStage(executionId, def, ctx);

    // If this is stage 5 (preview), ensure playableHtml is generated and attached
    if (def.key === 'preview') {
      const pOut = result.output;
      if (!pOut.playableHtml) {
        pOut.playableHtml = generatePlayableHtml(pOut);
      }
    }

    priorOutputs[def.key] = result.output;
    if (result.usedFallback) anyFallback = true;

    await db.executionStage.update({
      where: { executionId_stageKey: { executionId, stageKey: def.key } },
      data: {
        status: result.usedFallback ? 'FALLBACK' : 'COMPLETED',
        output: result.output as object,
        attempts: result.attempts,
        usedFallback: result.usedFallback,
        provider: result.provider,
        model: result.model,
        latencyMs: result.latencyMs,
        errorMessage: result.error,
        completedAt: new Date(),
      },
    });

    // Log per-stage completion in user activity feed
    await logActivity({
      userId: execution.userId,
      executionId,
      trendId: execution.trendId,
      kind: result.usedFallback ? 'stage_fallback' : 'stage_completed',
      title: `${def.label} ${result.usedFallback ? 'used fallback' : 'done'}`,
      detail: `${execution.trend.name} • stage ${def.ordinal}/6`,
    });
  }

  // Ensure playableHtml is explicitly present in preview block
  if (priorOutputs.preview) {
    const prevObj = priorOutputs.preview as Record<string, unknown>;
    if (!prevObj.playableHtml) {
      prevObj.playableHtml = generatePlayableHtml(prevObj);
    }
  }

  // Assemble deliverable
  const revenueKit = {
    trend: { id: execution.trend.id, name: execution.trend.name, category: execution.trend.category },
    generatedAt: new Date().toISOString(),
    degraded: anyFallback,
    preview: priorOutputs.preview,
    ...priorOutputs,
  };

  await db.trendExecution.update({
    where: { id: executionId },
    data: {
      status: 'AWAITING_APPROVAL',
      currentStage: null,
      progressPct: 100,
      revenueKit: revenueKit as object,
      completedAt: new Date(),
      lastCheckpoint: 'Waiting for your approval on outreach',
      lastActivityAt: new Date(),
      errorMessage: anyFallback ? 'One or more stages used fallback output' : null,
    },
  });

  await logActivity({
    userId: execution.userId,
    executionId,
    trendId: execution.trendId,
    kind: 'awaiting_approval',
    title: `"${execution.trend.name}" is ready`,
    detail: anyFallback
      ? 'Revenue kit complete (some stages degraded) — review and approve to unlock'
      : 'Revenue kit complete — review and approve to unlock',
  });

  await db.executionEvent.create({
    data: {
      executionId,
      actor: 'system',
      stageKey: null,
      message: 'Work graph complete. Playable preview generated. Awaiting user sales fork approval.',
      data: { degraded: anyFallback },
    },
  }).catch(() => {});
}

export async function resumeStalled(staleMinutes = 5): Promise<number> {
  const cutoff = new Date(Date.now() - staleMinutes * 60_000);
  const stalled = await db.trendExecution.findMany({
    where: { status: 'RUNNING', updatedAt: { lt: cutoff } },
    select: { id: true },
    take: 10,
  });

  for (const e of stalled) {
    console.log(`[Exec] Resuming stalled execution ${e.id}`);
    try {
      await runExecution(e.id);
    } catch (err) {
      console.error(`[Exec] Resume failed for ${e.id}:`, err);
    }
  }
  return stalled.length;
}
