export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ModelPricing {
  promptUsdPerMillion: number;
  completionUsdPerMillion: number;
}

// Model pricing matrix (USD per 1M tokens)
const PRICING_TABLE: Record<string, ModelPricing> = {
  'anthropic/claude-3.5-sonnet': { promptUsdPerMillion: 3.0, completionUsdPerMillion: 15.0 },
  'anthropic/claude-3.7-sonnet': { promptUsdPerMillion: 3.0, completionUsdPerMillion: 15.0 },
  'openai/gpt-4o': { promptUsdPerMillion: 2.5, completionUsdPerMillion: 10.0 },
  'openai/gpt-4o-mini': { promptUsdPerMillion: 0.15, completionUsdPerMillion: 0.6 },
  'google/gemini-2.0-flash-001': { promptUsdPerMillion: 0.1, completionUsdPerMillion: 0.4 },
  'deepseek/deepseek-chat': { promptUsdPerMillion: 0.14, completionUsdPerMillion: 0.28 },
  'nvidia/nemotron-3.5-lightning:free': { promptUsdPerMillion: 0.0, completionUsdPerMillion: 0.0 },
  'google/gemma-4-31b-it:free': { promptUsdPerMillion: 0.0, completionUsdPerMillion: 0.0 },
};

export function calculateTokenCost(model: string, usage: TokenUsage): { costUsd: number; costCents: number } {
  const normalized = model.toLowerCase();
  let pricing = PRICING_TABLE[normalized];

  if (!pricing) {
    if (normalized.includes(':free')) {
      pricing = { promptUsdPerMillion: 0, completionUsdPerMillion: 0 };
    } else if (normalized.includes('mini') || normalized.includes('flash')) {
      pricing = { promptUsdPerMillion: 0.2, completionUsdPerMillion: 0.8 };
    } else {
      pricing = { promptUsdPerMillion: 2.5, completionUsdPerMillion: 10.0 };
    }
  }

  const promptCost = (usage.promptTokens / 1_000_000) * pricing.promptUsdPerMillion;
  const completionCost = (usage.completionTokens / 1_000_000) * pricing.completionUsdPerMillion;
  const costUsd = Number((promptCost + completionCost).toFixed(6));
  const costCents = Math.round(costUsd * 100);

  return { costUsd, costCents };
}
