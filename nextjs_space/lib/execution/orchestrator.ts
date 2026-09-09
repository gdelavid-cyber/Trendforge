import { db } from '@/lib/db';
import { callLLM, extractJSON } from '@/lib/pipeline';
import { STAGES, type StageContext, type StageDefinition } from './stages';

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
 * This function CANNOT throw. It always returns a usable output.
 */
async function runStage(def: StageDefinition, ctx: StageContext): Promise<StageResult> {
  const started = Date.now();
  let lastError = '';

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (BACKOFF_MS[attempt - 1]) {
      await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt - 1]));
    }

    try {
      const { system, user } = def.buildPrompt(ctx);

      // On retry, tell the model what it got wrong
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
        continue;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(extractJSON(content));
      } catch {
        // JSON repair: grab the outermost brace pair and retry parse
        const m = content.match(/\{[\s\S]*\}/);
        if (!m) {
          lastError = 'output was not JSON';
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
        continue;
      }

      const provider = process.env.INFERHUB_API_KEY
        ? 'InferHub'
        : process.env.OPENAI_API_KEY
          ? 'OpenAI'
          : 'AbacusAI';
      const model = process.env.INFERHUB_MODEL || 'gemini-3.6-flash';

      return {
        output: parsed as Record<string, unknown>,
        usedFallback: false,
        provider,
        model,
        latencyMs: Date.now() - started,
        attempts: attempt,
      };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.error(`[Exec] ${def.key} attempt ${attempt} failed:`, lastError);
    }
  }

  // Guarantee point: every stage produces output, even with zero LLM availability.
  console.warn(`[Exec] ${def.key} exhausted retries, using fallback. Last error: ${lastError}`);
  return {
    output: def.fallback(ctx),
    usedFallback: true,
    latencyMs: Date.now() - started,
    attempts: MAX_ATTEMPTS,
    error: lastError,
  };
}

/**
 * Runs (or resumes) a full execution. Idempotent — completed stages are skipped,
 * so this is safe to call repeatedly after a serverless timeout or crash.
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

  await db.trendExecution.update({
    where: { id: executionId },
    data: { status: 'RUNNING', startedAt: execution.startedAt ?? new Date() },
  });

  // Rehydrate any already-finished stages so resume works
  const priorOutputs: Record<string, unknown> = {};
  for (const s of execution.stages) {
    if ((s.status === 'COMPLETED' || s.status === 'FALLBACK') && s.output) {
      priorOutputs[s.stageKey] = s.output;
    }
  }

  let anyFallback = execution.stages.some((s) => s.usedFallback);

  for (const def of STAGES) {
    if (priorOutputs[def.key]) continue; // already done

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
      },
    });

    const ctx: StageContext = { trend: execution.trend, priorOutputs };
    const result = await runStage(def, ctx);

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
  }

  // Assemble the deliverable
  const revenueKit = {
    trend: { id: execution.trend.id, name: execution.trend.name, category: execution.trend.category },
    generatedAt: new Date().toISOString(),
    degraded: anyFallback,
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
      errorMessage: anyFallback ? 'One or more stages used fallback output' : null,
    },
  });
}

/**
 * Sweeper: finds executions stuck in RUNNING past a timeout and resumes them.
 * Call from a cron. This is the second half of the completion guarantee —
 * a serverless kill mid-run cannot orphan an execution.
 */
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
