import type { ParsedStep } from '@/lib/pipeline/steps';

// Step handlers turn a step into real work. Internal actions run through the
// LLM (grounded by earlier steps); external actions run live integrations from
// the user's vault via the runner registry — and never fake success.
// The engine still converts gated external actions into Approval rows first.

export interface StepContext {
  taskTitle: string;
  companionName: string;
  previousResults: string[];
  userId: string;
  userTaskId: string;
  stepIndex: number;
  /** Resolved brain for drafting; the registry binds one when omitted. */
  llm?: LlmFn;
}

export interface StepArtifact {
  kind: string; // 'FILE' | 'EMAIL' | 'POST' | 'TRADE' | 'RESEARCH'
  name: string;
  url?: string | null;
  meta?: Record<string, unknown>;
}

export interface StepOutcome {
  output: string;
  costUsd: number;
  /** True when the step could not really run (missing key/integration). */
  blocked?: boolean;
  /** Real-world deliverable produced by the step, persisted by the engine. */
  artifact?: StepArtifact;
}

export type LlmFn = (messages: { role: string; content: string }[], jsonMode?: boolean) => Promise<string>;

export interface StepRunner {
  canHandle(action: string): boolean;
  run(step: ParsedStep, ctx: StepContext): Promise<StepOutcome>;
}

export { createSkillRunner } from './runners';
