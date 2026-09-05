import { makeLlm } from '@/lib/execution/llm';
import { callLLM } from '@/lib/pipeline';
import { getNovaBriefing, renderBriefingText, type NovaBriefing } from '@/lib/growth/nova/reads';
import { listTools } from '@/lib/growth/nova/tools';
import { recentTraces, renderTraceText } from '@/lib/growth/nova/traces';

// Direction A — Nova thinks via OpenCode. The brain is READ-ONLY by
// construction: it produces text. Tool execution stays behind Approval
// rows (N2 law); the prompt below states this explicitly so the model
// can propose but never claim to have acted.

export function buildNovaSystemPrompt(
  briefing: NovaBriefing,
  traceLines: string[],
  historyLines: string[]
): string {
  const tools = listTools()
    .map((t) => `- ${t.name}: ${t.description} [${t.requiresApproval ? 'needs user approval' : `immediate, ${t.creditCost} credits`}]`)
    .join('\n');
  return [
    'You are Nova, the interface to the entire Trendly system — not a chatbot beside it.',
    'Rules you must obey:',
    '1. You cannot execute anything. To act, propose a tool call and tell the user to approve it in the Approvals inbox. Never claim you ran, bought, claimed, deployed, or sent anything.',
    '2. Never state a number you were not given below. If data is missing, say what is missing, never guess.',
    '3. Estimates are estimates: label them as such every time.',
    '4. Keep replies under 120 words unless the user asks for detail.',
    '',
    `LIVE POSITION (generated ${briefing.generatedAt}):`,
    renderBriefingText(briefing),
    '',
    'TOOL CATALOG (propose by name; approval-gated ones wait for the user):',
    tools,
    traceLines.length > 0 ? `\nRECENT DECISIONS (why-things-happened):\n${traceLines.join('\n')}` : '',
    historyLines.length > 0 ? `\nTHIS CONVERSATION SO FAR:\n${historyLines.join('\n')}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

// Provider-neutral brain routing: direct API first (fast, stateless),
// opencode chain second (local dev, free models), deterministic pipeline
// last (the chat route's fallback). callLLM fabricates procedural content
// when no API key is set, so it is only trusted when a key exists.
async function novaBrainLlm(messages: { role: string; content: string }[]): Promise<string> {
  if (process.env.OPENAI_API_KEY || process.env.ABACUSAI_API_KEY) {
    try {
      const direct = await callLLM(messages);
      if (direct && direct.trim().length > 0) return direct;
    } catch (e: any) {
      console.warn('[NOVA] direct LLM failed, trying opencode chain:', e?.message ?? e);
    }
  }
  return makeLlm()(messages);
}

export async function answerWithOpenCodeBrain(
  userId: string,
  userRole: string,
  message: string,
  history: { role: string; content: string }[]
): Promise<{ reply: string; grounded: Record<string, unknown> }> {
  const [briefing, traces] = await Promise.all([
    getNovaBriefing(userId, userRole),
    recentTraces(userId, { limit: 3 }),
  ]);
  const system = buildNovaSystemPrompt(
    briefing,
    traces.map(renderTraceText),
    history.slice(-10).map((h) => `${h.role === 'user' ? 'User' : 'Nova'}: ${h.content.slice(0, 500)}`)
  );
  const raw = await novaBrainLlm([
    { role: 'system', content: system },
    { role: 'user', content: message.slice(0, 2000) },
  ]);
  const reply = raw.trim().slice(0, 2000);
  if (!reply) throw new Error('Brain returned an empty reply.');
  return { reply, grounded: { source: 'opencode-brain', generatedAt: briefing.generatedAt } };
}
