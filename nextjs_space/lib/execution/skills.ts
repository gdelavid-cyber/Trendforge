import { callLLM } from '@/lib/pipeline';
import type { ParsedStep } from '@/lib/tasks/steps';

// Step handlers turn a step into work. Internal actions run through the LLM;
// external actions never execute here — the engine converts them into
// Approval rows before any handler would fire.

export interface StepContext {
  taskTitle: string;
  companionName: string;
  previousResults: string[];
}

export interface StepOutcome {
  output: string;
  costUsd: number;
}

export type LlmFn = (messages: { role: string; content: string }[], jsonMode?: boolean) => Promise<string>;

export interface StepRunner {
  canHandle(action: string): boolean;
  run(step: ParsedStep, ctx: StepContext): Promise<StepOutcome>;
}

const UNIT_COST = 0.005;

function buildPrompt(step: ParsedStep, ctx: StepContext): { system: string; user: string } {
  const history = ctx.previousResults.length
    ? `Prior step results:\n${ctx.previousResults.map((r, i) => `${i + 1}. ${r}`).join('\n')}`
    : 'This is the first step.';

  return {
    system: `You are ${ctx.companionName}, an autonomous money-making companion executing "${ctx.taskTitle}". Produce concrete, usable output for the current step — no filler, no disclaimers.`,
    user: `${history}\n\nCurrent step (${step.action}): ${step.title}\n${step.description}\nDeliver the actual result for this step now.`,
  };
}

async function llmStep(step: ParsedStep, ctx: StepContext, llm: LlmFn): Promise<StepOutcome> {
  const { system, user } = buildPrompt(step, ctx);
  const output = await llm(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    false
  );
  return { output: output || '(no output produced)', costUsd: UNIT_COST };
}

export function createInternalRunner(llm: LlmFn = callLLM): StepRunner {
  return {
    canHandle(action: string) {
      return ['research', 'draft', 'generate', 'analyze', 'scrape'].includes(action);
    },
    run: (step, ctx) => llmStep(step, ctx, llm),
  };
}
