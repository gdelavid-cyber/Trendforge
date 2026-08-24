import type { LlmFn } from '../skills';
import type { ParsedStep } from '@/lib/tasks/steps';
import { getIntegration } from '@/lib/integrations/vault';

// Polymarket trade steps. v1 honesty boundary: the runner pulls REAL market
// data (Gamma public API) and stages a concrete order ticket, but does not
// sign or route orders — live routing requires the official CLOB client's
// EIP-712 order signing and lands with the funded-agent work. No fake fills,
// no invented money.

export interface StagedOrder {
  market: string;
  outcome: string;
  price: number;
  sizeUsdc: number;
  source: string;
}

interface GammaMarket {
  question?: string;
  outcomes?: string;
  outcomePrices?: string;
  slug?: string;
}

export async function fetchMarketContext(query: string): Promise<{ market: string; outcomes: string[]; prices: number[] } | null> {
  const res = await fetch(
    `https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=20&order=volume24hr&ascending=false`,
    { signal: AbortSignal.timeout(10_000) }
  );
  if (!res.ok) return null;
  const markets: GammaMarket[] = await res.json();
  const q = query.toLowerCase();
  const words = q.split(/\W+/).filter((w) => w.length > 3);
  const scored = markets
    .map((m) => {
      const text = `${m.question ?? ''}`.toLowerCase();
      const score = words.filter((w) => text.includes(w)).length;
      return { m, score };
    })
    .sort((a, b) => b.score - a.score);

  const best = scored[0]?.m;
  if (!best?.question) return null;

  let outcomes: string[] = [];
  let prices: number[] = [];
  try { outcomes = JSON.parse(best.outcomes ?? '[]'); } catch {}
  try { prices = (JSON.parse(best.outcomePrices ?? '[]') as string[]).map(Number); } catch {}
  return { market: best.question, outcomes, prices };
}

export async function runTradeStep(params: {
  step: ParsedStep;
  taskTitle: string;
  previousResults: string[];
  llm: LlmFn;
  hasPolymarketKey: boolean;
}): Promise<{ output: string; order: StagedOrder; live: boolean }> {
  const { step, previousResults, llm, hasPolymarketKey } = params;

  const marketContext = await fetchMarketContext(`${step.title} ${step.description}`);
  if (!marketContext) {
    throw new Error('Could not reach Polymarket market data (Gamma API) — trade not staged.');
  }

  const decision = await llm([
    {
      role: 'system',
      content: `You are a trading assistant executing "${params.taskTitle}". Given the step and the live market below, output STRICT JSON: {"outcome": string, "sizeUsdc": number, "reasoning": string}. outcome MUST be one of the listed outcomes. sizeUsdc is the stake in USDC (max 50).`,
    },
    {
      role: 'user',
      content: `Step: ${step.title}\n${step.description}\n\n${previousResults.length ? `Context:\n${previousResults.slice(-2).join('\n')}\n\n` : ''}Live market: ${marketContext.market}\nOutcomes: ${marketContext.outcomes.join(', ')}\nPrices: ${marketContext.prices.join(', ')}`,
    },
  ], true);

  let outcome = marketContext.outcomes[0] ?? 'YES';
  let sizeUsdc = 10;
  let reasoning = '';
  try {
    const parsed = JSON.parse(decision ?? '{}');
    if (typeof parsed.outcome === 'string' && marketContext.outcomes.includes(parsed.outcome)) outcome = parsed.outcome;
    if (typeof parsed.sizeUsdc === 'number' && parsed.sizeUsdc > 0) sizeUsdc = Math.min(50, parsed.sizeUsdc);
    if (typeof parsed.reasoning === 'string') reasoning = parsed.reasoning;
  } catch {
    reasoning = decision?.slice(0, 400) ?? '';
  }

  const idx = Math.max(0, marketContext.outcomes.indexOf(outcome));
  const price = marketContext.prices[idx] ?? 0.5;

  const order: StagedOrder = {
    market: marketContext.market,
    outcome,
    price,
    sizeUsdc,
    source: 'polymarket-gamma',
  };

  const liveNote = hasPolymarketKey
    ? 'Polymarket key connected — live CLOB order routing lands with the funded-agent release; this ticket is staged, NOT filled, and no funds moved.'
    : 'No Polymarket key connected — this ticket is a staged plan only. Connect a key in Profile → Action Integrations when live routing ships.';

  return {
    output: [
      'STAGED TRADE TICKET (no funds moved)',
      `Market: ${order.market}`,
      `Outcome: ${order.outcome} @ ${order.price}`,
      `Stake: $${order.sizeUsdc.toFixed(2)} USDC`,
      reasoning ? `Reasoning: ${reasoning}` : '',
      liveNote,
    ].filter(Boolean).join('\n'),
    order,
    live: false,
  };
}
