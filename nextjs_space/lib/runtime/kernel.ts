import { createHash } from 'crypto';
import { recordDecision, summarize, type GateType, type ActionTaken } from '@/lib/observability/collector';
import { stationBus } from '@/lib/station/bus';

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant' | string;
  content: string;
};

export type LlmFn = (
  messages: ChatMessage[],
  jsonMode?: boolean
) => Promise<string>;

export interface KernelCallOptions {
  messages: ChatMessage[];
  jsonMode?: boolean;
  userId?: string;
  ventureId?: string;
  runId?: string;
  agentId?: string;
  gateType?: GateType | string;
  threshold?: number;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  modelOverride?: string;
  providerOverride?: 'station' | 'starnet' | 'inferhub' | 'openai' | 'openrouter' | 'abacusai' | 'opencode' | 'ollama';
  existingNames?: Set<string>;
  skipTelemetry?: boolean;
}

export interface KernelBudgetStatus {
  totalSpendUsd: number;
  systemBudgetUsd: number;
  userSpendUsd: number;
  userLimitUsd: number;
  ventureSpendUsd?: number;
  ventureLimitUsd?: number;
  isAllowed: boolean;
  reason?: string;
}

// In-memory operational budget accounting per day
interface DailySpendTracker {
  day: string;
  systemSpend: number;
  userSpend: Map<string, number>;
  ventureSpend: Map<string, number>;
}

const currentSpendTracker: DailySpendTracker = {
  day: new Date().toISOString().slice(0, 10),
  systemSpend: 0,
  userSpend: new Map<string, number>(),
  ventureSpend: new Map<string, number>(),
};

function getDailyTracker(): DailySpendTracker {
  const today = new Date().toISOString().slice(0, 10);
  if (currentSpendTracker.day !== today) {
    currentSpendTracker.day = today;
    currentSpendTracker.systemSpend = 0;
    currentSpendTracker.userSpend.clear();
    currentSpendTracker.ventureSpend.clear();
  }
  return currentSpendTracker;
}

/**
 * Unified Kernel Runtime
 * Centralizes LLM provider dispatch, multi-tier fallbacks, token budget enforcement,
 * and automatic Jev gate decision logging across all autonomous agents.
 */
export class KernelRuntime {
  private static instance: KernelRuntime;

  public static getInstance(): KernelRuntime {
    if (!KernelRuntime.instance) {
      KernelRuntime.instance = new KernelRuntime();
    }
    return KernelRuntime.instance;
  }

  /**
   * Evaluates system-level, per-user, and per-venture spending limits against configured caps.
   */
  public checkBudget(userId?: string, ventureId?: string): KernelBudgetStatus {
    const tracker = getDailyTracker();
    const systemBudgetUsd = Number(process.env.BRAIN_LLM_COST_BUDGET || process.env.SYSTEM_DAILY_LLM_BUDGET || 200);
    const userLimitUsd = Number(process.env.AGENT_USER_SPENDING_LIMIT || 10);
    const ventureLimitUsd = Number(process.env.VENTURE_DAILY_LLM_BUDGET || 50);

    const userSpendUsd = userId ? (tracker.userSpend.get(userId) || 0) : 0;
    const ventureSpendUsd = ventureId ? (tracker.ventureSpend.get(ventureId) || 0) : 0;
    const totalSpendUsd = tracker.systemSpend;

    if (totalSpendUsd >= systemBudgetUsd) {
      return {
        totalSpendUsd,
        systemBudgetUsd,
        userSpendUsd,
        userLimitUsd,
        ventureSpendUsd,
        ventureLimitUsd,
        isAllowed: false,
        reason: `System daily LLM budget reached ($${totalSpendUsd.toFixed(2)} / $${systemBudgetUsd})`,
      };
    }

    if (userId && userSpendUsd >= userLimitUsd) {
      return {
        totalSpendUsd,
        systemBudgetUsd,
        userSpendUsd,
        userLimitUsd,
        ventureSpendUsd,
        ventureLimitUsd,
        isAllowed: false,
        reason: `User daily spending limit reached ($${userSpendUsd.toFixed(2)} / $${userLimitUsd})`,
      };
    }

    if (ventureId && ventureSpendUsd >= ventureLimitUsd) {
      return {
        totalSpendUsd,
        systemBudgetUsd,
        userSpendUsd,
        userLimitUsd,
        ventureSpendUsd,
        ventureLimitUsd,
        isAllowed: false,
        reason: `Venture daily LLM budget reached ($${ventureSpendUsd.toFixed(2)} / $${ventureLimitUsd})`,
      };
    }

    return {
      totalSpendUsd,
      systemBudgetUsd,
      userSpendUsd,
      userLimitUsd,
      ventureSpendUsd,
      ventureLimitUsd,
      isAllowed: true,
    };
  }

  /**
   * Records incremental compute cost against the daily tracking ledger.
   */
  public recordSpend(costUsd: number, userId?: string, ventureId?: string): void {
    const tracker = getDailyTracker();
    tracker.systemSpend += costUsd;
    if (userId) {
      const prev = tracker.userSpend.get(userId) || 0;
      tracker.userSpend.set(userId, prev + costUsd);
    }
    if (ventureId) {
      const prev = tracker.ventureSpend.get(ventureId) || 0;
      tracker.ventureSpend.set(ventureId, prev + costUsd);
    }
  }

  /**
   * Primary entrypoint: executes unified LLM completion with centralized budget checks,
   * provider fallback cascade, and automatic Jev telemetry.
   */
  public async call(options: KernelCallOptions): Promise<string> {
    const startTime = Date.now();
    const {
      messages,
      jsonMode = false,
      userId,
      ventureId,
      runId,
      agentId = 'kernel-runtime',
      gateType = 'model_routing',
      threshold = 0.5,
      timeoutMs = 25000,
      skipTelemetry = false,
    } = options;

    const inputSummary = summarize(messages);
    const inputHash = createHash('sha256')
      .update(inputSummary)
      .digest('hex')
      .slice(0, 16);

    // 1. Centralized Budget Gate
    const budget = this.checkBudget(userId, ventureId);
    if (!budget.isAllowed) {
      const errMessage = `[KernelRuntime] BLOCKED: ${budget.reason}`;
      if (!skipTelemetry) {
        await recordDecision({
          runId: runId || null,
          agentId,
          userId: userId || null,
          gateType,
          primitive: 'choice',
          question: `KernelRuntime token budget gate for ${gateType}`,
          answer: { status: 'blocked', reason: budget.reason, spend: budget.totalSpendUsd },
          threshold,
          inputSummary,
          inputHash,
          latencyMs: Date.now() - startTime,
          costUsd: 0,
          actionTaken: 'blocked',
        });
      }
      throw new Error(errMessage);
    }

    // 2. Determine Primary Provider
    const inferKey = process.env.INFER_API_KEY || process.env.INFERDEV_API_KEY || process.env.INFERHUB_API_KEY;
    const preferredProvider =
      options.providerOverride ||
      (process.env.LLM_PROVIDER as any) ||
      (inferKey ? 'infer.dev' : null) ||
      (process.env.OPENAI_API_KEY ? 'openai' : null) ||
      (process.env.OPENROUTER_API_KEY ? 'openrouter' : null) ||
      (process.env.ABACUSAI_API_KEY ? 'abacusai' : null) ||
      'fallback';

    let content = '';
    let selectedProvider = preferredProvider;
    let selectedModel = options.modelOverride || 'default';
    let actionTaken: ActionTaken = 'allowed';
    let costUsd = 0.000042; // default nominal base

    try {
      // 3. Provider Cascade Execution
      if (preferredProvider === 'station') {
        const { trendforgeStationLlm } = await import('@/lib/station/engine');
        const stationLlm = trendforgeStationLlm({
          userId,
          agentId,
          sessionId: runId,
        });
        content = await stationLlm(messages, jsonMode);
        selectedModel = 'trendforge-station';
      } else if (preferredProvider === 'starnet') {
        const { starnetServeLlm } = await import('@/lib/execution/starnet-serve');
        const starnetFn = starnetServeLlm({
          userId,
          agent: agentId,
          model: options.modelOverride,
        });
        content = await starnetFn(messages, jsonMode);
        selectedModel = options.modelOverride || 'starnet-crew';
      } else if (preferredProvider === 'opencode') {
        const { opencodeServeLlm } = await import('@/lib/execution/opencode-serve');
        const serveUrl = process.env.OPENCODE_SERVE_URL;
        if (serveUrl) {
          const serveFn = opencodeServeLlm(serveUrl);
          content = await serveFn(messages, jsonMode);
        } else {
          const { opencodeRunLlm } = await import('@/lib/execution/llm');
          const runFn = opencodeRunLlm(options.modelOverride);
          content = await runFn(messages, jsonMode);
        }
        selectedModel = options.modelOverride || 'opencode';
      } else {
        // HTTP API Waterfall (InferHub -> OpenAI -> OpenRouter -> AbacusAI)
        const httpResult = await this.executeHttpWaterfall(options, timeoutMs);
        content = httpResult.content;
        selectedProvider = httpResult.provider;
        selectedModel = httpResult.model;
        costUsd = httpResult.costUsd;
      }
    } catch (err: any) {
      console.warn(`[KernelRuntime] Provider '${selectedProvider}' failed (${err.message}), evaluating fallback.`);

      // Check if StarNet explicit block was thrown (preserve truthful telemetry)
      if (String(err?.message || '').startsWith('BLOCKED by StarNet station:')) {
        actionTaken = 'blocked';
        await recordDecision({
          runId: runId || null,
          agentId,
          userId: userId || null,
          gateType,
          primitive: 'choice',
          question: `StarNet station capability execution`,
          answer: { error: err.message },
          threshold,
          inputSummary,
          inputHash,
          latencyMs: Date.now() - startTime,
          costUsd: 0,
          actionTaken: 'blocked',
        });
        throw err;
      }

      // Secondary Fallback: Procedural / Rule-based synthesis
      actionTaken = 'fallback_to_rule';
      const fallbackResult = await this.executeProceduralFallback(messages, options.existingNames);
      content = fallbackResult;
      selectedProvider = 'procedural_blueprint_fallback';
      selectedModel = 'deterministic_rule_engine';
    }

    const latencyMs = Math.max(1, Date.now() - startTime);
    this.recordSpend(costUsd, userId, ventureId);

    // If ventureId provided, record to AgentSpend table asynchronously
    if (ventureId) {
      const tokensIn = Math.round(JSON.stringify(messages).length / 4);
      const tokensOut = Math.round(content.length / 4);
      import('@/lib/prisma').then(({ prisma }) => {
        prisma.agentSpend.create({
          data: {
            ventureId,
            agentRole: agentId || 'OPERATIONS',
            toolName: String(gateType || 'llm_call'),
            costCents: Math.max(1, Math.round(costUsd * 100)),
            modelUsed: selectedModel,
            tokensIn,
            tokensOut,
          },
        }).catch(() => {});
      }).catch(() => {});
    }

    // 4. Automatic Jev Telemetry Logging
    if (!skipTelemetry) {
      await recordDecision({
        runId: runId || null,
        agentId,
        userId: userId || null,
        gateType,
        primitive: 'choice',
        question: `KernelRuntime model routing: ${gateType}`,
        answer: {
          provider: selectedProvider,
          model: selectedModel,
          jsonMode,
          length: content.length,
        },
        threshold,
        inputSummary,
        inputHash,
        latencyMs,
        costUsd,
        actionTaken,
      });

      try {
        stationBus.emitEvent({
          runId: runId || 'kernel-runtime',
          type: 'step',
          timestamp: Date.now(),
          payload: {
            event: 'kernel.llm.completion',
            provider: selectedProvider,
            model: selectedModel,
            gateType,
            latencyMs,
            costUsd,
            actionTaken,
          },
        });
      } catch (_) {}
    }

    return content;
  }

  /**
   * HTTP Multi-Provider Waterfall with unified headers, request timeouts, and token estimation.
   */
  private async executeHttpWaterfall(
    options: KernelCallOptions,
    timeoutMs: number
  ): Promise<{ content: string; provider: string; model: string; costUsd: number }> {
    const { messages, jsonMode = false, modelOverride } = options;

    // 0. Local Ollama if requested or configured
    const ollamaUrl = process.env.OLLAMA_URL;
    if (options.providerOverride === 'ollama' || (ollamaUrl && !process.env.OPENROUTER_API_KEY && !process.env.OPENAI_API_KEY)) {
      try {
        const ollamaRes = await fetch(`${(ollamaUrl || 'http://localhost:11434').replace(/\/$/, '')}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: modelOverride || 'llama3.2',
            messages,
            stream: false,
          }),
          signal: AbortSignal.timeout(Math.min(timeoutMs, 5000)),
        });
        if (ollamaRes.ok) {
          const oData = await ollamaRes.json();
          const content = oData?.message?.content || '';
          if (content) {
            return {
              content,
              provider: 'ollama',
              model: modelOverride || 'llama3.2',
              costUsd: 0,
            };
          }
        }
      } catch (_) {
        // Fall through to cloud waterfall
      }
    }

    let endpoint = 'https://apps.abacus.ai/v1/chat/completions';
    let model = modelOverride || 'gpt-5.4-mini';
    let provider = 'abacusai';

    const inferKey = process.env.INFER_API_KEY || process.env.INFERDEV_API_KEY || process.env.INFERHUB_API_KEY;
    const inferBase = process.env.INFER_BASE_URL || process.env.INFERDEV_BASE_URL || process.env.INFERHUB_BASE_URL;
    const inferModel = process.env.INFER_MODEL || process.env.INFERDEV_MODEL || process.env.INFERHUB_MODEL;

    let apiKey = inferKey || process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY || process.env.ABACUSAI_API_KEY;

    if (!apiKey) {
      throw new Error('No valid external LLM API key configured');
    }

    if (inferKey) {
      provider = 'infer.dev';
      endpoint = inferBase
        ? `${inferBase.replace(/\/$/, '')}/chat/completions`
        : 'https://api.inferhub.dev/v1/chat/completions';
      model = modelOverride || inferModel || 'ali/qwen3.8-flash';
      apiKey = inferKey;
    } else if (process.env.OPENAI_API_KEY) {
      provider = 'openai';
      endpoint = 'https://api.openai.com/v1/chat/completions';
      model = modelOverride || 'gpt-4o-mini';
      apiKey = process.env.OPENAI_API_KEY;
    } else if (process.env.OPENROUTER_API_KEY && !process.env.ABACUSAI_API_KEY) {
      provider = 'openrouter';
      endpoint = 'https://openrouter.ai/api/v1/chat/completions';
      model = modelOverride || process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct';
      apiKey = process.env.OPENROUTER_API_KEY;
    } else if (process.env.ABACUSAI_API_KEY) {
      provider = 'abacusai';
      apiKey = process.env.ABACUSAI_API_KEY;
    }

    const formattedMessages = [...messages];
    if (jsonMode) {
      const hasJson = formattedMessages.some((m) => m.content && m.content.toLowerCase().includes('json'));
      if (!hasJson && formattedMessages.length > 0) {
        const last = formattedMessages[formattedMessages.length - 1];
        formattedMessages[formattedMessages.length - 1] = {
          ...last,
          content: `${last.content}\nOutput valid JSON only.`,
        };
      }
    }

    const body: Record<string, any> = {
      model,
      messages: formattedMessages,
      max_tokens: options.maxTokens || 3000,
    };
    if (jsonMode) {
      body.response_format = { type: 'json_object' };
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };

    if (inferKey && (endpoint.includes('inferhub.dev') || endpoint.includes('infer.dev'))) {
      headers['x-api-key'] = apiKey;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Upstream LLM (${provider}/${model}) returned status ${response.status}: ${errText.slice(0, 200)}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content ?? '';

    // Estimate token-based cost
    const totalTokens = data?.usage?.total_tokens || Math.round((content.length + JSON.stringify(messages).length) / 4);
    const costPerMillion = provider === 'openai' ? 0.30 : provider === 'inferhub' ? 0.20 : 0.40;
    const costUsd = Math.max(0.000042, (totalTokens / 1_000_000) * costPerMillion);

    return { content, provider, model, costUsd };
  }

  /**
   * Procedural Blueprint & Rule-based fallback for cold/offline operations.
   */
  private async executeProceduralFallback(
    messages: ChatMessage[],
    existingNames?: Set<string>
  ): Promise<string> {
    const systemPrompt = messages.find((m) => m.role === 'system')?.content || '';
    const userPrompt = messages.find((m) => m.role === 'user')?.content || '';

    if (systemPrompt.includes('cluster forum posts') || systemPrompt.includes('commercial themes')) {
      return ''; // Report pending honestly
    }

    const { generateProceduralTrends, TREND_BLUEPRINTS } = await import('@/lib/pipeline');

    if (systemPrompt.includes('trend detection AI')) {
      const trends = generateProceduralTrends(3, existingNames);
      return JSON.stringify({ trends });
    }

    if (systemPrompt.includes('task generation AI') || userPrompt.includes('task')) {
      const matchingBlueprint = TREND_BLUEPRINTS.find((bp: any) => userPrompt.includes(bp.prefix)) || TREND_BLUEPRINTS[0];
      if (matchingBlueprint) {
        const targetMatch =
          matchingBlueprint.targets.find((t: string) => userPrompt.includes(t)) || matchingBlueprint.targets[0];
        const steps = matchingBlueprint.steps.map((s: string) => s.replace(/\{TARGET\}/g, targetMatch));

        const singleTask = {
          title: `Monetize ${matchingBlueprint.prefix} ${targetMatch}`,
          description: `Actionable execution framework to acquire paying clients and deploy solutions for ${targetMatch}.`,
          steps,
          difficulty: 'LOW',
          startup_cost: matchingBlueprint.startupCost,
          time_to_first_dollar: matchingBlueprint.time,
          earnings_low: matchingBlueprint.baseEarningsLow,
          earnings_high: matchingBlueprint.baseEarningsHigh,
          risk_level: 'LOW',
          risk_explanation: 'Minimal startup capital required. Downside limited to setup and outreach time.',
          mitigation_strategy: 'Offer free demonstration or pilot before locking in full retainer.',
          pro_tip: matchingBlueprint.proTip,
        };

        return JSON.stringify({
          ...singleTask,
          tasks: [singleTask],
        });
      }
    }

    return '';
  }

  /**
   * Factory function providing an `LlmFn` compliant closure for skill runners and companions.
   */
  public createLlmFn(baseOpts?: Partial<KernelCallOptions>): LlmFn {
    return async (messages: ChatMessage[], jsonMode?: boolean) => {
      return this.call({
        ...baseOpts,
        messages,
        jsonMode: jsonMode !== undefined ? jsonMode : baseOpts?.jsonMode,
      });
    };
  }
}

export const kernelRuntime = KernelRuntime.getInstance();
