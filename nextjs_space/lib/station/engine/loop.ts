import crypto from 'crypto';
import { stationBus } from '../bus';
import { calculateTokenCost } from '../ledger';
import { STATION_TOOL_DEFINITIONS, executeToolCall } from '../tools/registry';
import { prisma } from '@/lib/prisma';

export interface AgentRunOptions {
  runId?: string;
  ventureId?: string;
  taskId?: string;
  userId?: string;
  goal: string;
  systemPrompt?: string;
  model?: string;
  maxTurns?: number;
  tools?: string[];
  signal?: AbortSignal;
}

export interface AgentRunResult {
  runId: string;
  success: boolean;
  text: string;
  turns: number;
  tokens: { prompt: number; completion: number; total: number };
  costUsd: number;
  costCents: number;
  toolTrace: Array<{
    name: string;
    args: any;
    result?: any;
    error?: string;
    durationMs: number;
  }>;
  durationMs: number;
}

export async function runStationAgent(options: AgentRunOptions): Promise<AgentRunResult> {
  const runId = options.runId || crypto.randomUUID();
  const startTime = Date.now();
  const model = options.model || process.env.OPENROUTER_DEFAULT_MODEL || 'nvidia/nemotron-3.5-lightning:free';
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY || '';
  const maxTurns = options.maxTurns || 10;

  const system = options.systemPrompt ||
    `You are the Trendly Autonomous Venture Operator running under the "Help Me Help U" (HMHU) bilateral symbiotic protocol.
You have access to a real filesystem and sandbox shell.
- OPERATING DOCTRINE: "Help Me Help U". Never execute in a passive bubble. Whenever you reach a strategic fork, need authorization, or require commercial decisions, invoke the 'hmhu_collaborate' tool.
- RECIPROCITY MANDATE: Always state what value/artifacts you delivered first ("What I built for you"), then ask for the exact decision, credential, or choice you need ("What I need from you"), providing 2-4 concrete 1-click options with a recommended default.
- Use 'hmhu_deliver_value' to record completed milestones into the bilateral ledger.
- Use 'shell_exec', 'fs_write', 'fs_read', 'fs_list' to build, test, and verify deliverables.
- Ship working code, real implementations, zero stubs.`;

  const messages: any[] = [
    { role: 'system', content: system },
    { role: 'user', content: options.goal },
  ];

  let turn = 0;
  let finalResponse = '';
  let promptTokensTotal = 0;
  let completionTokensTotal = 0;
  const toolTrace: AgentRunResult['toolTrace'] = [];

  stationBus.emitEvent({
    runId,
    type: 'step',
    timestamp: Date.now(),
    payload: { status: 'STARTED', goal: options.goal, model },
  });

  while (turn < maxTurns) {
    if (options.signal?.aborted) {
      throw new Error('Agent run aborted by user.');
    }

    turn++;

    const payload: any = {
      model,
      messages,
      tools: STATION_TOOL_DEFINITIONS,
      tool_choice: 'auto',
    };

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://trendforge.app',
        'X-Title': 'Trendly Venture OS',
      },
      body: JSON.stringify(payload),
      signal: options.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`OpenRouter API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    const msg = choice?.message;

    if (data.usage) {
      promptTokensTotal += data.usage.prompt_tokens || 0;
      completionTokensTotal += data.usage.completion_tokens || 0;
    }

    if (!msg) {
      break;
    }

    messages.push(msg);

    if (msg.content) {
      finalResponse += msg.content;
      stationBus.emitEvent({
        runId,
        type: 'token',
        timestamp: Date.now(),
        payload: { delta: msg.content },
      });
    }

    // Check if the model requested tool calls
    if (msg.tool_calls && Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
      for (const call of msg.tool_calls) {
        const fnName = call.function.name;
        let fnArgs = {};
        try {
          fnArgs = JSON.parse(call.function.arguments || '{}');
        } catch {
          fnArgs = {};
        }

        stationBus.emitEvent({
          runId,
          type: 'tool_call',
          timestamp: Date.now(),
          payload: { tool: fnName, args: fnArgs },
        });

        const callStart = Date.now();
        let toolResult: any;
        let toolError: string | undefined;

        try {
          toolResult = await executeToolCall(fnName, fnArgs, { runId, ventureId: options.ventureId });
        } catch (err: any) {
          toolError = err.message || String(err);
          toolResult = { error: toolError };
        }

        const callDuration = Date.now() - callStart;
        toolTrace.push({
          name: fnName,
          args: fnArgs,
          result: toolResult,
          error: toolError,
          durationMs: callDuration,
        });

        stationBus.emitEvent({
          runId,
          type: 'tool_result',
          timestamp: Date.now(),
          payload: { tool: fnName, result: toolResult, error: toolError, durationMs: callDuration },
        });

        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult),
        });
      }
    } else {
      // Model did not call any further tools — task turn is complete
      break;
    }
  }

  const durationMs = Date.now() - startTime;
  const totalTokens = promptTokensTotal + completionTokensTotal;
  const { costUsd, costCents } = calculateTokenCost(model, {
    promptTokens: promptTokensTotal,
    completionTokens: completionTokensTotal,
    totalTokens,
  });

  // Record verified cost into FinancialRecord if attached to a venture
  if (options.ventureId && costCents > 0) {
    try {
      await prisma.financialRecord.create({
        data: {
          ventureId: options.ventureId,
          type: 'AI_COMPUTE_COST',
          amountCents: -Math.abs(costCents),
          currency: 'USD',
          provenance: 'ACTUAL',
          description: `Trendly Native Station Run (${runId.slice(0, 8)}) - ${model}`,
          metadata: { referenceId: runId },
        },
      });
    } catch (e) {
      console.error('[StationLoop] failed to write financial record:', e);
    }
  }

  stationBus.emitEvent({
    runId,
    type: 'complete',
    timestamp: Date.now(),
    payload: { finalResponse, turns: turn, costCents, durationMs },
  });

  return {
    runId,
    success: true,
    text: finalResponse,
    turns: turn,
    tokens: { prompt: promptTokensTotal, completion: completionTokensTotal, total: totalTokens },
    costUsd,
    costCents,
    toolTrace,
    durationMs,
  };
}
