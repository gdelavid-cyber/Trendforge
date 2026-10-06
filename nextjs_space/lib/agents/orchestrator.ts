import { prisma } from '@/lib/core/db';
import {
  canExecute,
  recordSuccess,
  recordFailure,
  syncCircuitStateFromRedis,
} from '@/lib/agents/circuit-breaker';
import { getUserQuota, consumeQuota, refundQuota, AGENT_CONFIGS } from '@/lib/agents/quota';
import { getCachedAgentResultAsync, setCachedAgentResult } from '@/lib/agents/cache';
import { executeRedditScraper } from '@/lib/agents/reddit-scraper';
import { executePredictionArbitrage } from '@/lib/agents/prediction-arbitrage';
import { executeOpenClawDeployer } from '@/lib/agents/openclaw-deployer';
import { executeAIVideoMaker } from '@/lib/agents/ai-video-maker';
import { executeMicroSaaSBuilder } from '@/lib/agents/micro-saas-builder';
import { recordTrace } from '@/lib/growth/nova/traces';
import { stationBus } from '@/lib/station/bus';

export interface StartAgentOptions {
  userId: string;
  agentType: string;
  parameters: any;
  userRole?: string;
  userEmail?: string;
  userName?: string;
  awaitCompletion?: boolean;
}

const LOG_FLUSH_INTERVAL_MS = 1500;

/**
 * Registers a background promise with the serverless runtime (Vercel waitUntil / Next.js)
 * when available so the isolate is not frozen before async agent execution finishes.
 */
export function registerServerlessBackgroundTask(promise: Promise<unknown>): void {
  const g = globalThis as any;
  const ctx = g?.[Symbol.for('@vercel/request-context')]?.get?.();
  if (ctx && typeof ctx.waitUntil === 'function') {
    ctx.waitUntil(promise);
  }
}

export async function launchAgentRun(
  options: StartAgentOptions
): Promise<{ runId: string; status: string; result?: any }> {
  const {
    userId,
    agentType,
    parameters,
    userRole = 'FREE',
    userEmail,
    userName,
    awaitCompletion = false,
  } = options;

  // 1. Verify agent existence
  const config = AGENT_CONFIGS[agentType];
  if (!config) {
    throw new Error(`Unsupported agent type: ${agentType}`);
  }

  // 2. Sync & check circuit breaker
  await syncCircuitStateFromRedis(agentType);
  const circuit = canExecute(agentType);
  if (!circuit.allowed) {
    const reason = circuit.reason || 'Agent is currently disabled by circuit breaker';
    void recordTrace({
      userId,
      kind: 'RUN_REJECTED',
      subject: agentType,
      summary: `Run refused by circuit breaker.`,
      reasons: [reason],
    });
    throw new Error(reason);
  }

  // 3. Quota check
  const quota = await getUserQuota(userId, agentType, userRole);
  if (!quota.hasQuota) {
    const reason = `Weekly quota reached for ${config.name} (${quota.runsUsed}/${quota.runsLimit} runs used). Upgrade to Pro for unlimited runs.`;
    void recordTrace({
      userId,
      kind: 'RUN_REJECTED',
      subject: agentType,
      summary: 'Run refused: quota exhausted.',
      reasons: [reason],
    });
    throw new Error(reason);
  }

  // 4. Create initial AgentRun database entry
  const correlationId = `CORR-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const initialLog = `[${new Date().toISOString()}] [${correlationId}] Agent run queued: ${config.name}\n`;

  const run = await prisma.agentRun.create({
    data: {
      userId,
      agentType,
      status: 'running',
      parameters: parameters || {},
      logs: initialLog,
      costCents: config.costCents,
      correlationId,
    },
  });

  // 5. Consume quota (refunded automatically if execution fails)
  await consumeQuota(userId, agentType);

  // 6. Award "first_agent_run" badge if not already earned
  try {
    await prisma.userBadge.upsert({
      where: {
        userId_badgeId: { userId, badgeId: 'first_agent_run' },
      },
      update: {},
      create: {
        userId,
        badgeId: 'first_agent_run',
      },
    });
  } catch (_) {}

  // 7. Emit live station event for Visual OS
  try {
    stationBus.emitEvent({
      runId: run.id,
      type: 'step',
      timestamp: Date.now(),
      payload: {
        event: 'worker.start',
        agentType,
        status: 'running',
        correlationId,
      },
    });
  } catch (_) {}

  // 8. Execute in background (registered with serverless waitUntil) or await if requested
  const bgPromise = executeAgentAsync(
    run.id,
    userId,
    agentType,
    { ...parameters, userEmail, userName },
    correlationId,
    config.timeoutMs,
    initialLog
  );

  if (awaitCompletion) {
    const finalResult = await bgPromise;
    return {
      runId: run.id,
      status: finalResult?.ok ? 'completed' : 'failed',
      result: finalResult?.result,
    };
  }

  registerServerlessBackgroundTask(
    bgPromise.catch((err) => {
      console.error(`[ORCHESTRATOR] Unhandled error running agent ${run.id}:`, err);
    })
  );

  return {
    runId: run.id,
    status: 'running',
  };
}

async function executeAgentAsync(
  runId: string,
  userId: string,
  agentType: string,
  parameters: any,
  correlationId: string,
  timeoutMs: number,
  initialLog: string = ''
): Promise<{ ok: boolean; result?: any; error?: string }> {
  const startTime = Date.now();
  let accumulatedLogs = initialLog;
  let lastFlushAt = 0;

  // Throttled log writer: prevents DB write-amplification (Weakness #9)
  const appendLog = async (message: string, forceFlush = false) => {
    const timestamp = new Date().toISOString();
    const formatted = `[${timestamp}] ${message}\n`;
    accumulatedLogs += formatted;

    const now = Date.now();
    if (!forceFlush && now - lastFlushAt < LOG_FLUSH_INTERVAL_MS) {
      return;
    }
    lastFlushAt = now;

    try {
      await prisma.agentRun.update({
        where: { id: runId },
        data: {
          logs: {
            set: accumulatedLogs,
          },
        },
      });
    } catch (_) {}
  };

  try {
    await appendLog(`[ORCHESTRATOR] Starting worker execution (Correlation ID: ${correlationId})...`, true);

    // Check Redis + in-memory cache for identical requests
    const cacheKey = `${agentType}_${JSON.stringify(parameters)}`;
    const cached = await getCachedAgentResultAsync(cacheKey);

    let result: any = null;

    if (cached && process.env.AGENT_FALLBACK_ENABLED !== 'false') {
      await appendLog(`[ORCHESTRATOR] Cache hit! Loaded verified execution snapshot.`);
      result = cached;
    } else {
      const executionPromise = (async () => {
        switch (agentType) {
          case 'reddit_scraper':
            return await executeRedditScraper(parameters, appendLog);
          case 'prediction_arbitrage':
            return await executePredictionArbitrage(parameters, appendLog);
          case 'openclaw_deployer':
            return await executeOpenClawDeployer(parameters, appendLog);
          case 'ai_video_maker':
            return await executeAIVideoMaker(parameters, appendLog);
          case 'micro_saas_builder':
            return await executeMicroSaaSBuilder(parameters, appendLog);
          default:
            throw new Error(`No execution handler for agent type '${agentType}'`);
        }
      })();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`Agent execution exceeded maximum timeout of ${timeoutMs / 1000}s`)),
          timeoutMs
        )
      );

      result = (await Promise.race([executionPromise, timeoutPromise])) as any;

      if (result && result.success === false) {
        throw new Error(result.details || `Agent '${agentType}' reported blocked execution.`);
      }

      if (result && result.success) {
        setCachedAgentResult(cacheKey, result);
      }
    }

    const durationMs = Date.now() - startTime;
    await appendLog(`[ORCHESTRATOR] Agent run completed in ${durationMs}ms with status: SUCCESS.`, true);

    recordSuccess(agentType);

    await prisma.agentRun.update({
      where: { id: runId },
      data: {
        status: 'completed',
        logs: accumulatedLogs,
        result,
        durationMs,
        completedAt: new Date(),
      },
    });

    try {
      stationBus.emitEvent({
        runId,
        type: 'complete',
        timestamp: Date.now(),
        payload: {
          event: 'worker.complete',
          agentType,
          result,
          durationMs,
        },
      });
    } catch (_) {}

    return { ok: true, result };
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    const errorMsg = error?.message || 'Unknown agent execution failure';
    await appendLog(`[ORCHESTRATOR] ERROR: ${errorMsg}`, true);

    recordFailure(agentType);
    // Refund user quota on execution failure (Weakness #10)
    await refundQuota(userId, agentType);

    await prisma.agentRun.update({
      where: { id: runId },
      data: {
        status: 'failed',
        logs: accumulatedLogs,
        errorMessage: errorMsg,
        durationMs,
        completedAt: new Date(),
      },
    });

    try {
      stationBus.emitEvent({
        runId,
        type: 'error',
        timestamp: Date.now(),
        payload: {
          event: 'worker.error',
          agentType,
          error: errorMsg,
          durationMs,
        },
      });
    } catch (_) {}

    return { ok: false, error: errorMsg };
  }
}

export interface WorkflowStepInput {
  agentType: string;
  name?: string;
  parameters?: Record<string, any>;
}

/**
 * Executes a multi-step workflow pipeline sequentially (fixes Weakness #6).
 * Passes each step's output into the subsequent step's parameters and updates
 * the AgentWorkflow status in PostgreSQL.
 */
export async function executeWorkflowPipeline(options: {
  workflowId: string;
  userId: string;
  userRole?: string;
  userEmail?: string;
  userName?: string;
  steps: WorkflowStepInput[];
}): Promise<{ firstRunId: string; runIds: string[] }> {
  const { workflowId, userId, userRole = 'FREE', userEmail, userName, steps } = options;
  if (!Array.isArray(steps) || steps.length === 0) {
    throw new Error('Workflow requires at least 1 step');
  }

  // Launch Step 1 immediately so the caller receives firstRunId right away
  const firstStep = steps[0];
  const firstRun = await launchAgentRun({
    userId,
    agentType: firstStep.agentType,
    parameters: { ...(firstStep.parameters || {}), workflowId, stepIndex: 0 },
    userRole,
    userEmail,
    userName,
    awaitCompletion: steps.length > 1,
  });

  const runIds = [firstRun.runId];

  // Chain remaining steps (steps[1..n-1]) in the background, feeding prior step outputs forward
  if (steps.length > 1) {
    const chainPromise = (async () => {
      let prevResult = firstRun.result;
      let allSucceeded = firstRun.status === 'completed';

      for (let i = 1; i < steps.length && allSucceeded; i++) {
        const step = steps[i];
        const derivedTopic =
          prevResult?.problemsList?.[0]?.problem ||
          prevResult?.appName ||
          prevResult?.summary ||
          step.parameters?.topic;

        const nextParams = {
          ...(step.parameters || {}),
          workflowId,
          stepIndex: i,
          previousStepOutput: prevResult,
          ...(derivedTopic && !step.parameters?.topic && !step.parameters?.ideaPrompt
            ? { topic: derivedTopic, ideaPrompt: derivedTopic }
            : {}),
        };

        try {
          const stepRun = await launchAgentRun({
            userId,
            agentType: step.agentType,
            parameters: nextParams,
            userRole,
            userEmail,
            userName,
            awaitCompletion: true,
          });
          runIds.push(stepRun.runId);
          prevResult = stepRun.result;
          if (stepRun.status !== 'completed') {
            allSucceeded = false;
          }
        } catch {
          allSucceeded = false;
        }
      }

      try {
        await prisma.agentWorkflow.update({
          where: { id: workflowId },
          data: {
            status: allSucceeded ? 'completed' : 'failed',
            lastRunAt: new Date(),
          },
        });
      } catch (_) {}
    })();

    registerServerlessBackgroundTask(chainPromise);
  }

  return { firstRunId: firstRun.runId, runIds };
}
