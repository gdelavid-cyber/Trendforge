import { type ChatMessage, type LlmFn } from '@/lib/execution/llm';
import { executeSkill } from '@/lib/intelligence/tools/executor';
import {
  attenuateCapabilities,
  canAgentUseTool,
  resolveStationCapabilities,
  type ResolvedStationCapabilities,
  type StationModuleId,
  STATION_MODULES,
} from './capability-registry';
import { createLoopBreaker, UNKNOWN_TOOL_SUMMARY } from './loop-breaker';
import {
  appendStationBeliefs,
  buildReflectionPrompt,
  createCompletionEvidenceTracker,
  formatRecalledMemoryBlock,
  getStationBeliefs,
  interpretVerification,
  parseAndFilterBeliefs,
  type StationBelief,
} from './reflect-and-verify';

/**
 * TrendForge Station — Native Multi-Turn Autonomous Harness & Overseer Engine
 *
 * Combines the best mechanisms of StarNet's sidecar (`loop.js`, `loop-breaker.js`,
 * `capGate.js`, `reflect.js`, `verify.js`, `completion-evidence.js`, `overseer.js`)
 * with Trendly's 17 live Web4 skills, multi-tenant Redis/Prisma storage, and
 * real-time telemetry.
 */

export interface StationRunOptions {
  userId?: string;
  agentId?: string;
  sessionId?: string;
  enabledModules?: StationModuleId[];
  maxTurns?: number;
  maxBudgetUsdc?: number;
  enableReflection?: boolean;
  unattended?: boolean;
  /**
   * Underlying model transport used for reasoning turns.
   * Defaults to Trendly's platform callLLM chain.
   */
  baseLlm?: LlmFn;
  /**
   * Internal recursion depth for `crew.delegate` sub-agents (capped at 2).
   */
  delegationDepth?: number;
  resolvedCapabilities?: ResolvedStationCapabilities;
}

export interface StationToolTrace {
  turn: number;
  callId: string;
  tool: string;
  module?: StationModuleId;
  args: Record<string, any>;
  ok: boolean;
  costUsdc: number;
  summary: string;
  output: any;
}

export interface StationRunResult {
  reply: string;
  status: 'complete' | 'blocked' | 'stopped_by_loop_breaker';
  reason?: string;
  turnsUsed: number;
  spentBudgetUsdc: number;
  toolTraces: StationToolTrace[];
  evidence: ReturnType<ReturnType<typeof createCompletionEvidenceTracker>['snapshot']>;
  newBeliefs: StationBelief[];
}

const TOOL_CALL_REGEX = /<station_tool_call>\s*([\s\S]*?)\s*<\/station_tool_call>/gi;

export function parseStationToolCalls(
  text: string
): Array<{ id: string; name: string; args: Record<string, any>; parseError?: boolean }> {
  const calls: Array<{ id: string; name: string; args: Record<string, any>; parseError?: boolean }> = [];
  let match: RegExpExecArray | null;
  const re = new RegExp(TOOL_CALL_REGEX.source, 'gi');
  let idx = 0;

  while ((match = re.exec(text)) !== null) {
    idx++;
    const rawJson = match[1].trim();
    try {
      const parsed = JSON.parse(rawJson);
      const name = String(parsed.tool || parsed.name || '').trim();
      const args =
        parsed.args && typeof parsed.args === 'object'
          ? parsed.args
          : parsed.arguments && typeof parsed.arguments === 'object'
          ? parsed.arguments
          : {};
      if (name) {
        calls.push({ id: `call_${idx}`, name, args });
      }
    } catch {
      calls.push({ id: `call_${idx}`, name: 'invalid_json', args: {}, parseError: true });
    }
  }
  return calls;
}

function stripToolCallsFromReply(text: string): string {
  return String(text ?? '').replace(TOOL_CALL_REGEX, '').trim();
}

function buildStationSystemHeader(
  resolved: ResolvedStationCapabilities,
  recalledBlock: string,
  jsonMode: boolean
): string {
  const toolLines = resolved.tools
    .slice(0, 26)
    .map((t) => {
      const g = resolved.grantsByTool[t];
      return g ? `- ${t} [${g.module}]: ${g.description}` : `- ${t}`;
    })
    .join('\n');

  const modeHint = jsonMode
    ? 'IMPORTANT: Your final reply (once you finish any needed tool calls) MUST be valid JSON only.'
    : '';

  return [
    `[TRENDFORGE STATION AUTONOMOUS HARNESS — AGENT: ${resolved.agentId.toUpperCase()}]`,
    `Active Station Modules: ${resolved.enabledModules.join(', ')} | Run Budget Ceiling: $${resolved.maxBudgetUsdc.toFixed(2)} USDC`,
    recalledBlock,
    `Granted Station Tools:`,
    toolLines,
    `To invoke a tool before giving your final answer, emit one or more blocks in this exact format:`,
    `<station_tool_call>{"tool": "tool_name", "args": {"key": "value"}}</station_tool_call>`,
    `When you have sufficient verified evidence (or if no tool call is needed), respond directly without <station_tool_call> tags.`,
    modeHint,
  ]
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Executes a full multi-turn autonomous run on the native TrendForge Station engine.
 */
export async function runStationAutonomousLoop(
  messages: ChatMessage[],
  jsonMode = false,
  opts: StationRunOptions = {}
): Promise<StationRunResult> {
  const userId = opts.userId || 'anon';
  const agentId = opts.agentId || 'overseer';
  const maxTurns = Math.min(Math.max(opts.maxTurns ?? 4, 1), 8);
  const delegationDepth = opts.delegationDepth ?? 0;

  const resolved =
    opts.resolvedCapabilities ??
    resolveStationCapabilities({
      userId,
      agentId,
      enabledModules: opts.enabledModules,
      maxBudgetUsdc: opts.maxBudgetUsdc,
    });

  if (!resolved.hasCompute) {
    throw new Error(
      'BLOCKED by TrendForge Station: Compute gate is offline (enable command_computer module).'
    );
  }

  // Resolve underlying model function (defaults to platform callLLM)
  const baseLlm: LlmFn =
    opts.baseLlm ??
    (async (msgs, jMode) => {
      const { callLLM } = await import('@/lib/pipeline');
      return (callLLM as unknown as LlmFn)(msgs, jMode);
    });

  const existingBeliefs = await getStationBeliefs(userId);
  const recalledBlock = formatRecalledMemoryBlock(existingBeliefs);
  const stationHeader = buildStationSystemHeader(resolved, recalledBlock, jsonMode);

  const workingMessages: ChatMessage[] = messages.map((m, idx) =>
    idx === 0 && m.role === 'system'
      ? { role: 'system', content: `${stationHeader}\n\n${m.content}` }
      : { ...m }
  );
  if (!workingMessages.some((m) => m.role === 'system')) {
    workingMessages.unshift({ role: 'system', content: stationHeader });
  }

  const loopBreaker = createLoopBreaker({ unattended: opts.unattended ?? true });
  const evidenceTracker = createCompletionEvidenceTracker();
  const toolTraces: StationToolTrace[] = [];
  const missionChecklist: string[] = [];
  const deliverables: Array<{ title: string; summary: string }> = [];

  let finalReply = '';
  let turnsUsed = 0;

  for (let turn = 1; turn <= maxTurns; turn++) {
    turnsUsed = turn;
    const isLastTurn = turn === maxTurns;
    const rawOutput = await baseLlm(workingMessages, isLastTurn ? jsonMode : false);
    const toolCalls = isLastTurn ? [] : parseStationToolCalls(rawOutput);

    // If the model produced no tool calls, it has reached its final answer
    if (toolCalls.length === 0) {
      finalReply = stripToolCallsFromReply(rawOutput) || rawOutput.trim();
      break;
    }

    const turnResults: Array<{
      callId: string;
      isError: boolean;
      summary: string;
      content: string;
    }> = [];

    for (const call of toolCalls) {
      if (call.parseError) {
        turnResults.push({
          callId: call.id,
          isError: true,
          summary: 'json-parse-error',
          content: 'Malformed JSON in <station_tool_call>. Ensure valid JSON syntax.',
        });
        continue;
      }

      const gate = canAgentUseTool(resolved, call.name);
      if (!gate.ok) {
        const isUnknown = gate.reason?.startsWith('Unknown tool');
        const summary = isUnknown ? UNKNOWN_TOOL_SUMMARY : 'capdenied';
        turnResults.push({
          callId: call.id,
          isError: true,
          summary,
          content: gate.reason || `Capability denied for ${call.name}`,
        });
        toolTraces.push({
          turn,
          callId: call.id,
          tool: call.name,
          module: gate.requiredModule,
          args: call.args,
          ok: false,
          costUsdc: 0,
          summary: gate.reason || 'capdenied',
          output: null,
        });
        evidenceTracker.observeToolExecution({
          callId: call.id,
          toolName: call.name,
          ok: false,
          summary: gate.reason || 'capdenied',
        });
        continue;
      }

      const grant = gate.grant!;
      let toolOk = true;
      let toolSummary = '';
      let toolOutput: any = null;

      try {
        if (call.name === 'station.inspect') {
          toolOutput = {
            agentId: resolved.agentId,
            enabledModules: resolved.enabledModules.map((id) => ({
              id,
              name: STATION_MODULES[id]?.name,
              zone: STATION_MODULES[id]?.zone,
            })),
            grantedToolsCount: resolved.tools.length,
            budgetRemainingUsdc: Number((resolved.maxBudgetUsdc - resolved.spentBudgetUsdc).toFixed(4)),
            missionChecklist,
            deliverables,
          };
          toolSummary = `Station online (${resolved.enabledModules.length} modules active)`;
        } else if (call.name === 'notebook.read') {
          const beliefs = await getStationBeliefs(userId);
          toolOutput = { count: beliefs.length, beliefs: beliefs.slice(-20) };
          toolSummary = `Recalled ${beliefs.length} station beliefs`;
        } else if (call.name === 'notebook.write') {
          const kind = String(call.args.kind || 'fact').toLowerCase() === 'profile' ? 'profile' : 'fact';
          const content = String(call.args.content || call.args.text || '').trim();
          const parsed = parseAndFilterBeliefs(
            `${kind === 'profile' ? 'PREFERENCE' : 'FACT'}: ${content}`,
            userId,
            await getStationBeliefs(userId),
            1
          );
          if (parsed.length > 0) {
            await appendStationBeliefs(userId, parsed);
            toolOutput = { saved: true, belief: parsed[0] };
            toolSummary = `Saved durable ${kind} to Cortex Memory Core`;
          } else {
            toolOutput = { saved: false, reason: 'Filtered as duplicate, transient, or invalid' };
            toolSummary = 'Belief skipped (duplicate or transient)';
          }
        } else if (call.name === 'quest.update') {
          const items = Array.isArray(call.args.steps)
            ? call.args.steps.map(String)
            : [String(call.args.goal || call.args.status || 'Updated plan')];
          missionChecklist.splice(0, missionChecklist.length, ...items);
          toolOutput = { checklist: missionChecklist };
          toolSummary = `Mission plan updated (${missionChecklist.length} steps)`;
        } else if (call.name === 'deliverable.note') {
          const title = String(call.args.title || 'Deliverable').slice(0, 120);
          const summary = String(call.args.summary || '').slice(0, 280);
          deliverables.push({ title, summary });
          toolOutput = { registered: true, title, summary };
          toolSummary = `Registered deliverable: ${title}`;
        } else if (call.name === 'verify.run') {
          const checkOut = String(call.args.output || call.args.evidence || '1 passed');
          const exitCode = Number(call.args.exitCode ?? 0);
          const verdict = interpretVerification({ exitCode, out: checkOut });
          toolOutput = verdict;
          toolSummary = verdict.passed ? `verify passed: ${verdict.summary}` : `verify failed: ${verdict.summary}`;
          toolOk = verdict.passed;
        } else if (call.name === 'crew.delegate') {
          if (delegationDepth >= 2) {
            throw new Error('Maximum crew delegation depth (2) reached.');
          }
          const workerId = String(call.args.specialist || call.args.agentId || 'specialist_worker').slice(0, 40);
          const subTask = String(call.args.task || call.args.prompt || '').trim();
          const requestedTools = Array.isArray(call.args.allowedTools)
            ? call.args.allowedTools.map(String)
            : resolved.tools.filter((t) => t !== 'crew.delegate');

          // Monotonic capability attenuation: sub-agent only gets parent ∩ requestedTools
          const workerCaps = attenuateCapabilities(
            resolved,
            workerId,
            requestedTools,
            Number(call.args.maxBudgetUsdc ?? 1.0)
          );

          const subResult = await runStationAutonomousLoop(
            [
              {
                role: 'system',
                content: `You are specialist crew agent '${workerId}' delegated by the Station Overseer. Complete the assigned sub-task concisely with verified facts.`,
              },
              { role: 'user', content: subTask },
            ],
            false,
            {
              ...opts,
              agentId: workerId,
              maxTurns: 2,
              enableReflection: false,
              delegationDepth: delegationDepth + 1,
              resolvedCapabilities: workerCaps,
            }
          );

          resolved.spentBudgetUsdc += subResult.spentBudgetUsdc;
          toolOutput = {
            specialist: workerId,
            status: subResult.status,
            reply: subResult.reply,
            toolTracesCount: subResult.toolTraces.length,
          };
          toolSummary = `Specialist '${workerId}' completed sub-task (${subResult.toolTraces.length} tool calls)`;
        } else {
          // Execute real Trendly Web4 skill from executor.ts
          const execRes = await executeSkill(call.name, call.args);
          if (execRes.status !== 'SUCCESS') {
            toolOk = false;
            toolSummary = execRes.error || execRes.outputSummary || 'Skill execution failed';
            toolOutput = { error: toolSummary };
          } else {
            toolOk = true;
            toolSummary = execRes.outputSummary;
            toolOutput = execRes.result;
          }
        }
      } catch (err: any) {
        toolOk = false;
        toolSummary = err?.message || 'Tool execution error';
        toolOutput = { error: toolSummary };
      }

      if (toolOk) {
        resolved.spentBudgetUsdc += grant.computeCostUsdc;
      }

      const serializedOutput = JSON.stringify(toolOutput).slice(0, 2400);
      turnResults.push({
        callId: call.id,
        isError: !toolOk,
        summary: toolSummary,
        content: serializedOutput,
      });

      toolTraces.push({
        turn,
        callId: call.id,
        tool: call.name,
        module: grant.module,
        args: call.args,
        ok: toolOk,
        costUsdc: toolOk ? grant.computeCostUsdc : 0,
        summary: toolSummary,
        output: toolOutput,
      });

      evidenceTracker.observeToolExecution({
        callId: call.id,
        toolName: call.name,
        ok: toolOk,
        summary: toolSummary,
        result: toolOutput,
      });
    }

    // Check deterministic Loop Breaker after executing the turn's tool calls
    const breakerVerdict = loopBreaker.observe(toolCalls, turnResults);

    workingMessages.push({
      role: 'assistant',
      content: rawOutput,
    });

    const toolFeedbackLines = turnResults.map(
      (r) => `[Tool Result ${r.callId} (${r.isError ? 'ERROR' : 'OK'} — ${r.summary})]:\n${r.content}`
    );
    if (breakerVerdict.notes.length > 0) {
      toolFeedbackLines.push(...breakerVerdict.notes);
    }

    if (breakerVerdict.stop) {
      return {
        reply: stripToolCallsFromReply(rawOutput) || `Stopped by Station Loop Breaker: ${breakerVerdict.stop.message}`,
        status: 'stopped_by_loop_breaker',
        reason: breakerVerdict.stop.message,
        turnsUsed,
        spentBudgetUsdc: Number(resolved.spentBudgetUsdc.toFixed(4)),
        toolTraces,
        evidence: evidenceTracker.snapshot(),
        newBeliefs: [],
      };
    }

    workingMessages.push({
      role: 'user',
      content:
        toolFeedbackLines.join('\n\n') +
        '\n\nUse the verified tool observations above to continue or provide your final response.',
    });
  }

  // If the loop reached maxTurns while still emitting tool calls, request a final synthesis
  if (!finalReply) {
    finalReply = (await baseLlm(workingMessages, jsonMode)).trim();
  }

  // Post-run Cortex Reflection (extracts durable FACTS & PREFERENCES without secrets or noise)
  let newBeliefs: StationBelief[] = [];
  if (opts.enableReflection !== false && finalReply.length >= 120) {
    try {
      const reflectionExchange = [
        ...messages.filter((m) => m.role === 'user' || m.role === 'assistant'),
        { role: 'assistant' as const, content: finalReply },
      ];
      const reflectPrompt = buildReflectionPrompt(reflectionExchange, existingBeliefs);
      const rawProposals = await baseLlm(
        [
          {
            role: 'system',
            content: 'You are the TrendForge Station Cortex memory distiller. Output only FACT: or PREFERENCE: lines, or NONE.',
          },
          { role: 'user', content: reflectPrompt },
        ],
        false
      );
      newBeliefs = parseAndFilterBeliefs(rawProposals, userId, existingBeliefs, 3);
      if (newBeliefs.length > 0) {
        await appendStationBeliefs(userId, newBeliefs);
      }
    } catch {
      // Reflection is non-blocking and never fails the primary run
    }
  }

  return {
    reply: finalReply,
    status: 'complete',
    turnsUsed,
    spentBudgetUsdc: Number(resolved.spentBudgetUsdc.toFixed(4)),
    toolTraces,
    evidence: evidenceTracker.snapshot(),
    newBeliefs,
  };
}

/**
 * Adapter that wraps `runStationAutonomousLoop` as a standard Trendly `LlmFn`.
 * Plugs directly into `makeLlm()` (`LLM_PROVIDER=station`) and BYOK brains (`provider: 'station'`).
 */
export function trendforgeStationLlm(opts: StationRunOptions = {}): LlmFn {
  return async (messages, jsonMode = false) => {
    const result = await runStationAutonomousLoop(messages, jsonMode, opts);
    if (result.status === 'blocked') {
      throw new Error(`BLOCKED by TrendForge Station: ${result.reason || 'Station gate denied execution'}`);
    }
    return result.reply;
  };
}
