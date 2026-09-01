import { prisma } from '@/lib/db';
import { canExecute, recordSuccess, recordFailure } from './circuit-breaker';
import { getUserQuota, consumeQuota, AGENT_CONFIGS } from './quota';
import { getCachedAgentResult, setCachedAgentResult } from './cache';
import { executeRedditScraper } from './reddit-scraper';
import { executePredictionArbitrage } from './prediction-arbitrage';
import { executeOpenClawDeployer } from './openclaw-deployer';
import { executeAIVideoMaker } from './ai-video-maker';
import { executeMicroSaaSBuilder } from './micro-saas-builder';

export interface StartAgentOptions {
  userId: string;
  agentType: string;
  parameters: any;
  userRole?: string;
  userEmail?: string;
  userName?: string;
}

export async function launchAgentRun(options: StartAgentOptions): Promise<{ runId: string; status: string }> {
  const { userId, agentType, parameters, userRole = 'FREE', userEmail, userName } = options;

  // 1. Verify agent existence
  const config = AGENT_CONFIGS[agentType];
  if (!config) {
    throw new Error(`Unsupported agent type: ${agentType}`);
  }

  // 2. Circuit breaker check
  const circuit = canExecute(agentType);
  if (!circuit.allowed) {
    throw new Error(circuit.reason || 'Agent is currently disabled by circuit breaker');
  }

  // 3. Quota check
  const quota = await getUserQuota(userId, agentType, userRole);
  if (!quota.hasQuota) {
    throw new Error(
      `Weekly quota reached for ${config.name} (${quota.runsUsed}/${quota.runsLimit} runs used). Upgrade to Pro for unlimited runs.`
    );
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

  // 5. Consume quota
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

  // 7. Execute asynchronously in background
  executeAgentAsync(run.id, agentType, { ...parameters, userEmail, userName }, correlationId, config.timeoutMs).catch(
    (err) => {
      console.error(`[ORCHESTRATOR] Unhandled error running agent ${run.id}:`, err);
    }
  );

  return {
    runId: run.id,
    status: 'running',
  };
}

async function executeAgentAsync(
  runId: string,
  agentType: string,
  parameters: any,
  correlationId: string,
  timeoutMs: number
) {
  const startTime = Date.now();
  let accumulatedLogs = '';

  const appendLog = async (message: string) => {
    const timestamp = new Date().toISOString();
    const formatted = `[${timestamp}] ${message}\n`;
    accumulatedLogs += formatted;

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
    await appendLog(`[ORCHESTRATOR] Starting worker execution (Correlation ID: ${correlationId})...`);

    // Check cache for identical requests
    const cacheKey = `${agentType}_${JSON.stringify(parameters)}`;
    const cached = getCachedAgentResult(cacheKey);

    let result: any = null;

    if (cached && process.env.AGENT_FALLBACK_ENABLED !== 'false') {
      await appendLog(`[ORCHESTRATOR] Cache hit! Loaded verified execution snapshot.`);
      result = cached;
    } else {
      // Race agent execution with timeout promise
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

      // Cache successful result
      if (result && result.success) {
        setCachedAgentResult(cacheKey, result);
      }
    }

    const durationMs = Date.now() - startTime;
    await appendLog(`[ORCHESTRATOR] Agent run completed in ${durationMs}ms with status: SUCCESS.`);

    // Record circuit breaker success
    recordSuccess(agentType);

    // Update database record
    await prisma.agentRun.update({
      where: { id: runId },
      data: {
        status: 'completed',
        result,
        durationMs,
        completedAt: new Date(),
      },
    });
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    const errorMsg = error?.message || 'Unknown agent execution failure';
    await appendLog(`[ORCHESTRATOR] ERROR: ${errorMsg}`);

    // Record circuit breaker failure
    recordFailure(agentType);

    await prisma.agentRun.update({
      where: { id: runId },
      data: {
        status: 'failed',
        errorMessage: errorMsg,
        durationMs,
        completedAt: new Date(),
      },
    });
  }
}
