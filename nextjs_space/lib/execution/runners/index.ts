import type { LlmFn, StepContext, StepOutcome } from '../skills';
import type { ParsedStep } from '@/lib/tasks/steps';
import { getIntegration } from '@/lib/integrations/vault';
import { runResearchStep } from './research';
import { runEmailStep, hasEmailProvider } from './email';
import { draftTweetText, postTweet } from './social';
import { runFileStep } from './file';
import { runTradeStep } from './trade';

// Skill runner registry: maps step actions to real work. Internal actions run
// through the LLM (grounded by earlier steps); external actions run real
// integrations from the user's vault — and NEVER fake success: a missing key
// resolves to a blocked outcome with guidance instead of invented output.

export const INTERNAL_ACTIONS = new Set(['draft', 'generate', 'analyze']);
export const RESEARCH_ACTIONS = new Set(['research', 'scrape']);
export const EXTERNAL_ACTIONS = new Set(['send', 'post', 'deploy', 'trade', 'export']);

function blockedNeedingKey(provider: string, label: string): StepOutcome {
  return {
    output: `BLOCKED — this step needs a ${label} key. Connect it in Profile → Action Integrations ("${provider}") and re-run the step. Nothing was faked or sent.`,
    blocked: true,
    costUsd: 0,
  };
}

async function llmFallback(step: ParsedStep, ctx: StepContext, llm: LlmFn): Promise<StepOutcome> {
  const history = ctx.previousResults.length
    ? `Prior step results:\n${ctx.previousResults.map((r, i) => `${i + 1}. ${r}`).join('\n')}`
    : 'This is the first step.';
  const output = await llm([
    {
      role: 'system',
      content: `You are ${ctx.companionName}, an autonomous money-making companion executing "${ctx.taskTitle}". Produce concrete, usable output for the current step — no filler, no disclaimers.`,
    },
    {
      role: 'user',
      content: `${history}\n\nCurrent step (${step.action}): ${step.title}\n${step.description}\nDeliver the actual result for this step now.`,
    },
  ]);
  return { output: output || '(no output produced)', costUsd: 0.005 };
}

export function createSkillRunner(llm: LlmFn) {
  return {
    canHandle(action: string): boolean {
      return INTERNAL_ACTIONS.has(action) || RESEARCH_ACTIONS.has(action) || EXTERNAL_ACTIONS.has(action);
    },
    async run(step: ParsedStep, ctx: StepContext): Promise<StepOutcome> {
      const boundLlm: LlmFn = ctx.llm ?? llm;

      // --- Live research ---
      if (RESEARCH_ACTIONS.has(step.action)) {
        try {
          const result = await runResearchStep(step, {
            userId: ctx.userId,
            taskTitle: ctx.taskTitle,
            llm: boundLlm,
          });
          return {
            output: result.output,
            costUsd: 0.005,
            artifact: { kind: 'RESEARCH', name: step.title, meta: { sources: result.sources } },
          };
        } catch (err: any) {
          return { output: `Research failed: ${err.message} (no data was invented)`, blocked: true, costUsd: 0 };
        }
      }

      // --- External: email ---
      if (step.action === 'send') {
        const provider = await hasEmailProvider(ctx.userId);
        if (!provider) return blockedNeedingKey('sendgrid or resend', 'email delivery');
        try {
          const result = await runEmailStep({
            step, userId: ctx.userId, taskTitle: ctx.taskTitle,
            previousResults: ctx.previousResults, llm: boundLlm,
          });
          return {
            output: result.output,
            costUsd: 0.005,
            artifact: {
              kind: 'EMAIL', name: result.subject, url: null,
              meta: { provider: result.provider, recipient: result.recipient, messageId: result.messageId },
            },
          };
        } catch (err: any) {
          return { output: `Email delivery failed: ${err.message}`, blocked: true, costUsd: 0 };
        }
      }

      // --- External: social post ---
      if (step.action === 'post') {
        const creds = (await getIntegration(ctx.userId, 'x')) as { accessToken?: string } | null;
        if (!creds?.accessToken) return blockedNeedingKey('x', 'X/Twitter posting');
        try {
          const text = await draftTweetText({ step, taskTitle: ctx.taskTitle, previousResults: ctx.previousResults, llm: boundLlm });
          const posted = await postTweet(creds.accessToken, text);
          return {
            output: `Posted to X: ${posted.url}\n\n${text}`,
            costUsd: 0.005,
            artifact: { kind: 'POST', name: text.slice(0, 80), url: posted.url, meta: { postId: posted.postId } },
          };
        } catch (err: any) {
          return { output: `X post failed: ${err.message}`, blocked: true, costUsd: 0 };
        }
      }

      // --- Deliverable file ---
      if (step.action === 'export') {
        try {
          const result = await runFileStep({
            step, userId: ctx.userId, userTaskId: ctx.userTaskId, stepIndex: ctx.stepIndex,
            previousResults: ctx.previousResults, llm: boundLlm,
          });
          return {
            output: result.output,
            costUsd: 0.005,
            artifact: {
              kind: 'FILE', name: result.fileName, url: result.url,
              meta: { format: result.format, bytes: result.content.length, inline: result.url === null },
            },
          };
        } catch (err: any) {
          return { output: `File generation failed: ${err.message}`, blocked: true, costUsd: 0 };
        }
      }

      // --- External: trade ---
      if (step.action === 'trade') {
        const creds = await getIntegration(ctx.userId, 'polymarket');
        try {
          const result = await runTradeStep({
            step, taskTitle: ctx.taskTitle, previousResults: ctx.previousResults,
            llm: boundLlm, hasPolymarketKey: Boolean(creds),
          });
          return {
            output: result.output,
            costUsd: 0.005,
            artifact: {
              kind: 'TRADE', name: `${result.order.outcome} @ ${result.order.price} — ${result.order.market.slice(0, 60)}`,
              url: null, meta: { ...result.order, live: result.live },
            },
          };
        } catch (err: any) {
          return { output: `Trade staging failed: ${err.message}`, blocked: true, costUsd: 0 };
        }
      }

      // --- External: deploy (no integration yet) ---
      if (step.action === 'deploy') {
        return {
          output: 'BLOCKED — deployment automation is not wired yet. Do this step manually for now; the engine will never pretend a deploy happened.',
          blocked: true,
          costUsd: 0,
        };
      }

      // --- Internal LLM actions ---
      return llmFallback(step, ctx, boundLlm);
    },
  };
}
