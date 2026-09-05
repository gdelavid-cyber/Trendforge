import { prisma } from '@/lib/core/db';
import { decryptSecret } from '@/lib/core/encryption';
import type { LlmFn } from '@/lib/execution/llm';

// Bring-your-own-key companion brain. A user's saved provider+key outranks
// platform defaults everywhere a brain runs (engine steps, Talk chat).

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface UserLlmConfig {
  provider: string;
  model: string;
  baseUrl: string | null;
  apiKey: string;
}

export async function getUserLlmConfig(userId: string): Promise<UserLlmConfig | null> {
  const row = await prisma.userLlmKey.findUnique({ where: { userId } });
  if (!row) return null;
  try {
    const apiKey = decryptSecret(row.encryptedKey);
    if (!apiKey) return null;
    return {
      provider: row.provider,
      model: row.model,
      baseUrl: row.baseUrl,
      apiKey,
    };
  } catch {
    return null;
  }
}

function endpointFor(cfg: UserLlmConfig): string {
  if (cfg.provider === 'openrouter') return OPENROUTER_URL;
  // Custom OpenAI-compatible endpoints (OpenCode Zen, local gateways, etc.)
  const base = cfg.baseUrl?.replace(/\/+$/, '') || '';
  if (!base) throw new Error('Custom provider requires a base URL');
  return base.endsWith('/chat/completions') ? base : `${base}/chat/completions`;
}

export function openAiCompatibleLlm(cfg: UserLlmConfig): LlmFn {
  return async (messages, jsonMode = false) => {
    const endpoint = endpointFor(cfg);
    const body: Record<string, unknown> = {
      model: cfg.model,
      messages,
      max_tokens: 4000,
    };
    if (jsonMode) body.response_format = { type: 'json_object' };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`,
        ...(cfg.provider === 'openrouter'
          ? { 'HTTP-Referer': process.env.NEXTAUTH_URL ?? 'https://trendly.app', 'X-Title': 'Trendly' }
          : {}),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Brain request failed (${res.status}): ${text.slice(0, 200)}`);
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? '';
  };
}

/** The user's own brain, or null when they haven't connected one. */
export async function getUserLlm(userId: string): Promise<LlmFn | null> {
  const cfg = await getUserLlmConfig(userId);
  return cfg ? openAiCompatibleLlm(cfg) : null;
}
