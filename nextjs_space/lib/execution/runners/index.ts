import type { LlmFn, StepContext, StepOutcome } from '../skills';
import type { ParsedStep } from '@/lib/pipeline/steps';
import { getIntegration } from '@/lib/core/vault';
import { runResearchStep } from './research';
import { runEmailStep, hasEmailProvider } from './email';
import { draftTweetText, postTweet } from './social';
import { runFileStep } from './file';
import { runTradeStep } from './trade';
import { runVoiceStep } from './voice';
import { runVideoStep } from './video';
import { runSalesStep } from './sales';

import { guaranteeTurnkeyExecution } from '../guarantee';

// Skill runner registry: maps step actions to real work. Internal actions run
// through the LLM (grounded by earlier steps); external actions run real
// integrations from the user's vault — and NEVER fake success: a missing key
// resolves to a blocked outcome with guidance instead of invented output.

export const INTERNAL_ACTIONS = new Set(['draft', 'generate', 'analyze', 'write', 'build']);
export const RESEARCH_ACTIONS = new Set(['research', 'scrape']);
export const VOICE_ACTIONS = new Set(['voice', 'record', 'audio', 'podcast', 'speech']);
export const VIDEO_ACTIONS = new Set(['video', 'tiktok', 'youtube', 'reels', 'storyboard', 'film']);
export const SALES_ACTIONS = new Set(['sales', 'outreach', 'pitch', 'close', 'offer', 'prospect', 'market']);
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
  const rawOutput = await llm([
    {
      role: 'system',
      content: `You are ${ctx.companionName}, an autonomous money-making companion executing "${ctx.taskTitle}".
Produce exhaustive, 100% turnkey and production-ready output for the current step.
- NO placeholders (e.g. do not write "[insert here]", "TODO", or "...rest of code goes here").
- Provide complete working files, code snippets, copy, or step-by-step implementation details.
- Provide maximum practical depth.`,
    },
    {
      role: 'user',
      content: `${history}\n\nCurrent step (${step.action}): ${step.title}\n${step.description}\nDeliver the complete, unshortened 100% turnkey result for this step now.`,
    },
  ]);

  const output = await guaranteeTurnkeyExecution({
    output: rawOutput || '(no output produced)',
    stepTitle: step.title,
    stepAction: step.action,
    taskTitle: ctx.taskTitle,
    companionName: ctx.companionName,
    llm,
  });

  return { output, costUsd: 0.005 };
}

export function createSkillRunner(llm: LlmFn) {
  return {
    canHandle(action: string): boolean {
      return (
        INTERNAL_ACTIONS.has(action) ||
        RESEARCH_ACTIONS.has(action) ||
        VOICE_ACTIONS.has(action) ||
        VIDEO_ACTIONS.has(action) ||
        SALES_ACTIONS.has(action) ||
        EXTERNAL_ACTIONS.has(action)
      );
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

      // --- Spoken Voice Message & Audio Note ---
      if (VOICE_ACTIONS.has(step.action)) {
        try {
          const result = await runVoiceStep({
            step,
            taskTitle: ctx.taskTitle,
            previousResults: ctx.previousResults,
            llm: boundLlm,
            companionName: ctx.companionName,
          });
          return {
            output: result.output,
            costUsd: 0.005,
            artifact: {
              kind: 'VOICE',
              name: `Voice Note: ${step.title.slice(0, 60)}`,
              url: null,
              meta: {
                transcript: result.transcript,
                voiceProfile: result.voiceProfile,
                audioScript: result.audioScript,
                durationSec: result.voiceProfile.targetDurationSec,
              },
            },
          };
        } catch (err: any) {
          return { output: `Voice synthesis failed: ${err.message}`, blocked: true, costUsd: 0 };
        }
      }

      // --- Short-Form Video, TikTok & Shorts Storyboard ---
      if (VIDEO_ACTIONS.has(step.action)) {
        try {
          const result = await runVideoStep({
            step,
            taskTitle: ctx.taskTitle,
            previousResults: ctx.previousResults,
            llm: boundLlm,
          });
          return {
            output: result.output,
            costUsd: 0.005,
            artifact: {
              kind: 'VIDEO',
              name: `Short-Form Video: ${result.title.slice(0, 60)}`,
              url: null,
              meta: {
                title: result.title,
                format: result.format,
                hook: result.hook,
                scenes: result.scenes,
                caption: result.caption,
                hashtags: result.hashtags,
                viewsPotential: result.estimatedViewsPotential,
              },
            },
          };
        } catch (err: any) {
          return { output: `Video production package failed: ${err.message}`, blocked: true, costUsd: 0 };
        }
      }

      // --- Sales, Outreach & Monetization Pitch ---
      if (SALES_ACTIONS.has(step.action)) {
        try {
          const result = await runSalesStep({
            step,
            taskTitle: ctx.taskTitle,
            previousResults: ctx.previousResults,
            llm: boundLlm,
            companionName: ctx.companionName,
          });
          return {
            output: result.output,
            costUsd: 0.005,
            artifact: {
              kind: 'SALES',
              name: `Sales Campaign: ${step.title.slice(0, 60)}`,
              url: null,
              meta: {
                targetPersona: result.targetPersona,
                valueProposition: result.valueProposition,
                pricingOffer: result.pricingOffer,
                outreachSequence: result.outreachSequence,
                objectionHandling: result.objectionHandling,
              },
            },
          };
        } catch (err: any) {
          return { output: `Sales outreach package failed: ${err.message}`, blocked: true, costUsd: 0 };
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
