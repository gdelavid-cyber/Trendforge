/**
 * Jev Decision Model Gateway Adapter
 * Bridges bounded decision requests across:
 * 1. Native TypeSafe / Jev endpoint (https://api.typesafe.ai/v1/decide)
 * 2. Vercel AI Gateway (https://ai-gateway.vercel.sh/v1)
 * 3. OpenRouter Router (using existing OPENROUTER_API_KEY)
 */

export interface JevRequestState {
  [key: string]: any;
}

export interface JevQuestions {
  [questionKey: string]: {
    type: 'noul' | 'score' | 'choice';
    description: string;
    min?: number;
    max?: number;
    options?: string[];
  };
}

export interface JevDecisionResult {
  [questionKey: string]: any;
}

export interface JevExecutionResponse {
  decision: JevDecisionResult | null;
  latencyMs: number;
  provider: 'typesafe' | 'openrouter' | 'vercel' | 'none';
  error?: string;
}

export async function askJev(
  state: JevRequestState,
  questions: JevQuestions
): Promise<JevExecutionResponse> {
  const enabled = process.env.JEV_ENABLED !== 'false' && process.env.JEV_ENABLED !== '0';
  if (!enabled) {
    return { decision: null, latencyMs: 0, provider: 'none', error: 'JEV_DISABLED' };
  }

  const customKey = process.env.JEV_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const vercelToken = process.env.VERCEL_OIDC_TOKEN;
  const apiKey = customKey || openRouterKey || vercelToken;

  if (!apiKey || apiKey === 'placeholder_jev_key') {
    return { decision: null, latencyMs: 0, provider: 'none', error: 'NO_API_KEY' };
  }

  const baseUrl = (process.env.JEV_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/+$/, '');
  const start = Date.now();

  // Route 1: OpenRouter Gateway
  if (baseUrl.includes('openrouter.ai') || (!customKey && openRouterKey)) {
    try {
      const prompt = `You are Jev, a fast, typed, deterministic decision model. Evaluate the input state against the defined questions and output strictly valid JSON matching the question keys. Do not generate explanations or prose.

Input State:
${JSON.stringify(state, null, 2)}

Questions:
${JSON.stringify(questions, null, 2)}

Required output format:
{
  [questionKey]: {
    "probability"?: number (0.0 to 1.0 for noul),
    "confidence"?: number (0.0 to 1.0),
    "score"?: number (within defined range),
    "choice"?: string (one of the provided options)
  }
}`;

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openRouterKey || apiKey}`,
          'HTTP-Referer': 'https://trendly-platform-chi.vercel.app',
          'X-Title': 'Trendly Decision Engine',
        },
        body: JSON.stringify({
          model: 'typesafe/jev-latest',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.1,
          max_tokens: 300,
        }),
        signal: AbortSignal.timeout(1800),
      });

      const latencyMs = Date.now() - start;
      if (!res.ok) {
        return { decision: null, latencyMs, provider: 'openrouter', error: `HTTP_${res.status}` };
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        return { decision: null, latencyMs, provider: 'openrouter', error: 'EMPTY_RESPONSE' };
      }

      const parsed = JSON.parse(content);
      return { decision: parsed, latencyMs, provider: 'openrouter' };
    } catch (err: any) {
      return { decision: null, latencyMs: Date.now() - start, provider: 'openrouter', error: err.message || 'TIMEOUT' };
    }
  }

  // Route 2: Native TypeSafe or Vercel Gateway (/decide endpoint)
  try {
    const res = await fetch(`${baseUrl}/decide`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ state, questions }),
      signal: AbortSignal.timeout(1500),
    });

    const latencyMs = Date.now() - start;
    if (!res.ok) {
      return { decision: null, latencyMs, provider: 'typesafe', error: `HTTP_${res.status}` };
    }

    const data = await res.json();
    return { decision: data, latencyMs, provider: 'typesafe' };
  } catch (err: any) {
    return { decision: null, latencyMs: Date.now() - start, provider: 'typesafe', error: err.message || 'TIMEOUT' };
  }
}
