export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  response_format?: { type: 'json_object' | 'text' };
  stream?: boolean;
}

export interface OpenRouterUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: string;
  }[];
  usage: OpenRouterUsage;
  model: string;
}

export class OpenRouterError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

export const MODEL_TIERS = {
  cheap: {
    primary: 'anthropic/claude-3-haiku',
    fallback: 'openai/gpt-4o-mini',
    useFor: ['discovery', 'logging', 'delivery', 'simple_analysis'],
    temperature: 0.3,
    maxTokens: 4096,
    costCapPerCall: 0.02,
  },
  standard: {
    primary: 'openai/gpt-4o-mini',
    fallback: 'anthropic/claude-3-haiku',
    useFor: ['listing', 'outreach', 'validation', 'analysis'],
    temperature: 0.5,
    maxTokens: 8192,
    costCapPerCall: 0.10,
  },
  premium: {
    primary: 'anthropic/claude-3.5-sonnet',
    fallback: 'openai/gpt-4o',
    useFor: ['building', 'closing', 'dispute_handling', 'strategy', 'master'],
    temperature: 0.7,
    maxTokens: 16384,
    costCapPerCall: 0.50,
  },
  // Legacy aliases for backward compatibility
  master: {
    primary: 'anthropic/claude-3.5-sonnet',
    fallback: 'openai/gpt-4o',
    temperature: 0.7,
    maxTokens: 4096,
    costCapPerCall: 0.50,
  },
  discovery: {
    primary: 'anthropic/claude-3-haiku',
    fallback: 'openai/gpt-4o-mini',
    temperature: 0.3,
    maxTokens: 2048,
    costCapPerCall: 0.02,
  },
  building: {
    primary: 'anthropic/claude-3.5-sonnet',
    fallback: 'openai/gpt-4o',
    temperature: 0.8,
    maxTokens: 8192,
    costCapPerCall: 0.50,
  },
  validation: {
    primary: 'openai/gpt-4o-mini',
    fallback: 'anthropic/claude-3-haiku',
    temperature: 0.2,
    maxTokens: 4096,
    costCapPerCall: 0.05,
  },
  outreach: {
    primary: 'anthropic/claude-3.5-sonnet',
    fallback: 'openai/gpt-4o',
    temperature: 0.6,
    maxTokens: 2048,
    costCapPerCall: 0.10,
  },
  logging: {
    primary: 'openai/gpt-4o-mini',
    fallback: 'meta-llama/llama-3.1-8b-instruct',
    temperature: 0.0,
    maxTokens: 1024,
    costCapPerCall: 0.02,
  },
} as const;

export type ModelTierKey = keyof typeof MODEL_TIERS;

// Cost per 1M tokens in USD [Prompt, Completion]
const MODEL_PRICING: Record<string, [number, number]> = {
  'anthropic/claude-3.5-sonnet': [3.0, 15.0],
  'anthropic/claude-3-haiku': [0.25, 1.25],
  'openai/gpt-4o': [2.5, 10.0],
  'openai/gpt-4o-mini': [0.15, 0.6],
  'meta-llama/llama-3.1-70b-instruct': [0.35, 0.4],
  'meta-llama/llama-3.1-8b-instruct': [0.05, 0.05],
  'openrouter/auto': [0.5, 1.5],
  'auto': [0.5, 1.5],
};

export function calculateCost(usage: OpenRouterUsage, model: string): number {
  const pricing = MODEL_PRICING[model] || [0.5, 1.5];
  const promptCost = (usage.prompt_tokens / 1_000_000) * pricing[0];
  const completionCost = (usage.completion_tokens / 1_000_000) * pricing[1];
  return Math.max(0.0001, parseFloat((promptCost + completionCost).toFixed(6)));
}

interface FallbackProvider {
  provider: string;
  apiKey: string;
  baseUrl: string;
}

export class OpenRouterClient {
  private apiKey: string;
  private baseUrl: string = 'https://openrouter.ai/api/v1';
  private fallbackProviders: FallbackProvider[] = [];

  constructor(apiKey?: string, fallbackProviders?: FallbackProvider[]) {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || '';
    this.fallbackProviders = fallbackProviders || [
      {
        provider: 'inferhub',
        apiKey: process.env.INFERHUB_API_KEY || '',
        baseUrl: process.env.INFERHUB_BASE_URL ? `${process.env.INFERHUB_BASE_URL.replace(/\/$/, '')}` : 'https://api.inferhub.dev/v1',
      },
      {
        provider: 'anthropic',
        apiKey: process.env.ANTHROPIC_API_KEY || '',
        baseUrl: 'https://api.anthropic.com/v1',
      },
      {
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY || '',
        baseUrl: 'https://api.openai.com/v1',
      },
    ];
  }

  async chatCompletion(
    request: OpenRouterRequest,
    tier: 'cheap' | 'standard' | 'premium' = 'standard'
  ): Promise<OpenRouterResponse> {
    // 1. Primary: OpenRouter
    if (this.apiKey && this.apiKey.trim().length > 5 && !this.apiKey.includes('your_openrouter')) {
      try {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://trendly-platform-chi.vercel.app',
            'X-Title': 'Trendly Swarm',
          },
          body: JSON.stringify({
            ...request,
            model: request.model || MODEL_TIERS[tier].primary,
            max_tokens: request.max_tokens || MODEL_TIERS[tier].maxTokens,
          }),
          signal: AbortSignal.timeout(120000),
        });

        if (response.ok) {
          const data = await response.json();
          return data;
        }
        
        // If 402 (insufficient credits) or rate-limited, try OpenRouter's free high-quality models
        if (response.status === 402 || response.status === 429 || response.status === 404) {
          try {
            const freeRes = await fetch(`${this.baseUrl}/chat/completions`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://trendly-platform-chi.vercel.app',
                'X-Title': 'Trendly Swarm',
              },
              body: JSON.stringify({
                ...request,
                model: 'meta-llama/llama-3.3-70b-instruct:free',
                max_tokens: Math.min(request.max_tokens || 4096, 4096),
              }),
              signal: AbortSignal.timeout(60000),
            });
            if (freeRes.ok) {
              return await freeRes.json();
            }
          } catch {
            // Proceed to secondary fallback
          }
        }

        console.warn(`OpenRouter primary error ${response.status}. Trying fallback providers...`);
      } catch (err) {
        console.warn('OpenRouter connection failed. Trying direct fallback providers:', err);
      }
    }

    // 2. Direct Provider Fallbacks
    for (const provider of this.fallbackProviders) {
      if (provider.apiKey && provider.apiKey.trim().length > 5 && !provider.apiKey.includes('your_')) {
        try {
          const fallbackModel = provider.provider === 'inferhub'
            ? (process.env.INFERHUB_MODEL || 'gemini-3.6-flash')
            : MODEL_TIERS[tier].fallback;
          const headers: Record<string, string> = {
            'Authorization': `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json',
          };
          if (provider.provider === 'inferhub') {
            headers['x-api-key'] = provider.apiKey;
          }
          const response = await fetch(`${provider.baseUrl}/chat/completions`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              ...request,
              model: fallbackModel,
              max_tokens: request.max_tokens || MODEL_TIERS[tier].maxTokens,
            }),
            signal: AbortSignal.timeout(120000),
          });

          if (response.ok) {
            return await response.json();
          }
        } catch {
          continue;
        }
      }
    }

    // 3. Strict Real Mode: Reject unauthenticated/mock fallback
    throw new Error('Real LLM provider required: OpenRouter and configured fallback credentials were uncontactable or missing.');
  }

  async *chatCompletionStream(request: OpenRouterRequest): AsyncGenerator<string> {
    if (this.apiKey && this.apiKey.trim().length > 5 && !this.apiKey.includes('your_openrouter')) {
      try {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://trendly-platform-chi.vercel.app',
            'X-Title': 'Trendly Swarm',
          },
          body: JSON.stringify({ ...request, stream: true }),
        });

        if (response.ok && response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
            for (const line of lines) {
              const data = line.slice(6);
              if (data === '[DONE]') return;
              try {
                const parsed = JSON.parse(data);
                yield parsed.choices[0]?.delta?.content || '';
              } catch {
                // Ignore parse error
              }
            }
          }
          return;
        }
      } catch (err) {
        console.warn('Stream failed, streaming cognitive fallback:', err);
      }
    }

    throw new Error('Streaming failed: active OpenRouter API credentials required for live model stream.');
  }

}

export const openRouterClient = new OpenRouterClient();
